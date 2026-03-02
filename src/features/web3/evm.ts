/**
 * EVM provider detection — delegates to the provider registry.
 */

import { EVM_PROVIDERS } from './provider-registry';

/**
 * Detects the name of the EVM wallet provider from window.ethereum flags.
 * @returns The provider name (e.g. 'MetaMask', 'Rabby') or null if unknown/absent
 */
export function detectEvmProvider(): string | null {
  if (!window.ethereum) return null;
  return EVM_PROVIDERS.find((p) => p.detect())?.name ?? null;
}
