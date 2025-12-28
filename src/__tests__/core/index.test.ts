import LuciaSDK from '../../core';
import * as dataUtils from '../../features/fingerprinting';
import * as sessionUtils from '../../infrastructure/session';

describe('LuciaSDK', () => {
  let sdk: LuciaSDK;
  let httpClientPostSpy: jest.SpyInstance;

  // Common mock implementations with proper types
  const mockBrowserData = {
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
      navPer: null,
      renderedPer: null,
      geoPer: null,
    },
    storage: {
      localStorage: true,
      indexedDB: true,
      openDB: false,
    },
  };

  const mockWalletData = {
    walletAddress: '0xmock123',
    solanaAddress: 'mock456',
    providerInfo: { chainId: '0x1', isMetaMask: true },
    walletName: 'MockWallet',
    solWalletName: 'MockSolWallet',
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
    jest.spyOn(dataUtils, 'getWalletData').mockResolvedValue(mockWalletData);
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

    // Mock window.ethereum for MetaMask tests
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('init', () => {
    it('should make a POST request to initialize the SDK with no hash (first time)', async () => {
      const serverSession = {
        hash: '99442d0d97d565dde60f2d3b196309622b55a3c5220bd89ed37eb1ee6bdeca4d',
        id: '7CC64140-7F41-4F66-B31C-9219FCBE20C1',
      };

      // Mock the response to include session data
      httpClientPostSpy.mockResolvedValueOnce({ lid: 'new-lid', session: serverSession });

      await sdk.init();

      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/init',
        {
          user: {
            name: mockUser,
          },
          data: mockBrowserData,
          walletData: mockWalletData,
          session: { id: mockSession.id }, // No hash on first call
          redirectHash: null,
          utm: mockUtm,
        },
        false,
      );
    });

    it('should include hash in POST request if session has hash from backend', async () => {
      // Mock session with hash from backend
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
          user: {
            name: mockUser,
          },
          data: mockBrowserData,
          walletData: mockWalletData,
          session: { id: mockSessionWithHash.id, hash: mockSessionWithHash.hash }, // Hash included on subsequent calls
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

      // Mock the response to include session data
      httpClientPostSpy.mockResolvedValueOnce({ lid: 'new-lid', session: serverSession });

      // Spy on updateSessionFromServer
      const updateSessionSpy = jest.spyOn(sessionUtils, 'updateSessionFromServer');

      await sdk.init();

      // Verify updateSessionFromServer was called with server session
      expect(updateSessionSpy).toHaveBeenCalledWith(serverSession);
    });

    it('should create a new session if none exists', async () => {
      // Mock getSessionData to return null for this test
      jest.spyOn(sessionUtils, 'getSessionData').mockReturnValueOnce(null);

      await sdk.init();

      // Verify storeSessionID was called
      expect(sessionUtils.storeSessionID).toHaveBeenCalled();

      // Verify the POST request was made with the new session (no hash)
      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/init',
        {
          user: {
            name: mockUser,
          },
          data: mockBrowserData,
          walletData: mockWalletData,
          session: { id: mockSession.id }, // No hash for new sessions
          redirectHash: null,
          utm: mockUtm,
        },
        false,
      );
    });

    it('should handle init response without session data gracefully', async () => {
      // Mock response without session field
      httpClientPostSpy.mockResolvedValueOnce({ lid: 'new-lid' });

      const updateSessionSpy = jest.spyOn(sessionUtils, 'updateSessionFromServer');

      await sdk.init();

      // Verify updateSessionFromServer was not called when session is missing
      expect(updateSessionSpy).not.toHaveBeenCalled();

      // But lid should still be stored
      expect(window.localStorage.setItem).toHaveBeenCalledWith('lid', 'new-lid');
    });
  });

  describe('userInfo', () => {
    it('should make a POST request with user information', async () => {
      const userId = 'user@example.com';
      const userInfo = { name: 'Test User', age: 30 };

      await sdk.userInfo(userId, userInfo);

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/user', {
        user: {
          name: userId,
          userInfo,
        },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('pageView', () => {
    it('should make a POST request with page view information', async () => {
      const page = '/home';

      await sdk.pageView(page);

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/page', {
        page,
        user: {
          name: mockUser,
        },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('trackConversion', () => {
    it('should make a POST request with conversion information', async () => {
      const eventTag = 'purchase';
      const amount = 99.99;
      const eventDetails = { product: 'Premium Plan' };

      await sdk.trackConversion(eventTag, amount, eventDetails);

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/conversion', {
        tag: eventTag,
        amount,
        event: eventDetails,
        user: {
          name: mockUser,
        },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('buttonClick', () => {
    it('should make a POST request with button click information', async () => {
      const button = 'signup-button';

      await sdk.buttonClick(button);

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/click', {
        button,
        user: {
          name: mockUser,
        },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('sendWalletInfo', () => {
    it('should make a POST request with wallet information', async () => {
      const walletAddress = '0x1234567890abcdef';
      const chainId = 1;
      const walletName = 'Metamask';

      await sdk.sendWalletInfo(walletAddress, chainId, walletName);

      expect(httpClientPostSpy).toHaveBeenCalledWith('/api/sdk/wallet', {
        walletAddress,
        chainId,
        walletName,
        user: {
          name: mockUser,
        },
        lid: mockLid,
        session: mockSession,
      });
    });
  });

  describe('checkMetaMaskConnection', () => {
    it('should return false when ethereum is not available', () => {
      // ethereum is undefined by default in beforeEach
      expect(sdk.checkMetaMaskConnection()).toBeFalsy();
    });

    it('should return false when ethereum is available but not connected', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isConnected: () => false,
          selectedAddress: null,
        },
        writable: true,
      });

      expect(sdk.checkMetaMaskConnection()).toBeFalsy();
    });

    it('should return false when ethereum is connected but no address is selected', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isConnected: () => true,
          selectedAddress: null,
        },
        writable: true,
      });

      expect(sdk.checkMetaMaskConnection()).toBeFalsy();
    });

    it('should return true when ethereum is connected and an address is selected', () => {
      Object.defineProperty(window, 'ethereum', {
        value: {
          isConnected: () => true,
          selectedAddress: '0x1234567890abcdef',
        },
        writable: true,
      });

      expect(sdk.checkMetaMaskConnection()).toBeTruthy();
    });
  });
});
