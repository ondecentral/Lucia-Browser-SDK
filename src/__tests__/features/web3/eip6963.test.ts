import {
  startEIP6963Discovery,
  getEIP6963Providers,
  getEIP6963ConnectedWallets,
  resolveEIP6963ProviderByAddress,
  onEIP6963Announce,
  __resetEIP6963,
} from '../../../features/web3/eip6963';

// Helper: create a mock EIP-6963 provider detail
function mockProviderDetail(
  rdns: string,
  name: string,
  accounts: string[] = [],
  opts?: { rejectWith?: Error; delayMs?: number; noOn?: boolean },
) {
  const requestMock = jest.fn((args: { method: string }) => {
    if (args.method === 'eth_accounts') {
      if (opts?.rejectWith) return Promise.reject(opts.rejectWith);
      if (opts?.delayMs) {
        return new Promise((resolve) => setTimeout(() => resolve(accounts), opts.delayMs));
      }
      return Promise.resolve(accounts);
    }
    return Promise.reject(new Error('unsupported method'));
  });

  const onMock = opts?.noOn ? undefined : jest.fn();
  const removeListenerMock = opts?.noOn ? undefined : jest.fn();

  return {
    detail: {
      info: { uuid: `uuid-${rdns}`, name, icon: 'data:image/svg+xml,...', rdns },
      provider: { request: requestMock, on: onMock, removeListener: removeListenerMock },
    },
    requestMock,
    onMock,
    removeListenerMock,
  };
}

// Helper: dispatch a mock eip6963:announceProvider event
function announceProvider(detail: { info: any; provider: any }) {
  window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }));
}

beforeEach(() => {
  __resetEIP6963();
});

