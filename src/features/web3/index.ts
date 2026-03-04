export { detectEvmProvider } from './evm';
export { detectSolanaProvider } from './solana';
export { EVM_PROVIDERS, SOLANA_PROVIDERS } from './provider-registry';
export type { ProviderEntry } from './provider-registry';
export {
  startEIP6963Discovery,
  getEIP6963Providers,
  getEIP6963ConnectedWallets,
  resolveEIP6963ProviderByAddress,
  onEIP6963Announce,
  __resetEIP6963,
} from './eip6963';
export type {
  EIP6963ProviderInfo,
  EIP6963ProviderDetail,
  EIP6963AnnounceEvent,
  EIP6963ConnectedWallet,
} from './eip6963';
