import { HttpClient, Logger, Store } from '../infrastructure';
import { Config } from '../types';

class BaseClass {
  store: typeof Store.store;

  dispatch: typeof Store.dispatch;

  httpClient: HttpClient;

  logger: Logger;

  constructor(config: Config) {
    this.store = Store.store;
    this.dispatch = Store.dispatch;
    this.dispatch({ config });

    this.httpClient = new HttpClient(this.store);
    this.logger = new Logger(this.store);
  }
}

export default BaseClass;
