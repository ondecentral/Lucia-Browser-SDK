import LuciaSDK from '../../core';
import { __resetEIP6963 } from '../../features/web3/eip6963';
import * as sessionUtils from '../../infrastructure/session';

// Helper to mock fetch and capture requests
let fetchMock: jest.Mock;
let fetchCalls: any[];

// Helper to mock localStorage and sessionStorage
let localStorageMock: { [key: string]: string };
let sessionStorageMock: { [key: string]: string };

// Mock session data with the new structure (no hash on client side)
const mockSession = {
  id: 'mock-session-id',
  timestamp: Date.now(),
};

beforeEach(() => {
  // Reset fetch mock
  fetchCalls = [];
  fetchMock = jest.fn((url, options) => {
    fetchCalls.push({ url, options });
    // Simulate /api/sdk/init returning a lid
    if (url.endsWith('/api/sdk/init')) {
      return Promise.resolve({
        json: () => Promise.resolve({ lid: 'integration-lid' }),
      });
    }
    // Simulate other endpoints
    return Promise.resolve({
      json: () => Promise.resolve({ success: true }),
    });
  });
  global.fetch = fetchMock;

  // Reset localStorage mock
  localStorageMock = {};
  Object.defineProperty(window, 'localStorage', {
    value: {
      getItem: jest.fn((key: string) => localStorageMock[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: jest.fn(() => {
        Object.keys(localStorageMock).forEach((k) => delete localStorageMock[k]);
      }),
    },
    writable: true,
  });

  // Reset sessionStorage mock
  sessionStorageMock = {};
  Object.defineProperty(window, 'sessionStorage', {
    value: {
      getItem: jest.fn((key: string) => sessionStorageMock[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        sessionStorageMock[key] = value;
      }),
      removeItem: jest.fn((key: string) => {
        delete sessionStorageMock[key];
      }),
      clear: jest.fn(() => {
        Object.keys(sessionStorageMock).forEach((k) => delete sessionStorageMock[k]);
      }),
    },
    writable: true,
  });

  // Mock session utils - getSessionData and storeSessionID
  jest.spyOn(sessionUtils, 'getSessionData').mockReturnValue(mockSession);
  jest.spyOn(sessionUtils, 'storeSessionID').mockReturnValue(mockSession);

  // Reset EIP-6963 state between tests
  __resetEIP6963();

  // Clear wallet providers to prevent auto-detect during init
  (window as any).ethereum = undefined;
  delete (window as any).solana;
  delete (window as any).phantom;
  delete (window as any).solflare;
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('LuciaSDK Integration User Flow', () => {
  it('should initialize, track page view, and send user info in sequence', async () => {
    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });

    // 1. Initialize SDK
    await sdk.init();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/sdk/init'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(localStorageMock.lid).toBe('integration-lid');

    // 2. Track a page view
    await sdk.pageView('/home');
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/sdk/page'),
      expect.objectContaining({ method: 'POST' }),
    );

    // 3. Send user info
    await sdk.userInfo('user@example.com', { name: 'Test User' });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/sdk/user'),
      expect.objectContaining({ method: 'POST' }),
    );

    // 4. Check the order and payloads of fetch calls (no wallet auto-detect since ethereum is cleared)
    expect(fetchCalls.length).toBe(3);
    expect(fetchCalls[0].url).toContain('/api/sdk/init');
    expect(fetchCalls[1].url).toContain('/api/sdk/page');
    expect(fetchCalls[2].url).toContain('/api/sdk/user');

    // 5. Verify the session structure in the payload
    const initPayload = JSON.parse(fetchCalls[0].options.body);
    expect(initPayload).toHaveProperty('user');
    expect(initPayload).toHaveProperty('session');
    expect(initPayload.session).toHaveProperty('id');
    // Hash is optional - only present if returned from backend
    // No serverSessionId - removed from structure
    expect(initPayload).toHaveProperty('utm');

    // 6. Verify the session structure in the page view payload
    const pageViewPayload = JSON.parse(fetchCalls[1].options.body);
    expect(pageViewPayload.session).toHaveProperty('id');
    expect(pageViewPayload.session).toHaveProperty('timestamp');
    // Hash is optional - only present if returned from backend
  });

  it('should create a new session if none exists during init', async () => {
    // Mock getSessionData to return null for this test
    jest.spyOn(sessionUtils, 'getSessionData').mockReturnValueOnce(null);

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });

    // Initialize SDK
    await sdk.init();

    // Verify storeSessionID was called
    expect(sessionUtils.storeSessionID).toHaveBeenCalled();

    // Verify API call was made with the correct session structure
    const initCall = fetchCalls.find((call) => call.url.includes('/api/sdk/init'));
    expect(initCall).toBeDefined();

    const initPayload = JSON.parse(initCall.options.body);
    expect(initPayload.session).toHaveProperty('id');
    // Hash is optional - only present if returned from backend previously
    // No serverSessionId - removed from structure
  });
});

