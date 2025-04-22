import Logger from './logger';
import Store from './store';

import { SERVER_URL, TEST_SERVER_URL } from '../constants';

class HttpClient {
  store: typeof Store.store;

  baseURL: string;

  logger: Logger;

  constructor(store: typeof Store.store) {
    this.store = store;
    this.baseURL = this.getBaseURL();

    this.logger = new Logger(this.store);
  }

  private getBaseURL(): string {
    const { config } = this.store;

    if (config?.debugURL) {
      return config.debugURL;
    }

    return config?.testENV ? TEST_SERVER_URL : SERVER_URL;
  }

  async get<T extends unknown>(url: string): Promise<T | null> {
    if (!this.store.config) {
      this.logger.log('error', 'Config is not set');
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.store.config.apiKey,
        },
      });
      return (await response.json()) as T;
    } catch (e) {
      this.logger.log('error', e);
    }
    return null;
  }

  async post<T extends unknown>(url: string, data: unknown, fireAndForget = true): Promise<T | null> {
    if (!this.store.config) {
      this.logger.log('error', 'Config is not set');
      return null;
    }

    if (fireAndForget && typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      try {
        const fullUrl = `${this.baseURL}${url}`;
        // Ensure data is an object for spreading
        const safeData = data && typeof data === 'object' && !Array.isArray(data) ? data : { payload: data };
        const beaconData = JSON.stringify({ ...safeData, _apiKey: this.store.config.apiKey });
        const blob = new Blob([beaconData], { type: 'application/json' });
        const success = navigator.sendBeacon(fullUrl, blob);
        if (!success) {
          this.logger.log('error', 'sendBeacon failed');
        }
      } catch (e) {
        this.logger.log('error', e);
      }
      // fire-and-forget: always return null
      return null;
    }

    try {
      const response = await fetch(`${this.baseURL}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.store.config.apiKey,
        },
        body: JSON.stringify(data),
      });
      return (await response.json()) as T;
    } catch (e) {
      this.logger.log('error', e);
    }
    return null;
  }
}

export default HttpClient;
