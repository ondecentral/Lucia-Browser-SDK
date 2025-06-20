import LuciaSDKClass from './core';
import { Config, SDK } from './types';
import {
  getBrowserData,
  getWalletData,
  getUtmParams,
  safeAccess,
  filterObject,
  getCanvasFingerprint,
  isTouchEnabled,
  getApplePayAvailable,
  getContrastPreference,
  getColorGamut,
} from './utils/data';
import { SDK_VERSION } from './version';

let instance: LuciaSDKClass | null = null;

const ensureInitialized = () => {
  if (!instance) {
    throw new Error('LuciaSDK not initialized. Please call LuciaSDK.init() first');
  }
  return instance;
};

const LuciaSDK: SDK = {
  init: async (config: Config) => {
    if (typeof window === 'undefined') {
      throw new Error('LuciaSDK requires a browser environment');
    }

    if (instance) {
      // eslint-disable-next-line no-console
      console.warn('LuciaSDK is already initialized');
      return instance;
    }

    if (!config?.apiKey) {
      throw new Error('apiKey is required in config');
    }

    instance = new LuciaSDKClass(config);
    await instance.init();
    return instance;
  },
  userInfo: async (...args) => ensureInitialized().userInfo(...args),
  pageView: async (...args) => ensureInitialized().pageView(...args),
  trackConversion: async (...args) => ensureInitialized().trackConversion(...args),
  buttonClick: async (...args) => ensureInitialized().buttonClick(...args),
  sendWalletInfo: async (...args) => ensureInitialized().sendWalletInfo(...args),
  trackUserAcquisition: async (...args) => ensureInitialized().trackUserAcquisition(...args),
  checkMetaMaskConnection: () => ensureInitialized().checkMetaMaskConnection(),
  VERSION: SDK_VERSION,
};

if (typeof window !== 'undefined') {
  (window as any).LuciaSDK = LuciaSDK;
}

export default LuciaSDK;

// Export utility functions individually for better documentation and IDE support
export {
  getBrowserData,
  getWalletData,
  getUtmParams,
  safeAccess,
  filterObject,
  getCanvasFingerprint,
  isTouchEnabled,
  getApplePayAvailable,
  getContrastPreference,
  getColorGamut,
};
