export interface LuciaSDKInstance extends Omit<SDK, 'init' | 'VERSION'> {
  init: () => Promise<void>;
  destroy: () => void;
}

/**
 * Configuration for automated click tracking
 */
export interface AutoTrackClicksConfig {
  enabled?: boolean;
  selectors?: string[];
  ignore?: string[];
}

export interface Config {
  apiKey: string;
  debug?: boolean;
  testENV?: boolean;
  debugURL?: string;
  autoTrackClicks?: boolean | AutoTrackClicksConfig;
}

/**
 * Click event data payload
 */
export interface ClickEventMetadata {
  elementType?: string;
  text?: string;
  href?: string | null;
  meta?: Record<string, string>;
}

export interface SDK {
  init: (config: Config) => Promise<LuciaSDKInstance>;
  userInfo: (user: string, userInfo: object) => Promise<void>;
  pageView: (page: string) => Promise<void>;
  trackConversion: (eventTag: string, amount: number, eventDetails: object) => Promise<void>;
  buttonClick: (button: string, metadata?: ClickEventMetadata) => Promise<void>;
  sendWalletInfo: (
    walletAddress: string,
    chainId: number | string,
    walletName?: 'Metamask' | 'Phantom',
  ) => Promise<void>;
  trackUserAcquisition: (userId: string, acquisitionData?: object) => Promise<void>;
  checkMetaMaskConnection: () => boolean;
  VERSION: string;
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
    navPer?: PermissionStatus;
    renderedPer?: PermissionStatus;
    geoPer?: PermissionStatus;
  };
  storage: {
    localStorage?: boolean;
    indexedDB?: boolean;
    openDB?: unknown;
  };
}

/**
 * Wallet data object returned by getWalletData()
 */
export interface WalletData {
  providerInfo?: Partial<ProviderInfo> | null;
  walletAddress?: string | null;
  solanaAddress?: string | null;
  walletName?: string | null;
  solWalletName?: string | null;
}

/**
 * Ethereum provider information
 */
export interface ProviderInfo {
  isMetaMask: boolean;
  isCoinbaseWallet: boolean;
  isWalletConnect: boolean;
  isTrust: boolean;
  isImToken: boolean;
  isBraveWallet: boolean;
  isTokenPocket: boolean;
  isStatus: boolean;
  isTally: boolean;
  isAlphaWallet: boolean;
  isOpera: boolean;
  isCoin98: boolean;
  isMathWallet: boolean;
  isOneInch: boolean;
  isRainbow: boolean;
  isBinanceChainWallet: boolean;
  isFrame: boolean;
  userAgent: string;
  chainId?: string;
  networkVersion?: string;
  name: string;
  isPossiblyGenericInjectedProvider?: boolean;
}

/**
 * Session data stored in sessionStorage
 */
export interface SessionData {
  id: string;
  hash?: string;
  timestamp: number;
}

/**
 * User info in API payloads
 */
export interface UserPayload {
  name: string | null;
  userInfo?: object;
}

/**
 * Base API payload structure
 */
export interface BaseApiPayload {
  user: UserPayload;
  session: SessionData | null;
  lid?: string;
}

/**
 * User info API payload
 */
export interface UserInfoPayload extends BaseApiPayload {
  user: UserPayload & { userInfo: object };
}

/**
 * Page view API payload
 */
export interface PageViewPayload extends BaseApiPayload {
  page: string;
}

/**
 * Conversion API payload
 */
export interface ConversionPayload extends BaseApiPayload {
  tag: string;
  amount: number;
  event: object;
}

/**
 * Click API payload
 */
export interface ClickPayload extends BaseApiPayload {
  button: string;
  elementType?: string;
  text?: string;
  href?: string | null;
  meta?: Record<string, string>;
  timestamp?: number;
}

/**
 * Wallet API payload
 */
export interface WalletPayload extends BaseApiPayload {
  walletAddress: string;
  chainId: number | string;
  walletName?: 'Phantom' | 'Metamask';
}
