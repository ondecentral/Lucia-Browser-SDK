/**
 * Auto-tracker registry
 * Manages registration and lifecycle of all auto-trackers
 */

import { IAutoTracker, TrackerRegistration } from './types';

import Logger from '../../infrastructure/logger';
import { Config } from '../../types';

/**
 * Registry for managing auto-tracker plugins
 * Handles registration, initialization, and cleanup of all trackers
 */
export class AutoTrackerRegistry {
  private registrations: Map<string, TrackerRegistration> = new Map();
  private activeTrackers: Map<string, IAutoTracker> = new Map();
  private logger: Logger | null = null;

  /**
   * Register a tracker factory (called at module load time)
   */
  register<TConfig, TEventData>(registration: TrackerRegistration<TConfig, TEventData>): void {
    this.registrations.set(registration.name, registration as TrackerRegistration);
  }

  /**
   * Initialize all configured trackers
   */
  initAll(sdkConfig: Config, callbacks: Record<string, (data: unknown) => void>, logger: Logger): void {
    this.logger = logger;

    for (const [name, registration] of this.registrations) {
      const rawConfig = sdkConfig[registration.configKey as keyof Config];
      const normalizedConfig = registration.normalizeConfig(rawConfig as boolean | unknown | undefined);

      if (normalizedConfig === null) {
        continue; // Tracker not configured or disabled
      }

      const callback = callbacks[name];
      if (!callback) {
        logger.log('warn', `AutoTrackerRegistry: No callback registered for ${name}`);
        continue;
      }

      try {
        const tracker = registration.factory(sdkConfig, normalizedConfig, callback, logger);
        this.activeTrackers.set(name, tracker);
        tracker.enable();
        logger.log('log', `AutoTrackerRegistry: Initialized ${name}`);
      } catch (error) {
        logger.log('error', `AutoTrackerRegistry: Failed to initialize ${name}`, error);
      }
    }
  }

  /**
   * Get a specific tracker by name
   */
  get<T extends IAutoTracker>(name: string): T | undefined {
    return this.activeTrackers.get(name) as T | undefined;
  }

  /**
   * Enable a specific tracker
   */
  enable(name: string): boolean {
    const tracker = this.activeTrackers.get(name);
    if (tracker) {
      tracker.enable();
      return true;
    }
    return false;
  }

  /**
   * Disable a specific tracker
   */
  disable(name: string): boolean {
    const tracker = this.activeTrackers.get(name);
    if (tracker) {
      tracker.disable();
      return true;
    }
    return false;
  }

  /**
   * Destroy all trackers and clean up
   */
  destroyAll(): void {
    for (const [name, tracker] of this.activeTrackers) {
      try {
        tracker.destroy();
      } catch (error) {
        this.logger?.log('error', `AutoTrackerRegistry: Error destroying ${name}`, error);
      }
    }
    this.activeTrackers.clear();
  }

  /**
   * List all registered tracker names
   */
  getRegisteredTrackers(): string[] {
    return Array.from(this.registrations.keys());
  }

  /**
   * List all active tracker names
   */
  getActiveTrackers(): string[] {
    return Array.from(this.activeTrackers.keys());
  }

  /**
   * Reset the registry (for testing purposes)
   * Clears active trackers but preserves registrations
   */
  reset(): void {
    this.destroyAll();
    this.logger = null;
  }
}

// Singleton instance
export const autoTrackerRegistry = new AutoTrackerRegistry();
