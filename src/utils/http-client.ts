import Logger from './logger';
import Store from './store';

import { SERVER_URL, TEST_SERVER_URL } from '../constants';

class HttpClient {
  store: typeof Store.store;

  baseURL: string;

  logger: Logger;

  constructor(store: typeof Store.store) {
    this.store = store;
    this.baseURL = this.store.config?.testENV ? TEST_SERVER_URL : SERVER_URL;

    this.logger = new Logger(this.store);
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

  async post<T extends unknown>(url: string, data: unknown): Promise<T | null> {
    if (!this.store.config) {
      this.logger.log('error', 'Config is not set');
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
