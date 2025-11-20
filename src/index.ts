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
  // Check if window.LuciaSDK was already initialized (e.g., via CDN auto-init)
  if (typeof window !== 'undefined' && (window as any).__luciaInstance) {
    return (window as any).__luciaInstance;
  }

  if (!instance) {
    throw new Error('LuciaSDK not initialized. Please call LuciaSDK.init() first');
  }
  return instance;
};

// Helper for tests to reset instance
export const __resetInstance = () => {
  instance = null;
  if (typeof window !== 'undefined') {
    delete (window as any).__luciaInstance;
  }
};

const LuciaSDK: SDK = {
  init: async (config: Config) => {
    if (typeof window === 'undefined') {
      throw new Error('LuciaSDK requires a browser environment');
    }

    // Check if already initialized via CDN/window
    if ((window as any).__luciaInstance) {
      // eslint-disable-next-line no-console
      console.warn('LuciaSDK already initialized via auto-init');
      return (window as any).__luciaInstance;
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

    // Store in window for cross-context sharing (CDN + npm import)
    (window as any).__luciaInstance = instance;

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

  // Auto-initialization: triggered by presence of data-api-key attribute
  const autoInit = async () => {
    // Try to get the current script element or find one with data-api-key
    const scriptTag =
      (document.currentScript as HTMLScriptElement) ||
      (document.querySelector('script[data-api-key]') as HTMLScriptElement);

    if (scriptTag) {
      const apiKey = scriptTag.getAttribute('data-api-key');

      // Auto-init if data-api-key is present
      if (apiKey) {
        const debugURL = scriptTag.getAttribute('data-debug-url');
        const autoTrackClicks = scriptTag.getAttribute('data-auto-track-clicks');
        const trackSelectors = scriptTag.getAttribute('data-track-selectors');

        const config: Config = {
          apiKey,
          ...(debugURL && { debugURL }),
        };

        // Parse auto-track-clicks configuration
        if (autoTrackClicks === 'true') {
          // Simple boolean enable
          if (trackSelectors) {
            // Custom selectors provided
            config.autoTrackClicks = {
              enabled: true,
              selectors: trackSelectors.split(',').map((s) => s.trim()),
            };
          } else {
            // Use defaults
            config.autoTrackClicks = true;
          }
        } else if (autoTrackClicks === 'false') {
          config.autoTrackClicks = false;
        }

        // Initialize the SDK
        try {
          await LuciaSDK.init(config);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('LuciaSDK auto-init failed:', error);
        }
      }
    }
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
