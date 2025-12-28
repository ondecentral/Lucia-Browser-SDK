import Logger from './logger';
import Store from './store';

import { SERVER_URL, TEST_SERVER_URL } from '../constants';
import { SDK_VERSION } from '../version';

interface QueueItem<T> {
  url: string;
  data: unknown;
  fireAndForget: boolean;
  resolve: (value: T | null) => void;
  reject: (reason?: unknown) => void;
  isInit: boolean;
}

class HttpClient {
  store: typeof Store.store;

  baseURL: string;

  logger: Logger;

  private requestQueue: QueueItem<unknown>[] = [];

  private isProcessingQueue = false;

  private initComplete = false;

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
          'SDK-VERSION': SDK_VERSION,
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

    // Determine if this is an init request
    const isInit = url === '/api/sdk/init';

    // If it's not an init request and init hasn't been completed yet, queue it
    if (!isInit && !this.initComplete) {
      return new Promise<T | null>((resolve, reject) => {
        this.requestQueue.push({
          url,
          data,
          fireAndForget,
          resolve: resolve as (value: unknown) => void,
          reject,
          isInit,
        });
        this.processQueue();
      });
    }

    // Process init requests immediately or any request after init is complete
    if (isInit) {
      const result = await this.executePost<T>(url, data, fireAndForget);
      this.initComplete = true;
      await this.processQueue(); // Start processing any queued requests
      return result;
    }

    // Handle regular requests after init
    return this.executePost<T>(url, data, fireAndForget);
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.initComplete || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    try {
      // Process all queued requests sequentially
      const processNext = async (): Promise<void> => {
        if (this.requestQueue.length === 0) return;
        const item = this.requestQueue.shift()!;
        try {
          const result = await this.executePost(item.url, item.data, item.fireAndForget);
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        }
        await processNext();
      };
      await processNext();
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async executePost<T extends unknown>(url: string, data: unknown, fireAndForget = true): Promise<T | null> {
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
          'SDK-VERSION': SDK_VERSION,
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