describe('LuciaSDK UTM/Analytics Integration', () => {
  beforeEach(() => {
    // Set up window.location with UTM parameters using history API (works with jsdom)
    setTestUrl(
      'https://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=shoes&utm_content=ad1',
    );
  });

  it('should include UTM parameters in the analytics payload', async () => {
    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();
    await sdk.pageView('/utm-test');

    // Find the init call and check UTM params
    const initCall = fetchCalls.find((call) => call.url.includes('/api/sdk/init'));
    expect(initCall).toBeDefined();
    const initPayload = JSON.parse(initCall.options.body);

    // Verify UTM parameters
    expect(initPayload.utm).toEqual({
      utm_source: 'google',
      utm_medium: 'cpc',
      utm_campaign: 'spring',
      utm_term: 'shoes',
      utm_content: 'ad1',
    });

    // Verify session structure
    expect(initPayload.session).toHaveProperty('id');
    // Hash is optional - only present if returned from backend
    // No serverSessionId - removed from structure

    // Find the page view call
    const pageViewCall = fetchCalls.find((call) => call.url.includes('/api/sdk/page'));
    expect(pageViewCall).toBeDefined();
    const pagePayload = JSON.parse(pageViewCall.options.body);

    // Verify expected properties
    expect(pagePayload).toHaveProperty('user');
    expect(pagePayload).toHaveProperty('session');
    expect(pagePayload).toHaveProperty('lid');

    // Verify session structure in page view
    expect(pagePayload.session).toHaveProperty('id');
    expect(pagePayload.session).toHaveProperty('timestamp');
    // Hash is optional - only present if returned from backend
    // No serverSessionId - removed from structure
  });
});

