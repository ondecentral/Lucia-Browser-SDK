import Store from './store';

class Logger {
  store: typeof Store.store;

  constructor(store: typeof Store.store) {
    this.store = store;
  }

  log(level: 'log' | 'error' | 'warn' | 'info', ...args: unknown[]) {
    if (this.store.config?.debug) {
      // eslint-disable-next-line no-console
      console[level](args);
    }
  }
}

export default Logger;
