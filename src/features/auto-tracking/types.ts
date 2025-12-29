/**
 * Auto-tracker type definitions
 * Provides interfaces for the plugin-based auto-tracking registry pattern
 */

import Logger from '../../infrastructure/logger';
import { Config } from '../../types';

/**
 * Base interface for all auto-trackers
 */
export interface IAutoTracker {
  readonly name: string;
  readonly configKey: string;

  enable(): void;
  disable(): void;
  destroy(): void;
  isEnabled(): boolean;
}

/**
 * Configuration normalizer - handles boolean | object config
 * Returns null if tracker should not be enabled
 */
export type TrackerConfigNormalizer<TConfig> = (raw: boolean | TConfig | undefined) => TConfig | null;

/**
 * Factory function type for creating trackers
 */
export type TrackerFactory<TConfig, TEventData> = (
  sdkConfig: Config,
  trackerConfig: TConfig,
  callback: (data: TEventData) => void,
  logger: Logger,
) => IAutoTracker;

/**
 * Registration entry for a tracker
 */
export interface TrackerRegistration<TConfig = unknown, TEventData = unknown> {
  name: string;
  configKey: keyof Config;
  factory: TrackerFactory<TConfig, TEventData>;
  normalizeConfig: TrackerConfigNormalizer<TConfig>;
}
