/**
 * @jest-environment jsdom
 */

import {
  AutoTrackerRegistry,
  IAutoTracker,
  TrackerRegistration,
  BaseAutoTracker,
} from '../../../features/auto-tracking';
import Logger from '../../../infrastructure/logger';
import Store from '../../../infrastructure/store';
import { Config } from '../../../types';

// Mock tracker for testing
interface MockTrackerConfig {
  enabled?: boolean;
  testOption?: string;
}

interface MockEventData {
  event: string;
  timestamp: number;
}

class MockTracker extends BaseAutoTracker<MockTrackerConfig, MockEventData> {
  readonly name = 'mock';
  readonly configKey = 'autoTrackMock';

  public attachCount = 0;
  public detachCount = 0;

  protected attachListeners(): void {
    this.attachCount++;
  }

  protected detachListeners(): void {
    this.detachCount++;
  }

  // Expose for testing
  triggerEvent(event: string): void {
    if (this.enabled) {
      this.callback({ event, timestamp: Date.now() });
    }
  }
}

const mockTrackerRegistration: TrackerRegistration<MockTrackerConfig, MockEventData> = {
  name: 'mock',
  configKey: 'autoTrackClicks' as keyof Config, // Use existing config key for testing
  factory: (sdkConfig, config, callback, logger) => new MockTracker(sdkConfig, config, callback, logger),
  normalizeConfig: (raw) => {
    if (raw === undefined || raw === false) return null;
    if (raw === true) return { enabled: true };
    if (typeof raw === 'object' && (raw as any).enabled === false) return null;
    return raw as MockTrackerConfig;
  },
};

