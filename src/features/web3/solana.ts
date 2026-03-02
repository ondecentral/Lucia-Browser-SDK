/**
 * Solana provider detection — delegates to the provider registry.
 */

import { SOLANA_PROVIDERS } from './provider-registry';

/**
 * Detects the name of the Solana wallet provider from window globals.
 * @returns The provider name (e.g. 'Phantom') or null if unknown/absent
 */
export function detectSolanaProvider(): string | null {
  return SOLANA_PROVIDERS.find((p) => p.detect())?.name ?? null;
}
