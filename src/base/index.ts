import { Config } from '../types';
import HttpClient from '../utils/http-client';
import Logger from '../utils/logger';
import Store from '../utils/store';

class BaseClass {
  store: typeof Store.store;

  dispatch: typeof Store.dispatch;

  httpClient: HttpClient;

  logger: Logger;

  constructor(config: Config) {
    this.store = Store.store;
    this.dispatch = Store.dispatch;
    this.httpClient = new HttpClient(this.store);
    this.logger = new Logger(this.store);

    this.dispatch({ config });
  }
}

export default BaseClass;
