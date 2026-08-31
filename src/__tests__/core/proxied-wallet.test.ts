import LuciaSDK from '../../core';
import * as dataUtils from '../../features/fingerprinting';
import { detectEvmProvider, detectSolanaProvider, __resetEIP6963 } from '../../features/web3';
import * as sessionUtils from '../../infrastructure/session';

/**
 * Wallet extensions wrap the injected globals in a Proxy whose get trap
 * returns a wrapped/bound function. When the underlying property is a
 * non-writable, non-configurable data property, that violates a JS Proxy
 * invariant and the *read itself* throws a TypeError.
 */
function proxiedWallet(props: Record<string, unknown>): unknown {
  const target: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(target, key, { value, writable: false, configurable: false, enumerable: true });
  }
  return new Proxy(target, {
    get(t, key, receiver) {
      const value = Reflect.get(t, key, receiver);
      return typeof value === 'function' ? value.bind(t) : value;
    },
  });
}

describe('proxied wallet globals', () => {
  beforeEach(() => {
    jest.spyOn(dataUtils, 'getUtmParams').mockReturnValue({});
    jest.spyOn(dataUtils, 'getBrowserData').mockResolvedValue({} as never);
    jest.spyOn(sessionUtils, 'getLidData').mockReturnValue('lid');
    jest.spyOn(sessionUtils, 'getSessionData').mockReturnValue({ id: 'c1', timestamp: Date.now() });
    jest.spyOn(sessionUtils, 'storeSessionID').mockReturnValue({ id: 'c1', timestamp: Date.now() });
    jest.spyOn(sessionUtils, 'getUser').mockReturnValue('user');

    (window as unknown as Record<string, unknown>).ethereum = proxiedWallet({
      isMetaMask: true,
      selectedAddress: '0xabc',
      isConnected: () => true,
      on: function on(_e: string, _h: unknown) {},
      removeListener: function removeListener(_e: string, _h: unknown) {},
    });
    (window as unknown as Record<string, unknown>).solana = proxiedWallet({
      isPhantom: true,
      isConnected: true,
      publicKey: { toString: () => 'SoLaNa111' },
      on: function on(_e: string, _h: unknown) {},
      removeListener: function removeListener(_e: string, _h: unknown) {},
    });
  });

  afterEach(() => {
    __resetEIP6963();
    (window as unknown as Record<string, unknown>).ethereum = undefined;
    (window as unknown as Record<string, unknown>).solana = undefined;
    jest.restoreAllMocks();
  });

  it('reading a proxied wallet global throws (baseline for the guards below)', () => {
    expect(() => (window.ethereum as unknown as { on: unknown }).on).toThrow(TypeError);
  });

  it('detectEvmProvider does not throw on a proxied window.ethereum', () => {
    expect(() => detectEvmProvider()).not.toThrow();
  });

  it('detectSolanaProvider does not throw on a proxied window.solana', () => {
    expect(() => detectSolanaProvider()).not.toThrow();
  });

  it('checkMetaMaskConnection does not throw on a proxied window.ethereum', () => {
    const sdk = new LuciaSDK({ apiKey: 'k' });
    expect(() => sdk.checkMetaMaskConnection()).not.toThrow();
    sdk.destroy();
  });

  it('init completes when wallet globals are proxied', async () => {
    const sdk = new LuciaSDK({ apiKey: 'k' });
    jest.spyOn(sdk.httpClient, 'post').mockResolvedValue({ lid: 'new-lid' });

    await expect(sdk.init()).resolves.not.toThrow();

    sdk.destroy();
  });
});
