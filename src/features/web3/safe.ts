/**
 * Wallet extensions wrap the injected globals (and their own provider objects)
 * in a Proxy whose get trap returns a wrapped/bound function. When the
 * underlying property is a non-writable, non-configurable data property that
 * violates a JS Proxy invariant and the *read itself* throws a TypeError, so
 * every access to a wallet object has to be guarded — not just the calls.
 */
export function safeWalletRead<T>(read: () => T): T | undefined {
  try {
    return read();
  } catch {
    return undefined;
  }
}