describe('AutoTrackerRegistry', () => {
  let registry: AutoTrackerRegistry;
  let mockLogger: Logger;
  let mockConfig: Config;
  let trackedEvents: MockEventData[];

  beforeEach(() => {
    // Create fresh registry for each test
    registry = new AutoTrackerRegistry();
    trackedEvents = [];

    mockConfig = {
      apiKey: 'test-key',
      debug: false,
    };

    Store.dispatch({ config: mockConfig });
    mockLogger = new Logger(Store.store);
  });

  afterEach(() => {
    registry.destroyAll();
  });

  describe('register()', () => {
    it('should register a tracker', () => {
      registry.register(mockTrackerRegistration);

      expect(registry.getRegisteredTrackers()).toContain('mock');
    });

    it('should allow registering multiple trackers', () => {
      registry.register(mockTrackerRegistration);
      registry.register({
        ...mockTrackerRegistration,
        name: 'another',
      });

      expect(registry.getRegisteredTrackers()).toHaveLength(2);
      expect(registry.getRegisteredTrackers()).toContain('mock');
      expect(registry.getRegisteredTrackers()).toContain('another');
    });

    it('should overwrite existing registration with same name', () => {
      registry.register(mockTrackerRegistration);
      registry.register({
        ...mockTrackerRegistration,
        name: 'mock',
        configKey: 'debug' as keyof Config,
      });

      // Only one registration with name 'mock'
      expect(registry.getRegisteredTrackers().filter((n) => n === 'mock')).toHaveLength(1);
    });
  });

  describe('initAll()', () => {
    beforeEach(() => {
      registry.register(mockTrackerRegistration);
    });

    it('should initialize configured tracker', () => {
      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      expect(registry.getActiveTrackers()).toContain('mock');
    });

    it('should not initialize tracker when config is false', () => {
      const configWithoutTracking: Config = {
        ...mockConfig,
        autoTrackClicks: false,
      };

      registry.initAll(
        configWithoutTracking,
        { mock: (data) => trackedEvents.push(data as MockEventData) },
        mockLogger,
      );

      expect(registry.getActiveTrackers()).not.toContain('mock');
    });

    it('should not initialize tracker when config is undefined', () => {
      registry.initAll(mockConfig, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      expect(registry.getActiveTrackers()).not.toContain('mock');
    });

    it('should not initialize when callback is missing', () => {
      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      // Pass empty callbacks
      registry.initAll(configWithTracking, {}, mockLogger);

      expect(registry.getActiveTrackers()).not.toContain('mock');
    });

    it('should enable tracker after initialization', () => {
      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      const tracker = registry.get<MockTracker>('mock');
      expect(tracker?.isEnabled()).toBe(true);
      expect(tracker?.attachCount).toBe(1);
    });

    it('should handle factory errors gracefully', () => {
      const errorRegistration: TrackerRegistration<MockTrackerConfig, MockEventData> = {
        name: 'error',
        configKey: 'autoTrackClicks' as keyof Config,
        factory: () => {
          throw new Error('Factory error');
        },
        normalizeConfig: () => ({ enabled: true }),
      };

      registry.register(errorRegistration);

      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      // Should not throw
      expect(() => {
        registry.initAll(
          configWithTracking,
          { error: (data) => trackedEvents.push(data as MockEventData) },
          mockLogger,
        );
      }).not.toThrow();

      expect(registry.getActiveTrackers()).not.toContain('error');
    });
  });

  describe('get()', () => {
    beforeEach(() => {
      registry.register(mockTrackerRegistration);
    });

    it('should return tracker by name', () => {
      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      const tracker = registry.get('mock');
      expect(tracker).toBeDefined();
      expect(tracker?.name).toBe('mock');
    });

    it('should return undefined for non-existent tracker', () => {
      expect(registry.get('nonexistent')).toBeUndefined();
    });

    it('should return undefined for registered but not initialized tracker', () => {
      // Config doesn't enable the tracker
      registry.initAll(mockConfig, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      expect(registry.get('mock')).toBeUndefined();
    });
  });

  describe('enable() and disable()', () => {
    beforeEach(() => {
      registry.register(mockTrackerRegistration);

      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);
    });

    it('should enable a tracker by name', () => {
      const tracker = registry.get<MockTracker>('mock')!;
      tracker.disable();
      expect(tracker.isEnabled()).toBe(false);

      const result = registry.enable('mock');
      expect(result).toBe(true);
      expect(tracker.isEnabled()).toBe(true);
    });

    it('should disable a tracker by name', () => {
      const tracker = registry.get<MockTracker>('mock')!;
      expect(tracker.isEnabled()).toBe(true);

      const result = registry.disable('mock');
      expect(result).toBe(true);
      expect(tracker.isEnabled()).toBe(false);
    });

    it('should return false when enabling non-existent tracker', () => {
      expect(registry.enable('nonexistent')).toBe(false);
    });

    it('should return false when disabling non-existent tracker', () => {
      expect(registry.disable('nonexistent')).toBe(false);
    });
  });

  describe('destroyAll()', () => {
    beforeEach(() => {
      registry.register(mockTrackerRegistration);

      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);
    });

    it('should destroy all active trackers', () => {
      const tracker = registry.get<MockTracker>('mock')!;
      expect(tracker.detachCount).toBe(0);

      registry.destroyAll();

      expect(tracker.detachCount).toBe(1);
      expect(registry.getActiveTrackers()).toHaveLength(0);
    });

    it('should handle errors during destroy gracefully', () => {
      // Create a tracker that throws on destroy
      const errorTracker: IAutoTracker = {
        name: 'error',
        configKey: 'autoTrackError',
        enable: jest.fn(),
        disable: jest.fn(),
        destroy: () => {
          throw new Error('Destroy error');
        },
        isEnabled: () => true,
      };

      // Manually add to active trackers (hacky but necessary for this test)
      (registry as any).activeTrackers.set('error', errorTracker);

      // Should not throw
      expect(() => registry.destroyAll()).not.toThrow();
    });
  });

  describe('reset()', () => {
    beforeEach(() => {
      registry.register(mockTrackerRegistration);

      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);
    });

    it('should clear active trackers but preserve registrations', () => {
      expect(registry.getActiveTrackers()).toHaveLength(1);
      expect(registry.getRegisteredTrackers()).toHaveLength(1);

      registry.reset();

      expect(registry.getActiveTrackers()).toHaveLength(0);
      expect(registry.getRegisteredTrackers()).toHaveLength(1);
    });

    it('should allow re-initialization after reset', () => {
      registry.reset();

      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      expect(registry.getActiveTrackers()).toHaveLength(1);
    });
  });

  describe('getRegisteredTrackers() and getActiveTrackers()', () => {
    it('should return empty arrays initially', () => {
      expect(registry.getRegisteredTrackers()).toEqual([]);
      expect(registry.getActiveTrackers()).toEqual([]);
    });

    it('should return registered tracker names', () => {
      registry.register(mockTrackerRegistration);
      registry.register({ ...mockTrackerRegistration, name: 'second' });

      const registered = registry.getRegisteredTrackers();
      expect(registered).toHaveLength(2);
      expect(registered).toContain('mock');
      expect(registered).toContain('second');
    });

    it('should only return active tracker names', () => {
      registry.register(mockTrackerRegistration);
      registry.register({ ...mockTrackerRegistration, name: 'inactive', configKey: 'debug' as keyof Config });

      // Only configure the first tracker
      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      const active = registry.getActiveTrackers();
      expect(active).toHaveLength(1);
      expect(active).toContain('mock');
      expect(active).not.toContain('inactive');
    });
  });

  describe('Tracker callback integration', () => {
    it('should invoke callback when tracker fires event', () => {
      registry.register(mockTrackerRegistration);

      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      const tracker = registry.get<MockTracker>('mock')!;
      tracker.triggerEvent('test-event');

      expect(trackedEvents).toHaveLength(1);
      expect(trackedEvents[0].event).toBe('test-event');
    });

    it('should not invoke callback when tracker is disabled', () => {
      registry.register(mockTrackerRegistration);

      const configWithTracking: Config = {
        ...mockConfig,
        autoTrackClicks: true,
      };

      registry.initAll(configWithTracking, { mock: (data) => trackedEvents.push(data as MockEventData) }, mockLogger);

      const tracker = registry.get<MockTracker>('mock')!;
      registry.disable('mock');

      tracker.triggerEvent('test-event');

      expect(trackedEvents).toHaveLength(0);
    });
  });
});
