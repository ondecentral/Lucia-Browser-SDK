export {
  checkIfEthereumProviderExists,
  getEthereumAddress,
  formatEthereumAddress,
  setupEthereumAccountListeners,
  getEthereumChainId,
  getConnectedWalletAddress,
  isMetaMask,
  getWalletName,
  getExtendedProviderInfo,
} from './evm';
export type { ProviderInfo } from './evm';

export { getConnectedSolanaWallet, getSolanaWalletName } from './solana';