describe('LuciaSDK Wallet Connection Integration', () => {
  afterEach(() => {
    delete (window as any).ethereum;
    delete (window as any).phantom;
    delete (window as any).solana;
  });

  it('should auto-detect Ethereum wallet (MetaMask) during init', async () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    (window as any).ethereum = {
      isMetaMask: true,
      isConnected: () => true,
      selectedAddress: mockAddress,
    };

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    // Find the wallet info call (auto-detected during init)
    const walletCall = fetchCalls.find((call) => call.url.includes('/api/sdk/wallet'));
    expect(walletCall).toBeDefined();
    const walletPayload = JSON.parse(walletCall.options.body);
    expect(walletPayload.walletAddress).toBe(mockAddress);
    expect(walletPayload.provider).toBe('MetaMask');

    // Verify session structure
    expect(walletPayload.session).toHaveProperty('id');
    expect(walletPayload.session).toHaveProperty('timestamp');

    sdk.destroy();
  });

  it('should send wallet info with new options object', async () => {
    // No ethereum provider set — auto-detect won't fire
    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    const mockAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
    await sdk.sendWalletInfo(mockAddress, { provider: 'MetaMask', connectorType: 'injected', chainId: 1 });

    const walletCalls = fetchCalls.filter((call) => call.url.includes('/api/sdk/wallet'));
    expect(walletCalls).toHaveLength(1);
    const walletPayload = JSON.parse(walletCalls[0].options.body);
    expect(walletPayload.walletAddress).toBe(mockAddress);
    expect(walletPayload.provider).toBe('MetaMask');
    expect(walletPayload.connectorType).toBe('injected');
    expect(walletPayload.chainId).toBe(1);

    sdk.destroy();
  });

  it('should send wallet info with legacy (chainId, walletName) signature', async () => {
    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    const mockAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
    await sdk.sendWalletInfo(mockAddress, 1, 'Metamask');

    const walletCalls = fetchCalls.filter((call) => call.url.includes('/api/sdk/wallet'));
    expect(walletCalls).toHaveLength(1);
    const walletPayload = JSON.parse(walletCalls[0].options.body);
    expect(walletPayload.walletAddress).toBe(mockAddress);
    expect(walletPayload.provider).toBe('Metamask');
    expect(walletPayload.walletName).toBe('Metamask');
    expect(walletPayload.chainId).toBe(1);

    sdk.destroy();
  });

  it('should deduplicate wallet addresses within a session', async () => {
    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    const mockAddress = '0xabcdef1234567890abcdef1234567890abcdef12';
    await sdk.sendWalletInfo(mockAddress, { provider: 'MetaMask' });
    await sdk.sendWalletInfo(mockAddress, { provider: 'MetaMask' });

    const walletCalls = fetchCalls.filter((call) => call.url.includes('/api/sdk/wallet'));
    expect(walletCalls).toHaveLength(1);

    sdk.destroy();
  });
});

// ── EIP-6963 Integration Tests ──────────────────────────────────────

// Helper: dispatch a mock EIP-6963 announceProvider event
function announceEIP6963(rdns: string, name: string, accounts: string[]) {
  const provider = {
    request: jest.fn((args: { method: string }) => {
      if (args.method === 'eth_accounts') return Promise.resolve(accounts);
      return Promise.reject(new Error('unsupported'));
    }),
    on: jest.fn(),
    removeListener: jest.fn(),
  };
  window.dispatchEvent(
    new CustomEvent('eip6963:announceProvider', {
      detail: {
        info: { uuid: `uuid-${rdns}`, name, icon: 'data:image/svg+xml,...', rdns },
        provider,
      },
    }),
  );
  return provider;
}

