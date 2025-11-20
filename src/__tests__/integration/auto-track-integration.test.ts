/**
 * @jest-environment jsdom
 */

import LuciaSDK, { __resetInstance } from '../../index';
import { Config } from '../../types';

// Mock fetch globally
global.fetch = jest.fn();
global.navigator.sendBeacon = jest.fn();

describe('Auto-Tracking Integration', () => {
  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Reset localStorage and sessionStorage
    localStorage.clear();
    sessionStorage.clear();

    // Clear document body
    document.body.innerHTML = '';

    // Reset SDK instance using helper
    __resetInstance();

    // Mock successful fetch responses
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        lid: 'test-lid-123',
        session: {
          id: 'test-session-456',
          hash: 'test-hash-789',
        },
      }),
    });

    // Mock sendBeacon
    (global.navigator.sendBeacon as jest.Mock).mockReturnValue(true);
  });

  describe('Programmatic Configuration', () => {
    it('should enable auto-tracking with boolean config', async () => {
      const config: Config = {
        apiKey: 'test-key',
        autoTrackClicks: true,
      };

      await LuciaSDK.init(config);

      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test-btn');
      document.body.appendChild(button);

      button.click();

      // Wait for async operations
      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      // Check that sendBeacon was called with click data
      expect(global.navigator.sendBeacon).toHaveBeenCalled();
      const beaconCall = (global.navigator.sendBeacon as jest.Mock).mock.calls.find((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(beaconCall).toBeDefined();
    });

    it('should enable auto-tracking with object config', async () => {
      const config: Config = {
        apiKey: 'test-key',
        autoTrackClicks: {
          enabled: true,
          selectors: ['button', '.custom-btn'],
        },
      };

      await LuciaSDK.init(config);

      const div = document.createElement('div');
      div.className = 'custom-btn';
      div.setAttribute('data-lucia-track', 'custom');
      document.body.appendChild(div);

      div.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      expect(global.navigator.sendBeacon).toHaveBeenCalled();
    });

    it('should not track when auto-tracking is disabled', async () => {
      jest.clearAllMocks(); // Clear previous test mocks

      const config: Config = {
        apiKey: 'test-key',
        autoTrackClicks: false,
      };

      await LuciaSDK.init(config);

      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test-btn');
      document.body.appendChild(button);

      button.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      // Should only have init call, no click tracking
      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls).toHaveLength(0);
    });

    it('should not track when auto-tracking is not configured', async () => {
      jest.clearAllMocks(); // Clear previous test mocks

      const config: Config = {
        apiKey: 'test-key',
      };

      await LuciaSDK.init(config);

      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'test-btn');
      document.body.appendChild(button);

      button.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls).toHaveLength(0);
    });
  });

  describe('Element-Level Control', () => {
    beforeEach(async () => {
      jest.clearAllMocks(); // Clear mocks before each test in this group

      const config: Config = {
        apiKey: 'test-key',
        autoTrackClicks: true,
      };
      await LuciaSDK.init(config);
    });

    it('should track button with data-lucia-track', async () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'signup-btn');
      button.textContent = 'Sign Up';
      document.body.appendChild(button);

      button.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const beaconCall = (global.navigator.sendBeacon as jest.Mock).mock.calls.find((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(beaconCall).toBeDefined();

      // The second argument is a Blob, read it using FileReader
      const blob = beaconCall[1] as Blob;
      const reader = new FileReader();
      const text = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      const payload = JSON.parse(text);
      expect(payload.button).toBe('signup-btn');
      expect(payload.elementType).toBe('button');
      expect(payload.text).toBe('Sign Up');
    });

    it('should not track element with data-lucia-ignore', async () => {
      jest.clearAllMocks();

      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'ignored');
      button.setAttribute('data-lucia-ignore', '');
      document.body.appendChild(button);

      button.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls).toHaveLength(0);
    });

    it('should include metadata from data-lucia-meta-* attributes', async () => {
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'cta-btn');
      button.setAttribute('data-lucia-meta-variant', 'primary');
      button.setAttribute('data-lucia-meta-location', 'hero');
      document.body.appendChild(button);

      button.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const beaconCall = (global.navigator.sendBeacon as jest.Mock).mock.calls.find((call) =>
        call[0].includes('/api/sdk/click'),
      );
      const blob = beaconCall[1] as Blob;
      const reader = new FileReader();
      const text = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      const payload = JSON.parse(text);

      expect(payload.meta).toEqual({
        variant: 'primary',
        location: 'hero',
      });
    });

    it('should track links with href', async () => {
      const link = document.createElement('a');
      link.href = '/pricing';
      link.setAttribute('data-lucia-track', 'pricing-link');
      link.textContent = 'View Pricing';
      document.body.appendChild(link);

      link.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const beaconCall = (global.navigator.sendBeacon as jest.Mock).mock.calls.find((call) =>
        call[0].includes('/api/sdk/click'),
      );
      const blob = beaconCall[1] as Blob;
      const reader = new FileReader();
      const text = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(reader.result as string);
        reader.readAsText(blob);
      });
      const payload = JSON.parse(text);

      expect(payload.href).toBe('/pricing');
      expect(payload.elementType).toBe('link');
    });
  });

  describe('Coexistence with Manual buttonClick()', () => {
    beforeEach(async () => {
      jest.clearAllMocks(); // Clear mocks

      const config: Config = {
        apiKey: 'test-key',
        autoTrackClicks: true,
      };
      await LuciaSDK.init(config);
    });

    it('should allow manual buttonClick() calls alongside auto-tracking', async () => {
      // Manual call
      await LuciaSDK.buttonClick('manual-click', {
        elementType: 'custom',
        meta: { source: 'manual' },
      });

      // Auto-tracked call
      const button = document.createElement('button');
      button.setAttribute('data-lucia-track', 'auto-click');
      document.body.appendChild(button);
      button.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );

      // Should have both clicks
      expect(clickCalls.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Default Selectors', () => {
    beforeEach(async () => {
      jest.clearAllMocks(); // Clear mocks first

      const config: Config = {
        apiKey: 'test-key',
        autoTrackClicks: true,
      };
      await LuciaSDK.init(config);
    });

    it('should track standard buttons', async () => {
      const button = document.createElement('button');
      button.id = 'test-button';
      document.body.appendChild(button);

      button.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls.length).toBeGreaterThan(0);
    });

    it('should track links with href', async () => {
      const link = document.createElement('a');
      link.href = '/test';
      document.body.appendChild(link);

      link.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls.length).toBeGreaterThan(0);
    });

    it('should track elements with role="button"', async () => {
      const div = document.createElement('div');
      div.setAttribute('role', 'button');
      div.id = 'role-button';
      document.body.appendChild(div);

      div.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls.length).toBeGreaterThan(0);
    });

    it('should not track non-matching elements', async () => {
      const span = document.createElement('span');
      span.textContent = 'Not trackable';
      document.body.appendChild(span);

      span.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls).toHaveLength(0);
    });
  });

  describe('Privacy Features', () => {
    beforeEach(async () => {
      jest.clearAllMocks(); // Clear mocks first

      const config: Config = {
        apiKey: 'test-key',
        autoTrackClicks: true,
      };
      await LuciaSDK.init(config);
    });

    it('should not track password inputs', async () => {
      const input = document.createElement('input');
      input.type = 'password';
      input.setAttribute('data-lucia-track', 'password');
      document.body.appendChild(input);

      input.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls).toHaveLength(0);
    });

    it('should not track credit card inputs', async () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('autocomplete', 'cc-number');
      input.setAttribute('data-lucia-track', 'card');
      document.body.appendChild(input);

      input.click();

      await new Promise((resolve) => {
        setTimeout(resolve, 100);
      });

      const clickCalls = (global.navigator.sendBeacon as jest.Mock).mock.calls.filter((call) =>
        call[0].includes('/api/sdk/click'),
      );
      expect(clickCalls).toHaveLength(0);
    });
  });
});
