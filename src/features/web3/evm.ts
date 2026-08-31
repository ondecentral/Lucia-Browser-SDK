/**
 * EVM provider detection — delegates to the provider registry.
 */

import { EVM_PROVIDERS } from './provider-registry';
import { safeWalletRead } from './safe';

/**
 * Detects the name of the EVM wallet provider from window.ethereum flags.
 * @returns The provider name (e.g. 'MetaMask', 'Rabby') or null if unknown/absent
 */
export function detectEvmProvider(): string | null {
  return (
    safeWalletRead(() => {
      if (!window.ethereum) return null;
      return EVM_PROVIDERS.find((p) => safeWalletRead(p.detect) === true)?.name ?? null;
    }) ?? null
  );
}
