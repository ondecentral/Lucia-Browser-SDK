import type LuciaSDKClass from './core';
import type { SDK } from './types';

declare global {
  interface Window {
    __luciaInitPromise?: Promise<LuciaSDKClass>;
    LuciaSDK?: SDK;
    ethereum?: EthereumProvider;
    BinanceChain?: unknown;
  }

  interface EthereumProvider {
    isConnected?: () => boolean;
    selectedAddress?: string;
    request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    off?: (event: string, callback: (...args: unknown[]) => void) => void;
    chainId?: string;
    networkVersion?: string;
    isMetaMask?: boolean;
    isCoinbaseWallet?: boolean;
    isCoinbase?: boolean;
    isWalletConnect?: boolean;
    isTrust?: boolean;
    isTrustWallet?: boolean;
    isImToken?: boolean;
    isBraveWallet?: boolean;
    isTokenPocket?: boolean;
    isStatus?: boolean;
    isTally?: boolean;
    isTallyWallet?: boolean;
    isAlphaWallet?: boolean;
    isOpera?: boolean;
    isCoin98?: boolean;
    isMathWallet?: boolean;
    isOneInchIOSWallet?: boolean;
    isOneInchAndroidWallet?: boolean;
    isRainbow?: boolean;
    isFrame?: boolean;
    providers?: EthereumProvider[];
    _metamask?: unknown;
  }
}

export {};
