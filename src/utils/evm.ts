/**
 * Ethereum wallet utilities for Lucia Browser SDK
 */
import Logger from '../infrastructure/logger';
import Store from '../infrastructure/store';

const logger = new Logger(Store.store);

/**
 * Checks if an Ethereum provider exists in the window object
 * @returns boolean indicating if an Ethereum provider exists
 */
export function checkIfEthereumProviderExists(): boolean {
  return !!window.ethereum;
}

/**
 * Gets the Ethereum address from the connected wallet
 * @returns Promise resolving to the Ethereum address or null if not available
 */
export async function getEthereumAddress(): Promise<string | null> {
  try {
    // Check if Ethereum provider exists
    if (!window.ethereum?.request) {
      logger.log('error', 'No Ethereum wallet detected.');
      return null;
    }

    // Request accounts access
    const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];

    // Get the first account (current account)
    if (accounts && accounts.length > 0) {
      const address = accounts[0];
      return address;
    }

    return null;
  } catch (error: any) {
    if (error.code === 4001) {
      // User rejected the request
      logger.log('error', 'Connection request rejected by user.');
    } else {
      logger.log('error', 'Error connecting to wallet:', error);
    }
    return null;
  }
}

/**
 * Formats an Ethereum address for display by shortening it
 * @param address The full Ethereum address
 * @returns Shortened address in the format "0x1234...5678"
 */
export function formatEthereumAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Sets up listeners for Ethereum account changes
 * @param callback Function to call when accounts change
 */
export function setupEthereumAccountListeners(callback: (accounts: string[]) => void): void {
  if (!window.ethereum?.on) return;

  window.ethereum.on('accountsChanged', (accounts: unknown) => callback(accounts as string[]));
}

/**
 * Gets the current Ethereum chain ID
 * @returns Promise resolving to the chain ID or null if not available
 */
export async function getEthereumChainId(): Promise<string | null> {
  try {
    if (!window.ethereum?.request) return null;

    const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
    return chainId;
  } catch (error) {
    logger.log('error', 'Error getting chain ID:', error);
    return null;
  }
}

/**
 * Checks if a wallet is connected and returns the address if it is
 * @returns Promise resolving to the connected address or null
 */
export async function getConnectedWalletAddress(): Promise<string | null> {
  try {
    const { ethereum } = window;

    if (!ethereum?.request) return null;

    const accounts = (await ethereum.request({ method: 'eth_accounts' })) as string[] | null;
    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch (error) {
    logger.log('error', 'Error checking connected wallet:', error);
    return null;
  }
}

/**
 * Checks if the connected wallet is MetaMask
 * @returns boolean indicating if the connected wallet is MetaMask
 */
export async function isMetaMask(): Promise<boolean> {
  try {
    if (!window.ethereum) return false;

    return !!window.ethereum.isMetaMask;
  } catch (error) {
    logger.log('error', 'Error checking if MetaMask:', error);
    return false;
  }
}

/**
 * Gets the name of the connected wallet
 * @returns Promise resolving to the name of the connected wallet, or null if not available
 */
export async function getWalletName(): Promise<string | null> {
  try {
    if (!window.ethereum) return null;

    if (window.ethereum.isMetaMask) {
      return 'MetaMask';
    }

    if (!window.ethereum.request) return null;

    const walletName = (await window.ethereum.request({ method: 'wallet_getName' })) as string;
    return walletName || null;
  } catch (error) {
    logger.log('error', 'Error getting wallet name:', error);
    return null;
  }
}

/**
 * Provider information interface
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

// Extend the Window interface to include BinanceChain and wallet-specific properties
// Window.ethereum and Window.BinanceChain declared in src/global.d.ts

export async function getExtendedProviderInfo(): Promise<ProviderInfo | null> {
  if (!window.ethereum) return null;

  const provider: ProviderInfo = {
    isMetaMask: !!window.ethereum.isMetaMask,
    isCoinbaseWallet: !!window.ethereum.isCoinbaseWallet || !!window.ethereum.isCoinbase,
    isWalletConnect: !!window.ethereum.isWalletConnect,
    isTrust: !!window.ethereum.isTrust || !!window.ethereum.isTrustWallet,
    isImToken: !!window.ethereum.isImToken,
    isBraveWallet: !!window.ethereum.isBraveWallet,
    isTokenPocket: !!window.ethereum.isTokenPocket,
    isStatus: !!window.ethereum.isStatus,
    isTally: !!(window.ethereum.isTally || window.ethereum.isTallyWallet),
    isAlphaWallet: !!window.ethereum.isAlphaWallet,
    isOpera: !!window.ethereum.isOpera,
    isCoin98: !!window.ethereum.isCoin98,
    isMathWallet: !!window.ethereum.isMathWallet,
    isOneInch: !!(window.ethereum.isOneInchIOSWallet || window.ethereum.isOneInchAndroidWallet),
    isRainbow: !!window.ethereum.isRainbow,
    isBinanceChainWallet: false, // Will be set later if detected
    isFrame: !!window.ethereum.isFrame,
    userAgent: window.navigator.userAgent,
    chainId: window.ethereum.chainId || undefined,
    networkVersion: window.ethereum.networkVersion || undefined,
    name: '', // Temporary placeholder
  };

  if (!Object.values(provider).some(Boolean)) {
    if (Object.prototype.hasOwnProperty.call(window.ethereum, '_metamask')) {
      provider.isMetaMask = true;
    }

    if (window.BinanceChain) {
      provider.isBinanceChainWallet = true;
    }

    if (window.ethereum.isFrame) {
      provider.isFrame = true;
    }

    if (typeof window.ethereum.request === 'function' && typeof (window.ethereum as any)._metamask === 'undefined') {
      provider.isPossiblyGenericInjectedProvider = true;
    }
  }

  // Set the name after the provider object is fully initialized
  provider.name = determineProviderName(provider);

  return provider;
}

function determineProviderName(provider: ProviderInfo): string {
  if (provider.isMetaMask) return 'MetaMask';
  if (provider.isCoinbaseWallet) return 'Coinbase Wallet';
  if (provider.isWalletConnect) return 'WalletConnect';
  if (provider.isTrust) return 'Trust Wallet';
  if (provider.isImToken) return 'imToken';
  if (provider.isBraveWallet) return 'Brave Wallet';
  if (provider.isTokenPocket) return 'TokenPocket';
  if (provider.isStatus) return 'Status';
  if (provider.isTally) return 'Tally';
  if (provider.isAlphaWallet) return 'AlphaWallet';
  if (provider.isOpera) return 'Opera';
  if (provider.isCoin98) return 'Coin98';
  if (provider.isMathWallet) return 'MathWallet';
  if (provider.isOneInch) return '1inch Wallet';
  if (provider.isRainbow) return 'Rainbow';
  if (provider.isBinanceChainWallet) return 'Binance Chain Wallet';
  if (provider.isFrame) return 'Frame';

  const ua = provider.userAgent.toLowerCase();
  if (ua.includes('trust')) return 'Trust Wallet (UA)';
  if (ua.includes('rainbow')) return 'Rainbow (UA)';

  return 'Unknown Provider';
}
