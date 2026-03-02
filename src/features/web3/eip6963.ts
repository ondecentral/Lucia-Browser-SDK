/**
 * EIP-6963: Multi Injected Provider Discovery
 *
 * Each EVM wallet announces itself via a browser CustomEvent with its name
 * and a separate provider object. We call eth_accounts on each provider to
 * find which one holds the connected address — guaranteed correct attribution.
 *
 * This is the PRIMARY EVM detection path. The flag-based registry in evm.ts
 * is the FALLBACK for wallets that don't support EIP-6963.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface EIP6963ProviderInfo {
  uuid: string;
  name: string;
  icon: string;
  rdns: string;
}

export interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider;
}

export interface EIP6963AnnounceEvent extends CustomEvent {
  detail: EIP6963ProviderDetail;
}

export interface EIP6963ConnectedWallet {
  address: string;
  providerName: string;
  provider: EIP1193Provider;
}

// ── Module-level state ───────────────────────────────────────────────

/** Discovered providers keyed by rdns (deduped) */
const providers = new Map<string, EIP6963ProviderDetail>();

/** Reference to the announce listener so we can remove it on reset */
let announceHandler: ((event: Event) => void) | null = null;

/** Cleanup functions for onEIP6963Announce listeners */
const announceCleanups: Array<() => void> = [];

/** Idempotency guard — startEIP6963Discovery is safe to call multiple times */
let discoveryStarted = false;

// ── Public API ───────────────────────────────────────────────────────

/**
 * Start listening for EIP-6963 provider announcements, then request them.
 * Idempotent — calling multiple times is a no-op.
 */
export function startEIP6963Discovery(): void {
  if (discoveryStarted) return;
  discoveryStarted = true;

  announceHandler = (event: Event) => {
    const detail = (event as EIP6963AnnounceEvent).detail;
    if (detail?.info?.rdns && detail?.provider) {
      providers.set(detail.info.rdns, detail);
    }
  };

  window.addEventListener('eip6963:announceProvider', announceHandler);
  window.dispatchEvent(new Event('eip6963:requestProvider'));
}

/**
 * Snapshot of all discovered providers.
 */
export function getEIP6963Providers(): Map<string, EIP6963ProviderDetail> {
  return new Map(providers);
}

/**
 * For each discovered provider, call eth_accounts (silent, no popup) and
 * return every connected address with its provider name.
 *
 * Uses Promise.allSettled with a 3-second timeout per provider so one
 * slow/broken extension can't block the others.
 */
export async function getEIP6963ConnectedWallets(): Promise<EIP6963ConnectedWallet[]> {
  const TIMEOUT_MS = 3_000;
  const entries = Array.from(providers.values());
  if (entries.length === 0) return [];

  const results = await Promise.allSettled(
    entries.map(({ info, provider }) => {
      const accountsPromise = provider.request({ method: 'eth_accounts' }).then((accounts: unknown) => {
        const addrs = accounts as string[];
        if (!Array.isArray(addrs)) return [];
        return addrs
          .filter((a) => typeof a === 'string' && a.length > 0)
          .map((address) => ({
            address,
            providerName: info.name,
            provider,
          }));
      });

      const timeoutPromise = new Promise<EIP6963ConnectedWallet[]>((_, reject) =>
        setTimeout(() => reject(new Error(`EIP-6963 timeout: ${info.name}`)), TIMEOUT_MS),
      );

      return Promise.race([accountsPromise, timeoutPromise]);
    }),
  );

  const wallets: EIP6963ConnectedWallet[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled') {
      wallets.push(...result.value);
    }
    // rejected = timeout or provider error — skip silently
  }
  return wallets;
}

/**
 * Given an address, query all discovered EIP-6963 providers to find which one
 * currently holds it. Returns the provider name, or null if no match.
 *
 * Used by the legacy window.ethereum accountsChanged handler to get correct
 * attribution even when the event fires on the global rather than the
 * individual provider object.
 */
export async function resolveEIP6963ProviderByAddress(address: string): Promise<string | null> {
  const TIMEOUT_MS = 1_000;
  const entries = Array.from(providers.values());
  if (entries.length === 0) return null;

  const lowerAddress = address.toLowerCase();

  const results = await Promise.allSettled(
    entries.map(({ info, provider }) => {
      const accountsPromise = provider.request({ method: 'eth_accounts' }).then((accounts: unknown) => {
        const addrs = accounts as string[];
        if (!Array.isArray(addrs)) return null;
        const match = addrs.some((a) => typeof a === 'string' && a.toLowerCase() === lowerAddress);
        return match ? info.name : null;
      });

      const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS));

      return Promise.race([accountsPromise, timeoutPromise]);
    }),
  );

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== null) {
      return result.value;
    }
  }
  return null;
}

/**
 * Subscribe to late-arriving provider announcements.
 * Returns a cleanup function to remove the listener.
 */
export function onEIP6963Announce(callback: (detail: EIP6963ProviderDetail) => void): () => void {
  const handler = (event: Event) => {
    const detail = (event as EIP6963AnnounceEvent).detail;
    if (detail?.info?.rdns && detail?.provider) {
      // Also store it in the module-level map
      providers.set(detail.info.rdns, detail);
      callback(detail);
    }
  };

  window.addEventListener('eip6963:announceProvider', handler);
  const cleanup = () => window.removeEventListener('eip6963:announceProvider', handler);
  announceCleanups.push(cleanup);
  return cleanup;
}

/**
 * Test helper: clears all module state so tests start clean.
 */
export function __resetEIP6963(): void {
  providers.clear();
  if (announceHandler) {
    window.removeEventListener('eip6963:announceProvider', announceHandler);
    announceHandler = null;
  }
  // Remove all onEIP6963Announce listeners
  for (const cleanup of announceCleanups) {
    cleanup();
  }
  announceCleanups.length = 0;
  discoveryStarted = false;
}
