import LuciaSDKClass from './core';
import { Config, SDK } from './types';
import { SDK_VERSION } from './version';

// Re-export utility functions for public API
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
} from './features/fingerprinting';

let sdk: Promise<LuciaSDKClass> | null = null;

const getSdk = () => {
  const p = sdk || (typeof window !== 'undefined' && window.__luciaInitPromise);
  if (!p) throw new Error('LuciaSDK not initialized. Please call LuciaSDK.init() first');
  return p;
};

// Helper for tests to reset instance
export const __resetInstance = () => {
  // Get the single promise (avoid double-destroy if sdk === window.__luciaInitPromise)
  const promise = sdk || (typeof window !== 'undefined' && window.__luciaInitPromise);
  if (promise) {
    // Errors swallowed intentionally - cleanup should not throw
    promise.then((s) => s.destroy()).catch(() => {});
  }
  sdk = null;
  if (typeof window !== 'undefined') {
    delete window.__luciaInitPromise;
  }
};

const LuciaSDK: SDK = {
  init: (config: Config) => {
    if (typeof window === 'undefined') return Promise.reject(new Error('LuciaSDK requires a browser environment'));

    // Return existing initialization if already in progress or complete
    // Check sdk first (module-level), then window (cross-context sharing)
    if (sdk) return sdk;
    if (window.__luciaInitPromise) {
      sdk = window.__luciaInitPromise;
      return sdk;
    }

    if (!config?.apiKey) return Promise.reject(new Error('apiKey is required in config'));

    // Create and assign promise atomically to prevent race conditions
    const initPromise = (async () => {
      const inst = new LuciaSDKClass(config);
      await inst.init();
      return inst;
    })();

    sdk = initPromise;
    window.__luciaInitPromise = initPromise;
    return initPromise;
  },

  userInfo: async (user, userInfo) => (await getSdk()).userInfo(user, userInfo),
  pageView: async (page) => (await getSdk()).pageView(page),
  trackConversion: async (tag, amount, details) => (await getSdk()).trackConversion(tag, amount, details),
  buttonClick: async (button, meta) => (await getSdk()).buttonClick(button, meta),
  sendWalletInfo: async (addr, chain, name) => (await getSdk()).sendWalletInfo(addr, chain, name),
  trackUserAcquisition: async (userId, data = {}) => (await getSdk()).trackUserAcquisition(userId, data),
  checkMetaMaskConnection: () => !!(window.ethereum?.isConnected?.() && window.ethereum?.selectedAddress),
  VERSION: SDK_VERSION,
};

if (typeof window !== 'undefined') {
  window.LuciaSDK = LuciaSDK;

  // Auto-initialization: triggered by presence of data-api-key attribute
  const autoInit = () => {
    // Try to get the current script element or find one with data-api-key
    const tag = (document.currentScript as HTMLScriptElement) || document.querySelector('script[data-api-key]');
    const apiKey = tag?.getAttribute('data-api-key');
    if (!apiKey) return;

    const debugURL = tag.getAttribute('data-debug-url');
    const autoTrack = tag.getAttribute('data-auto-track-clicks');
    const selectors = tag.getAttribute('data-track-selectors');

    // Initialize the SDK
    LuciaSDK.init({
      apiKey,
      ...(debugURL && { debugURL }),
      ...(autoTrack === 'true' && {
        autoTrackClicks: selectors ? { enabled: true, selectors: selectors.split(',').map((s) => s.trim()) } : true,
      }),
      ...(autoTrack === 'false' && { autoTrackClicks: false }),
    }).catch((e) => console.error('LuciaSDK auto-init failed:', e));
  };

  // Execute auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
  } else {
    // DOM already ready, execute immediately
    autoInit();
  }
}

export default LuciaSDK;
