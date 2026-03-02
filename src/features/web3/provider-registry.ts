/**
 * Wallet Provider Registry
 *
 * Centralized, ordered list of wallet provider detections.
 * Adding a wallet = adding one entry to the appropriate array.
 *
 * ORDER MATTERS for EVM: wallets that set `isMetaMask: true` for dapp
 * compatibility must appear BEFORE the MetaMask entry. The first match wins.
 */

export interface ProviderEntry {
  name: string;
  detect: () => boolean;
}

/**
 * EVM wallet providers, checked against window.ethereum flags.
 *
 * Section 1: Wallets that also set isMetaMask (must come first)
 * Section 2: MetaMask itself
 * Section 3: Wallets that don't set isMetaMask
 * Section 4: Fallback checks (window globals, internal properties)
 */
export const EVM_PROVIDERS: ProviderEntry[] = [
  // --- Wallets that set isMetaMask for compat (check BEFORE MetaMask) ---
  { name: 'Rabby', detect: () => !!window.ethereum?.isRabby },
  { name: 'Brave Wallet', detect: () => !!window.ethereum?.isBraveWallet },
  { name: 'Rainbow', detect: () => !!window.ethereum?.isRainbow },
  { name: 'Coinbase Wallet', detect: () => !!window.ethereum?.isCoinbaseWallet || !!window.ethereum?.isCoinbase },
  { name: 'Trust Wallet', detect: () => !!window.ethereum?.isTrust || !!window.ethereum?.isTrustWallet },
  { name: 'TokenPocket', detect: () => !!window.ethereum?.isTokenPocket },
  { name: 'Zerion', detect: () => !!window.ethereum?.isZerion },
  { name: 'Phantom', detect: () => !!window.ethereum?.isPhantom },
  { name: 'OKX Wallet', detect: () => !!window.ethereum?.isOkxWallet },
  { name: 'Bitget Wallet', detect: () => !!window.ethereum?.isBitKeep || !!window.ethereum?.isBitgetWallet },
  { name: 'SafePal', detect: () => !!window.ethereum?.isSafePal },
  { name: 'Frontier', detect: () => !!window.ethereum?.isFrontier },
  { name: 'XDEFI', detect: () => !!window.ethereum?.isXDEFI || !!window.ethereum?.isCtrl },
  { name: 'Enkrypt', detect: () => !!window.ethereum?.isEnkrypt },

  // --- MetaMask ---
  { name: 'MetaMask', detect: () => !!window.ethereum?.isMetaMask },

  // --- Wallets that don't set isMetaMask ---
  { name: 'WalletConnect', detect: () => !!window.ethereum?.isWalletConnect },
  { name: 'imToken', detect: () => !!window.ethereum?.isImToken },
  { name: 'Status', detect: () => !!window.ethereum?.isStatus },
  { name: 'Tally', detect: () => !!window.ethereum?.isTally || !!window.ethereum?.isTallyWallet },
  { name: 'AlphaWallet', detect: () => !!window.ethereum?.isAlphaWallet },
  { name: 'Opera', detect: () => !!window.ethereum?.isOpera },
  { name: 'Coin98', detect: () => !!window.ethereum?.isCoin98 },
  { name: 'MathWallet', detect: () => !!window.ethereum?.isMathWallet },
  {
    name: '1inch Wallet',
    detect: () => !!window.ethereum?.isOneInchIOSWallet || !!window.ethereum?.isOneInchAndroidWallet,
  },
  { name: 'Frame', detect: () => !!window.ethereum?.isFrame },

  // --- Fallback: window globals / internal properties ---
  { name: 'Binance Chain Wallet', detect: () => !!window.BinanceChain },
  { name: 'MetaMask', detect: () => Object.prototype.hasOwnProperty.call(window.ethereum ?? {}, '_metamask') },
];

/**
 * Solana wallet providers, checked against window globals.
 */
export const SOLANA_PROVIDERS: ProviderEntry[] = [
  { name: 'Phantom', detect: () => !!window.phantom?.solana },
  { name: 'Solflare', detect: () => !!window.solflare },
  { name: 'Backpack', detect: () => !!window.backpack },
  { name: 'Glow', detect: () => !!window.glow },
  { name: 'Coin98', detect: () => !!window.solana?.isCoin98 },
  // Fallback: older Phantom versions only set window.solana.isPhantom without window.phantom.solana
  { name: 'Phantom', detect: () => !!window.solana?.isPhantom },
];