describe('EIP-6963 Integration', () => {
  afterEach(() => {
    delete (window as any).ethereum;
    delete (window as any).phantom;
    delete (window as any).solana;
  });

  it('should detect wallets via EIP-6963 during init', async () => {
    // Simulate wallets announcing when requestProvider is dispatched
    window.addEventListener(
      'eip6963:requestProvider',
      () => {
        announceEIP6963('io.metamask', 'MetaMask', ['0xabc123']);
        announceEIP6963('io.rabby', 'Rabby', ['0xdef456']);
      },
      { once: true },
    );

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    const walletCalls = fetchCalls.filter((call: any) => call.url.includes('/api/sdk/wallet'));
    expect(walletCalls).toHaveLength(2);

    const payloads = walletCalls.map((c: any) => JSON.parse(c.options.body));
    expect(payloads).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ walletAddress: '0xabc123', provider: 'MetaMask' }),
        expect.objectContaining({ walletAddress: '0xdef456', provider: 'Rabby' }),
      ]),
    );

    sdk.destroy();
  });

  it('should fall back to legacy detection when no EIP-6963 providers exist', async () => {
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    (window as any).ethereum = {
      isMetaMask: true,
      isConnected: () => true,
      selectedAddress: mockAddress,
      on: jest.fn(),
    };

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    const walletCalls = fetchCalls.filter((call: any) => call.url.includes('/api/sdk/wallet'));
    expect(walletCalls).toHaveLength(1);

    const payload = JSON.parse(walletCalls[0].options.body);
    expect(payload.walletAddress).toBe(mockAddress);
    expect(payload.provider).toBe('MetaMask');

    sdk.destroy();
  });

  it('should skip legacy detection when EIP-6963 finds wallets', async () => {
    // Set up legacy provider that would be detected
    const legacyAddress = '0xlegacy_should_not_appear';
    (window as any).ethereum = {
      isMetaMask: true,
      isConnected: () => true,
      selectedAddress: legacyAddress,
      on: jest.fn(),
    };

    // EIP-6963 announces a wallet
    window.addEventListener(
      'eip6963:requestProvider',
      () => {
        announceEIP6963('app.phantom', 'Phantom', ['0xphantom_eip6963']);
      },
      { once: true },
    );

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    const walletCalls = fetchCalls.filter((call: any) => call.url.includes('/api/sdk/wallet'));
    // Should only see EIP-6963 result, NOT the legacy window.ethereum.selectedAddress
    expect(walletCalls).toHaveLength(1);

    const payload = JSON.parse(walletCalls[0].options.body);
    expect(payload.walletAddress).toBe('0xphantom_eip6963');
    expect(payload.provider).toBe('Phantom');

    sdk.destroy();
  });

  it('should handle late-arriving EIP-6963 providers', async () => {
    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    // No wallet calls yet (no providers during init)
    const initialWalletCalls = fetchCalls.filter((call: any) => call.url.includes('/api/sdk/wallet'));
    expect(initialWalletCalls).toHaveLength(0);

    // Late-arriving provider announces after init
    announceEIP6963('io.late-wallet', 'LateWallet', ['0xlate_address']);

    // Wait for the async eth_accounts call to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    const walletCalls = fetchCalls.filter((call: any) => call.url.includes('/api/sdk/wallet'));
    expect(walletCalls).toHaveLength(1);

    const payload = JSON.parse(walletCalls[0].options.body);
    expect(payload.walletAddress).toBe('0xlate_address');
    expect(payload.provider).toBe('LateWallet');

    sdk.destroy();
  });

  it('should attach per-provider accountsChanged listeners', async () => {
    let metamaskProvider: any;

    window.addEventListener(
      'eip6963:requestProvider',
      () => {
        metamaskProvider = announceEIP6963('io.metamask', 'MetaMask', ['0xoriginal']);
      },
      { once: true },
    );

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    // Verify accountsChanged listener was attached to the EIP-6963 provider
    expect(metamaskProvider.on).toHaveBeenCalledWith('accountsChanged', expect.any(Function));

    // Simulate account switch
    const accountsChangedHandler = metamaskProvider.on.mock.calls.find(
      (call: any[]) => call[0] === 'accountsChanged',
    )[1];
    accountsChangedHandler(['0xnew_account']);

    // Wait for async sendWalletInfo
    await new Promise((resolve) => setTimeout(resolve, 50));

    const walletCalls = fetchCalls.filter((call: any) => call.url.includes('/api/sdk/wallet'));
    // 1 for initial detection + 1 for account switch
    expect(walletCalls).toHaveLength(2);

    const switchPayload = JSON.parse(walletCalls[1].options.body);
    expect(switchPayload.walletAddress).toBe('0xnew_account');
    expect(switchPayload.provider).toBe('MetaMask');

    sdk.destroy();
  });

  it('should deduplicate addresses across EIP-6963 and manual sendWalletInfo', async () => {
    window.addEventListener(
      'eip6963:requestProvider',
      () => {
        announceEIP6963('io.metamask', 'MetaMask', ['0xshared_address']);
      },
      { once: true },
    );

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();

    // Try to send the same address manually
    await sdk.sendWalletInfo('0xshared_address', { provider: 'MetaMask' });

    const walletCalls = fetchCalls.filter((call: any) => call.url.includes('/api/sdk/wallet'));
    // Should only be 1 — the EIP-6963 detection; manual call deduped
    expect(walletCalls).toHaveLength(1);

    sdk.destroy();
  });
});
