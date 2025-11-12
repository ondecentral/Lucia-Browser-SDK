import LuciaSDK from '../../core';
import * as sessionUtils from '../../utils/session';

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

    // 4. Check the order and payloads of fetch calls
    expect(fetchCalls.length).toBeGreaterThanOrEqual(3);
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
    // Set up window.location with UTM parameters
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=shoes&utm_content=ad1',
        search: '?utm_source=google&utm_medium=cpc&utm_campaign=spring&utm_term=shoes&utm_content=ad1',
      },
      writable: true,
    });
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
  beforeEach(() => {
    // Reset fetch and localStorage mocks (already done in global beforeEach)
  });

  it('should connect Ethereum wallet (MetaMask) and send wallet info', async () => {
    // Mock MetaMask provider
    const mockAddress = '0x1234567890abcdef1234567890abcdef12345678';
    const mockChainId = 1;
    const mockWalletName = 'Metamask';
    (window as any).ethereum = {
      isMetaMask: true,
      isConnected: () => true,
      selectedAddress: mockAddress,
      request: jest.fn().mockImplementation(({ method }: { method: string }) => {
        if (method === 'eth_requestAccounts') return Promise.resolve([mockAddress]);
        if (method === 'eth_chainId') return Promise.resolve('0x1');
        return Promise.resolve();
      }),
    };

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();
    await sdk.sendWalletInfo(mockAddress, mockChainId, mockWalletName);

    // Find the wallet info call
    const walletCall = fetchCalls.find((call) => call.url.includes('/api/sdk/wallet'));
    expect(walletCall).toBeDefined();
    const walletPayload = JSON.parse(walletCall.options.body);
    expect(walletPayload.walletAddress).toBe(mockAddress);
    expect(walletPayload.chainId).toBe(mockChainId);
    expect(walletPayload.walletName).toBe(mockWalletName);

    // Verify session structure
    expect(walletPayload.session).toHaveProperty('id');
    expect(walletPayload.session).toHaveProperty('timestamp');
    // Hash is optional - only present if returned from backend
    // No serverSessionId - removed from structure
  });

  it('should connect Solana wallet (Phantom) and send wallet info', async () => {
    // Mock Phantom provider
    const mockSolanaAddress = 'phantom-address-789';
    (window as any).phantom = {
      solana: {
        isConnected: true,
        publicKey: { toString: () => mockSolanaAddress },
        connect: jest.fn(),
      },
    };

    const sdk = new LuciaSDK({ apiKey: 'integration-test-key' });
    await sdk.init();
    // Simulate the SDK or your app calling the Solana wallet info method
    // (Assume you have a method like sendSolanaWalletInfo, or you can call sendWalletInfo with Solana data)
    await sdk.sendWalletInfo(mockSolanaAddress, 'solana', 'Phantom');

    // Find the wallet info call
    const walletCall = fetchCalls.find((call) => call.url.includes('/api/sdk/wallet'));
    expect(walletCall).toBeDefined();
    const walletPayload = JSON.parse(walletCall.options.body);
    expect(walletPayload.walletAddress).toBe(mockSolanaAddress);
    expect(walletPayload.chainId).toBe('solana');
    expect(walletPayload.walletName).toBe('Phantom');

    // Verify session structure
    expect(walletPayload.session).toHaveProperty('id');
    expect(walletPayload.session).toHaveProperty('timestamp');
    // Hash is optional - only present if returned from backend
    // No serverSessionId - removed from structure
  });
});