describe('EIP-6963 Discovery', () => {
  describe('startEIP6963Discovery', () => {
    it('should collect announced providers', () => {
      startEIP6963Discovery();

      const { detail } = mockProviderDetail('io.metamask', 'MetaMask');
      announceProvider(detail);

      const providers = getEIP6963Providers();
      expect(providers.size).toBe(1);
      expect(providers.get('io.metamask')?.info.name).toBe('MetaMask');
    });

    it('should be idempotent — second call is a no-op', () => {
      const dispatchSpy = jest.spyOn(window, 'dispatchEvent');
      startEIP6963Discovery();
      startEIP6963Discovery();

      // requestProvider should only be dispatched once
      const requestEvents = dispatchSpy.mock.calls.filter(([e]) => (e as Event).type === 'eip6963:requestProvider');
      expect(requestEvents).toHaveLength(1);
      dispatchSpy.mockRestore();
    });

    it('should dedup providers by rdns', () => {
      startEIP6963Discovery();

      const { detail: d1 } = mockProviderDetail('io.metamask', 'MetaMask');
      const { detail: d2 } = mockProviderDetail('io.metamask', 'MetaMask v2');
      announceProvider(d1);
      announceProvider(d2);

      const providers = getEIP6963Providers();
      expect(providers.size).toBe(1);
      // Latest announcement wins
      expect(providers.get('io.metamask')?.info.name).toBe('MetaMask v2');
    });

    it('should collect multiple different providers', () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.metamask', 'MetaMask').detail);
      announceProvider(mockProviderDetail('io.rabby', 'Rabby').detail);
      announceProvider(mockProviderDetail('app.phantom', 'Phantom').detail);

      expect(getEIP6963Providers().size).toBe(3);
    });

    it('should ignore events with missing rdns', () => {
      startEIP6963Discovery();

      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: { uuid: 'uuid', name: 'Bad', icon: '', rdns: '' },
            provider: { request: jest.fn() },
          },
        }),
      );

      expect(getEIP6963Providers().size).toBe(0);
    });

    it('should ignore events with missing provider', () => {
      startEIP6963Discovery();

      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: { uuid: 'uuid', name: 'Bad', icon: '', rdns: 'io.bad' },
            provider: null,
          },
        }),
      );

      expect(getEIP6963Providers().size).toBe(0);
    });
  });

  describe('getEIP6963ConnectedWallets', () => {
    it('should return empty array when no providers are discovered', async () => {
      const wallets = await getEIP6963ConnectedWallets();
      expect(wallets).toEqual([]);
    });

    it('should return connected addresses with correct provider names', async () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.metamask', 'MetaMask', ['0xabc']).detail);
      announceProvider(mockProviderDetail('io.rabby', 'Rabby', ['0xdef']).detail);

      const wallets = await getEIP6963ConnectedWallets();
      expect(wallets).toHaveLength(2);
      expect(wallets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ address: '0xabc', providerName: 'MetaMask' }),
          expect.objectContaining({ address: '0xdef', providerName: 'Rabby' }),
        ]),
      );
    });

    it('should handle a wallet with multiple accounts', async () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.metamask', 'MetaMask', ['0xabc', '0xdef']).detail);

      const wallets = await getEIP6963ConnectedWallets();
      expect(wallets).toHaveLength(2);
      expect(wallets[0].providerName).toBe('MetaMask');
      expect(wallets[1].providerName).toBe('MetaMask');
      expect(wallets.map((w) => w.address)).toEqual(['0xabc', '0xdef']);
    });

    it('should skip providers that return no accounts', async () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.metamask', 'MetaMask', ['0xabc']).detail);
      announceProvider(mockProviderDetail('io.rabby', 'Rabby', []).detail);

      const wallets = await getEIP6963ConnectedWallets();
      expect(wallets).toHaveLength(1);
      expect(wallets[0].providerName).toBe('MetaMask');
    });

    it('should skip providers that reject eth_accounts', async () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.metamask', 'MetaMask', ['0xabc']).detail);
      announceProvider(mockProviderDetail('io.broken', 'Broken', [], { rejectWith: new Error('denied') }).detail);

      const wallets = await getEIP6963ConnectedWallets();
      expect(wallets).toHaveLength(1);
      expect(wallets[0].providerName).toBe('MetaMask');
    });

    it('should timeout slow providers (3s)', async () => {
      jest.useFakeTimers();
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.fast', 'Fast', ['0xabc']).detail);
      announceProvider(mockProviderDetail('io.slow', 'Slow', [], { delayMs: 10_000 }).detail);

      const promise = getEIP6963ConnectedWallets();

      // advanceTimersByTimeAsync properly interleaves microtasks and timers
      await jest.advanceTimersByTimeAsync(3_100);

      const wallets = await promise;
      expect(wallets).toHaveLength(1);
      expect(wallets[0].providerName).toBe('Fast');

      jest.useRealTimers();
    });

    it('should include provider reference in results', async () => {
      startEIP6963Discovery();

      const { detail } = mockProviderDetail('io.metamask', 'MetaMask', ['0xabc']);
      announceProvider(detail);

      const wallets = await getEIP6963ConnectedWallets();
      expect(wallets[0].provider).toBe(detail.provider);
    });

    it('should filter out non-string and empty addresses', async () => {
      startEIP6963Discovery();

      // Announce a provider that returns mixed garbage
      const provider = {
        request: jest.fn().mockResolvedValue(['0xgood', '', null, 42, '0xalso_good']),
        on: jest.fn(),
      };
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: { uuid: 'uuid', name: 'Messy', icon: '', rdns: 'io.messy' },
            provider,
          },
        }),
      );

      const wallets = await getEIP6963ConnectedWallets();
      expect(wallets).toHaveLength(2);
      expect(wallets.map((w) => w.address)).toEqual(['0xgood', '0xalso_good']);
    });
  });

  describe('onEIP6963Announce', () => {
    it('should fire callback for late-arriving providers', () => {
      startEIP6963Discovery();

      const callback = jest.fn();
      onEIP6963Announce(callback);

      const { detail } = mockProviderDetail('io.late', 'LateWallet', ['0x1']);
      announceProvider(detail);

      expect(callback).toHaveBeenCalledWith(detail);
    });

    it('should also store late-arriving providers in the map', () => {
      startEIP6963Discovery();

      onEIP6963Announce(() => {});

      const { detail } = mockProviderDetail('io.late', 'LateWallet');
      announceProvider(detail);

      expect(getEIP6963Providers().has('io.late')).toBe(true);
    });

    it('should ignore events with missing rdns', () => {
      startEIP6963Discovery();

      const callback = jest.fn();
      onEIP6963Announce(callback);

      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: { uuid: 'uuid', name: 'Bad', icon: '', rdns: '' },
            provider: { request: jest.fn() },
          },
        }),
      );

      expect(callback).not.toHaveBeenCalled();
      expect(getEIP6963Providers().size).toBe(0);
    });

    it('should ignore events with missing provider', () => {
      startEIP6963Discovery();

      const callback = jest.fn();
      onEIP6963Announce(callback);

      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: {
            info: { uuid: 'uuid', name: 'Bad', icon: '', rdns: 'io.bad' },
            provider: null,
          },
        }),
      );

      expect(callback).not.toHaveBeenCalled();
      expect(getEIP6963Providers().size).toBe(0);
    });

    it('should return a cleanup function that removes the listener', () => {
      startEIP6963Discovery();

      const callback = jest.fn();
      const cleanup = onEIP6963Announce(callback);

      cleanup();

      announceProvider(mockProviderDetail('io.after', 'AfterCleanup').detail);

      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('__resetEIP6963', () => {
    it('should clear the provider store', () => {
      startEIP6963Discovery();
      announceProvider(mockProviderDetail('io.metamask', 'MetaMask').detail);
      expect(getEIP6963Providers().size).toBe(1);

      __resetEIP6963();
      expect(getEIP6963Providers().size).toBe(0);
    });

    it('should remove the announce listener', () => {
      startEIP6963Discovery();
      __resetEIP6963();

      // Announcing after reset should not add to store
      announceProvider(mockProviderDetail('io.metamask', 'MetaMask').detail);
      expect(getEIP6963Providers().size).toBe(0);
    });

    it('should allow startEIP6963Discovery to be called again after reset', () => {
      startEIP6963Discovery();
      __resetEIP6963();

      // Should not throw, and should re-register
      startEIP6963Discovery();
      announceProvider(mockProviderDetail('io.metamask', 'MetaMask').detail);
      expect(getEIP6963Providers().size).toBe(1);
    });
  });

  describe('getEIP6963Providers', () => {
    it('should return a snapshot (not the live map)', () => {
      startEIP6963Discovery();
      announceProvider(mockProviderDetail('io.metamask', 'MetaMask').detail);

      const snapshot = getEIP6963Providers();
      announceProvider(mockProviderDetail('io.rabby', 'Rabby').detail);

      // Snapshot should not change
      expect(snapshot.size).toBe(1);
      // But fresh call should reflect update
      expect(getEIP6963Providers().size).toBe(2);
    });
  });

  describe('resolveEIP6963ProviderByAddress', () => {
    it('should return the provider name that holds the address', async () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.metamask', 'MetaMask', ['0xabc']).detail);
      announceProvider(mockProviderDetail('io.rabby', 'Rabby Wallet', ['0xdef']).detail);

      expect(await resolveEIP6963ProviderByAddress('0xdef')).toBe('Rabby Wallet');
    });

    it('should match case-insensitively', async () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.rabby', 'Rabby Wallet', ['0xAbCdEf']).detail);

      expect(await resolveEIP6963ProviderByAddress('0xabcdef')).toBe('Rabby Wallet');
      expect(await resolveEIP6963ProviderByAddress('0xABCDEF')).toBe('Rabby Wallet');
    });

    it('should return null when no provider holds the address', async () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.metamask', 'MetaMask', ['0xabc']).detail);

      expect(await resolveEIP6963ProviderByAddress('0xunknown')).toBeNull();
    });

    it('should return null when no providers exist', async () => {
      expect(await resolveEIP6963ProviderByAddress('0xabc')).toBeNull();
    });

    it('should handle provider errors gracefully', async () => {
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.broken', 'Broken', [], { rejectWith: new Error('fail') }).detail);
      announceProvider(mockProviderDetail('io.rabby', 'Rabby Wallet', ['0xdef']).detail);

      // Should still find Rabby despite Broken erroring
      expect(await resolveEIP6963ProviderByAddress('0xdef')).toBe('Rabby Wallet');
    });

    it('should timeout slow providers (1s) and return null', async () => {
      jest.useFakeTimers();
      startEIP6963Discovery();

      announceProvider(mockProviderDetail('io.slow', 'Slow', [], { delayMs: 5_000 }).detail);

      const promise = resolveEIP6963ProviderByAddress('0xabc');
      await jest.advanceTimersByTimeAsync(1_100);
      expect(await promise).toBeNull();

      jest.useRealTimers();
    });
  });
});
