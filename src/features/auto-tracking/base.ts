/**
 * Base auto-tracker abstract class
 * Provides common lifecycle methods for all auto-trackers
 */

import { IAutoTracker } from './types';

import Logger from '../../infrastructure/logger';
import { Config } from '../../types';



/**
 * Abstract base class for all auto-trackers
 * Implements common enable/disable/destroy lifecycle
 */
export abstract class BaseAutoTracker<TConfig, TEventData> implements IAutoTracker {
  abstract readonly name: string;
  abstract readonly configKey: string;

  protected enabled: boolean = false;
  protected sdkConfig: Config;
  protected config: TConfig;
  protected callback: (data: TEventData) => void;
  protected logger: Logger;

  constructor(sdkConfig: Config, config: TConfig, callback: (data: TEventData) => void, logger: Logger) {
    this.sdkConfig = sdkConfig;
    this.config = config;
    this.callback = callback;
    this.logger = logger;
  }

  /**
   * Attach event listeners - implemented by each tracker
   */
  protected abstract attachListeners(): void;

  /**
   * Detach event listeners - implemented by each tracker
   */
  protected abstract detachListeners(): void;

  enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      this.attachListeners();
      this.logger.log('log', `${this.name}: Enabled`);
    }
  }

  disable(): void {
    if (this.enabled) {
      this.enabled = false;
      this.logger.log('log', `${this.name}: Disabled`);
    }
  }

  destroy(): void {
    this.disable();
    this.detachListeners();
    this.logger.log('log', `${this.name}: Destroyed`);
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
