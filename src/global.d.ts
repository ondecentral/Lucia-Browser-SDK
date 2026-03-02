import type LuciaSDKClass from './core';
import type { SDK } from './types';

interface SolanaProvider {
  isPhantom?: boolean;
  isCoin98?: boolean;
  isConnected: boolean;
  publicKey?: {
    toString: () => string;
  };
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  connect?: (options?: { onlyIfTrusted?: boolean }) => Promise<{ publicKey?: { toString: () => string } }>;
}

interface SolflareProvider {
  isConnected: boolean;
  publicKey?: {
    toString: () => string;
  };
}

interface PhantomProvider {
  solana?: SolanaProvider;
}

interface BackpackProvider {
  isConnected?: boolean;
  publicKey?: { toString: () => string };
}

interface GlowProvider {
  isConnected?: boolean;
  publicKey?: { toString: () => string };
}

declare global {
  interface Window {
    __luciaInitPromise?: Promise<LuciaSDKClass>;
    LuciaSDK?: SDK;
    ethereum?: EthereumProvider;
    BinanceChain?: unknown;
    solana?: SolanaProvider;
    solflare?: SolflareProvider;
    phantom?: PhantomProvider;
    backpack?: BackpackProvider;
    glow?: GlowProvider;
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
    providers?: EthereumProvider[];
    _metamask?: unknown;

    // Wallet detection flags — keep alphabetical
    isAlphaWallet?: boolean;
    isBitKeep?: boolean;
    isBitgetWallet?: boolean;
    isBraveWallet?: boolean;
    isCoin98?: boolean;
    isCoinbase?: boolean;
    isCoinbaseWallet?: boolean;
    isCtrl?: boolean;
    isEnkrypt?: boolean;
    isFrame?: boolean;
    isFrontier?: boolean;
    isImToken?: boolean;
    isMathWallet?: boolean;
    isMetaMask?: boolean;
    isOkxWallet?: boolean;
    isOneInchAndroidWallet?: boolean;
    isOneInchIOSWallet?: boolean;
    isOpera?: boolean;
    isPhantom?: boolean;
    isRabby?: boolean;
    isRainbow?: boolean;
    isSafePal?: boolean;
    isStatus?: boolean;
    isTally?: boolean;
    isTallyWallet?: boolean;
    isTokenPocket?: boolean;
    isTrust?: boolean;
    isTrustWallet?: boolean;
    isWalletConnect?: boolean;
    isXDEFI?: boolean;
    isZerion?: boolean;
  }
}

export {};
