import { LuciaSDK } from './sdk';

let instance: LuciaSDK | null = null;

const init = (apiKey: string, clientId: string) => {
  instance = new LuciaSDK(apiKey, clientId);
};

const debug = () => {
  if (!instance) {
    throw new Error('SDK is not initialized');
  }

  return instance.debug();
};

export default {
  init,
  debug,
};
