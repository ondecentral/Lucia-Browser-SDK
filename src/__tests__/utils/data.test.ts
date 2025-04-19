import { udata, getUtmParams } from '../../utils/data';

describe('Data Utilities', () => {
  let originalWindow: typeof window;

  beforeEach(() => {
    // Store original window and navigator
    originalWindow = { ...window };

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });

    // Mock Date for consistent timestamps
    jest.spyOn(Date, 'now').mockImplementation(() => 1626847200000); // 2021-07-21

    // Mock location for UTM params
    Object.defineProperty(window, 'location', {
      value: {
        href: 'https://example.com/?utm_source=test&utm_medium=email&utm_campaign=welcome',
        search: '?utm_source=test&utm_medium=email&utm_campaign=welcome',
      },
      writable: true,
    });
  });

  afterEach(() => {
    // eslint-disable-next-line no-global-assign
    window = originalWindow;
    jest.restoreAllMocks();
  });

  describe('udata', () => {
    it('should collect browser information', async () => {
      const mockUserAgent = 'Mozilla/5.0 Test Browser';
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgent,
        writable: true,
      });

      const data = await udata();
      // Check for data structure based on actual implementation
      expect(data).toHaveProperty('redirectHash');
      expect(data).toHaveProperty('data');
      expect(data.data).toHaveProperty('isMetaMaskInstalled');
    });

    it('should collect screen information when available', async () => {
      Object.defineProperty(window, 'screen', {
        value: {
          width: 1920,
          height: 1080,
          colorDepth: 24,
          availHeight: 1040,
        },
        writable: true,
      });

      const data = await udata();
      expect(data.data.screenWidth).toBe(1920);
      expect(data.data.screenHeight).toBe(1080);
      expect(data.data.colorDepth).toBe(24);
      expect(data.data.availHeight).toBe(1040);
    });

    it('should handle errors when browser features are missing', async () => {
      const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();

      // Instead of throwing at window.screen level, prepare a mock that throws for specific properties
      Object.defineProperty(window, 'screen', {
        value: {
          get width() {
            throw new Error('Screen width not available');
          },
          get height() {
            throw new Error('Screen height not available');
          },
          get colorDepth() {
            throw new Error('Screen colorDepth not available');
          },
          availHeight: undefined,
          availWidth: undefined,
          orientation: {
            type: undefined,
            angle: undefined,
          },
        },
        configurable: true,
        writable: true,
      });

      const data = await udata();

      // Check that error was logged - at least one of these should be called
      expect(mockConsoleLog).toHaveBeenCalled();
      expect(data).toHaveProperty('data');
    });
  });

  describe('getUtmParams', () => {
    it('should extract UTM parameters from URL', () => {
      const utmParams = getUtmParams();

      expect(utmParams).toEqual({
        utm_source: 'test',
        utm_medium: 'email',
        utm_campaign: 'welcome',
      });
    });

    it('should return empty object when no UTM parameters are present', () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com/',
          search: '',
        },
        writable: true,
      });

      const utmParams = getUtmParams();
      expect(utmParams).toEqual({});
    });
  });
});
