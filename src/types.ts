export interface Config {
  apiKey: string;
  debug?: boolean;
  testENV?: boolean;
  debugURL?: string;
}

export interface SDK {
  init: (config: Config) => Promise<LuciaSDKClass>;
  userInfo: (user: string, userInfo: object) => Promise<void>;
  pageView: (page: string) => Promise<void>;
  trackConversion: (eventTag: string, amount: number, eventDetails: object) => Promise<void>;
  buttonClick: (button: string) => Promise<void>;
  sendWalletInfo: (
    walletAddress: string,
    chainId: number | string,
    walletName?: 'Metamask' | 'Phantom',
  ) => Promise<void>;
  checkMetaMaskConnection: () => boolean;
  VERSION: string;
}

export interface LuciaSDKClass extends Omit<SDK, 'init' | 'VERSION'> {
  init: () => void;
}

/**
 * Utility function to safely access properties that might throw exceptions
 */
export interface SafeAccess {
  <T>(fn: () => T): T | undefined;
  <T>(fn: () => T, fallback: T): T;
}

/**
 * Browser data object returned by getBrowserData()
 */
export interface BrowserData {
  device: {
    cores?: number;
    memory?: number;
    cpuClass?: string;
    touch: boolean;
    devicePixelRatio?: number;
  };
  screen: {
    width?: number;
    height?: number;
    colorDepth?: number;
    availHeight?: number;
    availWidth?: number;
    orientation: {
      type?: string;
      angle?: number;
    };
  };
  browser: {
    language?: string;
    encoding?: string;
    timezone?: number;
    pluginsLength?: number;
    pluginNames?: string[];
    applePayAvailable?: boolean;
    uniqueHash?: string;
    colorGamut: string[];
    contrastPreference?: string;
  };
  permissions: {
    navPer?: any;
    renderedPer?: any;
    geoPer?: any;
  };
  storage: {
    localStorage?: boolean;
    indexedDB?: boolean;
    openDB?: any;
  };
}

/**
 * Wallet data object returned by getWalletData()
 */
export interface WalletData {
  providerInfo?: any;
  walletAddress?: string | null;
  solanaAddress?: string | null;
  walletName?: string | null;
  solWalletName?: string | null;
}
