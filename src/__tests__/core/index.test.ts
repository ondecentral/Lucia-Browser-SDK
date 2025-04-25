import LuciaSDK from '../../core';
import * as dataUtils from '../../utils/data';
import * as sessionUtils from '../../utils/session';

describe('LuciaSDK', () => {
  let sdk: LuciaSDK;
  let httpClientPostSpy: jest.SpyInstance;

  // Common mock implementations with proper types
  const mockUdata = {
    userAgent: 'test-agent',
    screen: { width: 1920, height: 1080 },
    // Add other properties expected by the udata function
    plugins: [],
    language: 'en-US',
    timeZone: -4,
  };
  const mockUser = 'test-user';
  const mockSession = {
    id: 'client123',
    hash: 'session-hash-123',
    serverSessionId: 'server456' as string | null,
    timestamp: Date.now(),
  };
  const mockLid = 'test-lid';
  const mockUtm = { source: 'google', medium: 'cpc' };

  beforeEach(() => {
    // Setup spies on the utility functions instead of full mocks
    jest.spyOn(dataUtils, 'getUtmParams').mockReturnValue(mockUtm);
    // Using type assertion to bypass TypeScript's type checking for the mock
    jest.spyOn(dataUtils, 'udata').mockImplementation(() => Promise.resolve(mockUdata) as Promise<any>);
    jest.spyOn(sessionUtils, 'getLidData').mockReturnValue(mockLid);
    jest.spyOn(sessionUtils, 'getSessionData').mockReturnValue(mockSession);
    jest.spyOn(sessionUtils, 'storeSessionID').mockImplementation(() => Promise.resolve(mockSession) as Promise<any>);
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
    it('should make a POST request to initialize the SDK', async () => {
      await sdk.init();

      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/init',
        {
          user: {
            name: mockUser,
            data: mockUdata,
          },
          session: mockSession,
          utm: mockUtm,
          sdkVersion: '0.0.0-unknown.0',
        },
        false,
      );
    });

    it('should store lid in localStorage if response data is received', async () => {
      await sdk.init();

      expect(window.localStorage.setItem).toHaveBeenCalledWith('lid', 'new-lid');
    });

    it('should create a new session if none exists', async () => {
      // Mock getSessionData to return null for this test
      jest.spyOn(sessionUtils, 'getSessionData').mockReturnValueOnce(null);

      await sdk.init();

      // Verify storeSessionID was called
      expect(sessionUtils.storeSessionID).toHaveBeenCalled();

      // Verify the POST request was made with the new session
      expect(httpClientPostSpy).toHaveBeenCalledWith(
        '/api/sdk/init',
        {
          user: {
            name: mockUser,
            data: mockUdata,
          },
          session: mockSession, // This is our mocked return value from storeSessionID
          utm: mockUtm,
          sdkVersion: '0.0.0-unknown.0',
        },
        false,
      );
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
