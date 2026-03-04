import LuciaSDK from '../../core';
import * as dataUtils from '../../features/fingerprinting';
import * as sessionUtils from '../../infrastructure/session';
import { BrowserData } from '../../types';

describe('LuciaSDK', () => {
  let sdk: LuciaSDK;
  let httpClientPostSpy: jest.SpyInstance;

  // Common mock implementations with proper types
  const mockBrowserData: BrowserData = {
    device: {
      cores: 8,
      memory: 16,
      cpuClass: 'mock-cpu',
      touch: false,
      devicePixelRatio: 2,
    },
    screen: {
      width: 1920,
      height: 1080,
      colorDepth: 24,
      availHeight: 1040,
      availWidth: 1900,
      orientation: {
        type: 'landscape-primary',
        angle: 0,
      },
    },
    browser: {
      language: 'en-US',
      encoding: 'UTF-8',
      timezone: -4,
      pluginsLength: 3,
      pluginNames: ['PDF Viewer', 'Chrome PDF Viewer'],
      applePayAvailable: false,
      uniqueHash: 'mockhash123',
      colorGamut: ['srgb'],
      contrastPreference: 'None',
    },
    permissions: {
      navPer: undefined,
      renderedPer: undefined,
      geoPer: undefined,
    },
    storage: {
      localStorage: true,
      indexedDB: true,
      openDB: false,
    },
  };

  const mockUser = 'test-user';
  const mockSession = {
    id: 'client123',
    timestamp: Date.now(),
  };
  const mockSessionWithHash = {
    id: 'client123',
    hash: 'backend-hash-123',
    timestamp: Date.now(),
  };
  const mockLid = 'test-lid';
  const mockUtm = { source: 'google', medium: 'cpc' };

  beforeEach(() => {
    // Setup spies on the utility functions instead of full mocks
    jest.spyOn(dataUtils, 'getUtmParams').mockReturnValue(mockUtm);
    jest.spyOn(dataUtils, 'getBrowserData').mockResolvedValue(mockBrowserData);
    jest.spyOn(sessionUtils, 'getLidData').mockReturnValue(mockLid);
    jest.spyOn(sessionUtils, 'getSessionData').mockReturnValue(mockSession);
    jest.spyOn(sessionUtils, 'storeSessionID').mockReturnValue(mockSession);
    jest.spyOn(sessionUtils, 'getUser').mockReturnValue(mockUser);

    // Create SDK instance with config
    sdk = new LuciaSDK({ apiKey: 'test-key' });

    // Spy on the httpClient.post method
    httpClientPostSpy = jest.spyOn(sdk.httpClient, 'post').mockResolvedValue({ lid: 'new-lid' });

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
      },
      writable: true,
    });

    // Ensure no wallet providers are available during init (avoid auto-detect)
    Object.defineProperty(window, 'ethereum', { value: undefined, writable: true });
    delete (window as any).solana;
    delete (window as any).phantom;
  });

  afterEach(() => {
    sdk.destroy();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('init', () => {
    it('should make a POST request without walletData in the payload', async () => {
      const serverSession = {
        hash: '99442d0d97d565dde60f2d3b196309622b55a3c5220bd89ed37eb1ee6bdeca4d',
        id: '7CC64140-7F41-4F66-B31C-9219FCBE20C1',
      };

      httpClientPostSpy.mockResolvedValueOnce({ lid: 'new-lid', session: serverSession });

      await sdk.init();

      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/init',
        {
          user: { name: mockUser },
          data: mockBrowserData,
          session: { id: mockSession.id },
          redirectHash: null,
          utm: mockUtm,
        },
        false,
      );
    });

    it('should include hash in POST request if session has hash from backend', async () => {
      jest.spyOn(sessionUtils, 'getSessionData').mockReturnValueOnce(mockSessionWithHash);

      const serverSession = {
        hash: '99442d0d97d565dde60f2d3b196309622b55a3c5220bd89ed37eb1ee6bdeca4d',
        id: '7CC64140-7F41-4F66-B31C-9219FCBE20C1',
      };

      httpClientPostSpy.mockResolvedValueOnce({ lid: 'new-lid', session: serverSession });

      await sdk.init();

      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/init',
        {
          user: { name: mockUser },
          data: mockBrowserData,
          session: { id: mockSessionWithHash.id, hash: mockSessionWithHash.hash },
          redirectHash: null,
          utm: mockUtm,
        },
        false,
      );
    });

    it('should store lid in localStorage if response data is received', async () => {
      await sdk.init();
      expect(window.localStorage.setItem).toHaveBeenCalledWith('lid', 'new-lid');
    });

    it('should update session storage with server session data', async () => {
      const serverSession = {
        hash: '99442d0d97d565dde60f2d3b196309622b55a3c5220bd89ed37eb1ee6bdeca4d',
        id: '7CC64140-7F41-4F66-B31C-9219FCBE20C1',
      };

      httpClientPostSpy.mockResolvedValueOnce({ lid: 'new-lid', session: serverSession });

      const updateSessionSpy = jest.spyOn(sessionUtils, 'updateSessionFromServer');

      await sdk.init();

      expect(updateSessionSpy).toHaveBeenCalledWith(serverSession);
    });

    it('should create a new session if none exists', async () => {
      jest.spyOn(sessionUtils, 'getSessionData').mockReturnValueOnce(null);

      await sdk.init();

      expect(sessionUtils.storeSessionID).toHaveBeenCalled();

      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/init',
        {
          user: { name: mockUser },
          data: mockBrowserData,
          session: { id: mockSession.id },
          redirectHash: null,
          utm: mockUtm,
        },
        false,
      );
    });

    it('should handle init response without session data gracefully', async () => {
      httpClientPostSpy.mockResolvedValueOnce({ lid: 'new-lid' });

      const updateSessionSpy = jest.spyOn(sessionUtils, 'updateSessionFromServer');

      await sdk.init();

      expect(updateSessionSpy).not.toHaveBeenCalled();
      expect(window.localStorage.setItem).toHaveBeenCalledWith('lid', 'new-lid');
    });

    it('should auto-detect EVM wallet if connected', async () => {
      Object.defineProperty(window, 'ethereum', {
        value: { selectedAddress: '0xabc123', isMetaMask: true },
        writable: true,
      });

      await sdk.init();

      // Should have called /api/sdk/wallet with the detected address
      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/wallet',
        expect.objectContaining({
          walletAddress: '0xabc123',
          provider: 'MetaMask',
        }),
      );
    });

    it('should auto-detect Solana wallet if connected', async () => {
      (window as any).solana = {
        isConnected: true,
        isPhantom: true,
        publicKey: { toString: () => 'So1anaAddr3ss123' },
      };
      (window as any).phantom = { solana: {} };

      await sdk.init();

      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/wallet',
        expect.objectContaining({
          walletAddress: 'So1anaAddr3ss123',
          provider: 'Phantom',
        }),
      );
    });
  });

  describe('userInfo', () => {
    it('should make a POST request with user information', async () => {
      const userId = 'user@example.com';
      const userInfo = { name: 'Test User', age: 30 };

      await sdk.userInfo(userId, userInfo);

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/user', {
        user: { name: userId, userInfo },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('pageView', () => {
    it('should make a POST request with page view information', async () => {
      await sdk.pageView('/home');

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/page', {
        page: '/home',
        user: { name: mockUser },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('trackConversion', () => {
    it('should make a POST request with conversion information', async () => {
      await sdk.trackConversion('purchase', 99.99, { product: 'Premium Plan' });

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/conversion', {
        tag: 'purchase',
        amount: 99.99,
        event: { product: 'Premium Plan' },
        user: { name: mockUser },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('buttonClick', () => {
    it('should make a POST request with button click information', async () => {
      await sdk.buttonClick('signup-button');

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/click', {
        button: 'signup-button',
        user: { name: mockUser },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('sendWalletInfo', () => {
    it('should send wallet info with new options object', async () => {
      await sdk.sendWalletInfo('0x1234', { provider: 'MetaMask', connectorType: 'injected' });

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/wallet', {
        walletAddress: '0x1234',
        provider: 'MetaMask',
        providerRdns: null,
        connectorType: 'injected',
        user: { name: mockUser },
        lid: mockLid,
        session: mockSession,
      });
    });

    it('should send wallet info with legacy (chainId, walletName) signature', async () => {
      await sdk.sendWalletInfo('0x1234', 1, 'Metamask');

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/wallet', {
        walletAddress: '0x1234',
        provider: 'Metamask',
        providerRdns: null,
        connectorType: null,
        chainId: 1,
        walletName: 'Metamask',
        user: { name: mockUser },
        lid: mockLid,
        session: mockSession,
      });
    });

    it('should skip non-numeric chainId in legacy mode', async () => {
      await sdk.sendWalletInfo('0x1234', 'solana', 'Phantom');

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/wallet', {
        walletAddress: '0x1234',
        provider: 'Phantom',
        providerRdns: null,
        connectorType: null,
        walletName: 'Phantom',
        user: { name: mockUser },
        lid: mockLid,
        session: mockSession,
      });
    });

    it('should deduplicate wallet addresses within a session', async () => {
      await sdk.sendWalletInfo('0xabc', { provider: 'MetaMask' });
      await sdk.sendWalletInfo('0xabc', { provider: 'MetaMask' });

      // Should only have been called once for /api/sdk/wallet
      const walletCalls = httpClientPostSpy.mock.calls.filter((call: any[]) => call[0] === '/api/sdk/wallet');
      expect(walletCalls).toHaveLength(1);
    });

    it('should allow retry after POST failure', async () => {
      httpClientPostSpy.mockRejectedValueOnce(new Error('Network error'));

      // First attempt — fails
      await expect(sdk.sendWalletInfo('0xfail', { provider: 'MetaMask' })).rejects.toThrow('Network error');

      // Reset mock to succeed
      httpClientPostSpy.mockResolvedValueOnce({ success: true });

      // Second attempt — should NOT be blocked by dedup since the first failed
      await sdk.sendWalletInfo('0xfail', { provider: 'MetaMask' });

      const walletCalls = httpClientPostSpy.mock.calls.filter((call: any[]) => call[0] === '/api/sdk/wallet');
      expect(walletCalls).toHaveLength(2);
    });

    it('should allow different addresses', async () => {
      await sdk.sendWalletInfo('0xabc', { provider: 'MetaMask' });
      await sdk.sendWalletInfo('0xdef', { provider: 'MetaMask' });

      const walletCalls = httpClientPostSpy.mock.calls.filter((call: any[]) => call[0] === '/api/sdk/wallet');
      expect(walletCalls).toHaveLength(2);
    });

    it('should skip empty or non-string addresses', async () => {
      await sdk.sendWalletInfo('', { provider: 'MetaMask' });
      await sdk.sendWalletInfo(null as any);
      await sdk.sendWalletInfo(undefined as any);

      const walletCalls = httpClientPostSpy.mock.calls.filter((call: any[]) => call[0] === '/api/sdk/wallet');
      expect(walletCalls).toHaveLength(0);
    });

    it('should send with null provider/connectorType/providerRdns when not provided', async () => {
      await sdk.sendWalletInfo('0x1234');

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/wallet', {
        walletAddress: '0x1234',
        provider: null,
        providerRdns: null,
        connectorType: null,
        user: { name: mockUser },
        lid: mockLid,
        session: mockSession,
      });
    });

    it('should include optional chainId when provided', async () => {
      await sdk.sendWalletInfo('0x1234', { provider: 'MetaMask', chainId: 137 });

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/wallet', {
        walletAddress: '0x1234',
        provider: 'MetaMask',
        providerRdns: null,
        connectorType: null,
        chainId: 137,
        user: { name: mockUser },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('checkMetaMaskConnection', () => {
    it('should return false when ethereum is not available', () => {
      expect(sdk.checkMetaMaskConnection()).toBeFalsy();
    });

    it('should return false when ethereum is available but not connected', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isConnected: () => false, selectedAddress: null },
        writable: true,
      });
      expect(sdk.checkMetaMaskConnection()).toBeFalsy();
    });

    it('should return true when ethereum is connected and an address is selected', () => {
      Object.defineProperty(window, 'ethereum', {
        value: { isConnected: () => true, selectedAddress: '0x1234' },
        writable: true,
      });
      expect(sdk.checkMetaMaskConnection()).toBeTruthy();
    });
  });

  describe('destroy', () => {
    it('should clear sentWallets set allowing re-sending', async () => {
      await sdk.sendWalletInfo('0xabc', { provider: 'MetaMask' });
      sdk.destroy();

      // Re-create sdk to get fresh state after destroy
      sdk = new LuciaSDK({ apiKey: 'test-key' });
      httpClientPostSpy = jest.spyOn(sdk.httpClient, 'post').mockResolvedValue({ success: true });

      await sdk.sendWalletInfo('0xabc', { provider: 'MetaMask' });

      const walletCalls = httpClientPostSpy.mock.calls.filter((call: any[]) => call[0] === '/api/sdk/wallet');
      expect(walletCalls).toHaveLength(1);
    });
  });
});
