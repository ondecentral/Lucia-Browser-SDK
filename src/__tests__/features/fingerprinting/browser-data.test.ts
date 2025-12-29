import {
  getUtmParams,
  filterObject,
  safeAccess,
  getApplePayAvailable,
  getContrastPreference,
  getColorGamut,
  getCanvasFingerprint,
  isTouchEnabled,
  getBrowserData,
  getWalletData,
  clearBrowserDataCache,
} from '../../../features/fingerprinting';
import * as dataModule from '../../../features/fingerprinting/browser-data';
import { ProviderInfo } from '../../../features/web3';
import * as evmUtils from '../../../features/web3/evm';
import * as solanaUtils from '../../../features/web3/solana';

// Define interfaces for type safety in tests
interface BrowserData {
  device: any;
  screen: any;
  browser: any;
  permissions: any;
  storage: any;
}

interface WalletData {
  walletAddress: string | null;
  solanaAddress: string | null;
  providerInfo: ProviderInfo | null;
  walletName: string | null;
  solWalletName: string | null;
}

declare global {
  interface Window {
    ApplePaySession?: any;
    openDatabase?: any;
  }
}

describe('Data Utilities', () => {
  let originalWindow: typeof window;

  beforeEach(() => {
    // Store original window and navigator
    originalWindow = { ...window };

    // Clear cached browser data between tests
    clearBrowserDataCache();

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

    // Mock location for UTM params using history API (works with jsdom)
    setTestUrl('https://example.com/?utm_source=test&utm_medium=email&utm_campaign=welcome');
  });

  afterEach(() => {
    window = originalWindow;
    jest.restoreAllMocks();
  });

  describe('getBrowserData', () => {
    it('should collect static browser information', async () => {
      const mockUserAgent = 'Mozilla/5.0 Test Browser';
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgent,
        writable: true,
      });

      const data = (await getBrowserData()) as BrowserData;

      // Check the structure
      expect(data).toHaveProperty('device');
      expect(data).toHaveProperty('screen');
      expect(data).toHaveProperty('browser');
      expect(data).toHaveProperty('permissions');
      expect(data).toHaveProperty('storage');
    });

    it('should cache the result after the first call', async () => {
      // First call
      const firstResult = await getBrowserData();

      // Modify a value that would affect the result if not cached
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR', // Changed from default
        writable: true,
      });

      // Second call should return the cached result
      const secondResult = await getBrowserData();

      expect(secondResult).toBe(firstResult); // Should be the same object reference
    });

    it('should handle errors when browser features are missing', async () => {
      // Prepare a mock that throws for specific properties
      Object.defineProperty(window, 'screen', {
        value: {
          get width() {
            throw new Error('Screen width not available');
          },
          get height() {
            throw new Error('Screen height not available');
          },
          colorDepth: 24,
          availHeight: 1040,
          availWidth: 1900,
          orientation: {
            type: 'landscape-primary',
            angle: 0,
          },
        },
        configurable: true,
        writable: true,
      });

      const data = (await getBrowserData()) as BrowserData;

      // Even with errors, we should get a result with undefined for problematic properties
      expect(data).toHaveProperty('screen');
      expect(data.screen.width).toBeUndefined();
      expect(data.screen.height).toBeUndefined();
      expect(data.screen.colorDepth).toBe(24);
    });

    it('should collect device information correctly', async () => {
      // Mock hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 8,
        writable: true,
      });

      // Mock deviceMemory
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 4,
        writable: true,
      });

      // Mock devicePixelRatio
      Object.defineProperty(window, 'devicePixelRatio', {
        value: 2,
        writable: true,
      });

      // Mock cpuClass
      Object.defineProperty(navigator, 'cpuClass', {
        value: 'x86',
        writable: true,
      });

      // Mock touch capability
      jest.spyOn(document, 'createEvent').mockImplementation(() => ({}) as Event);

      const data = (await getBrowserData()) as BrowserData;

      expect(data.device.cores).toBe(8);
      expect(data.device.memory).toBe(4);
      expect(data.device.cpuClass).toBe('x86');
      expect(data.device.touch).toBe(true);
      expect(data.device.devicePixelRatio).toBe(2);
    });

    it('should collect screen information correctly', async () => {
      Object.defineProperty(window, 'screen', {
        value: {
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
        writable: true,
      });

      const data = (await getBrowserData()) as BrowserData;

      expect(data.screen.width).toBe(1920);
      expect(data.screen.height).toBe(1080);
      expect(data.screen.colorDepth).toBe(24);
      expect(data.screen.availHeight).toBe(1040);
      expect(data.screen.availWidth).toBe(1900);
      expect(data.screen.orientation.type).toBe('landscape-primary');
      expect(data.screen.orientation.angle).toBe(0);
    });

    it('should collect different screen orientations correctly', async () => {
      const orientationScenarios = [
        { type: 'portrait-primary', angle: 0 },
        { type: 'portrait-secondary', angle: 180 },
        { type: 'landscape-primary', angle: 90 },
        { type: 'landscape-secondary', angle: 270 },
      ];

      // Test each orientation sequentially (cache must be cleared between each)
      for (const orientation of orientationScenarios) {
        // Clear cached data between iterations
        clearBrowserDataCache();

        Object.defineProperty(window, 'screen', {
          value: {
            width: 1920,
            height: 1080,
            colorDepth: 24,
            availHeight: 1040,
            availWidth: 1900,
            orientation,
          },
          writable: true,
        });

        const data = (await getBrowserData()) as BrowserData;

        expect(data.screen.orientation.type).toBe(orientation.type);
        expect(data.screen.orientation.angle).toBe(orientation.angle);
      }
    });

    it('should collect browser language and timezone correctly', async () => {
      Object.defineProperty(navigator, 'language', {
        value: 'en-US',
        writable: true,
      });

      jest.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-240); // -4 hours

      const data = (await getBrowserData()) as BrowserData;

      expect(data.browser.language).toBe('en-US');
      expect(data.browser.timezone).toBe(4); // Negative of -240 minutes / 60
    });

    it('should collect browser plugins information', async () => {
      const mockPlugins = [{ name: 'PDF Viewer' }, { name: 'Chrome PDF Viewer' }, { name: 'Chrome Web Store' }];

      Object.defineProperty(navigator, 'plugins', {
        value: mockPlugins,
        writable: true,
      });

      const data = (await getBrowserData()) as BrowserData;

      expect(data.browser.pluginsLength).toBe(3);
      expect(data.browser.pluginNames).toEqual(['PDF Viewer', 'Chrome PDF Viewer', 'Chrome Web Store']);
    });

    it('should collect browser feature information with mocked contrast and gamut', async () => {
      // Mock both contrast and gamut detection
      const originalMatchMedia = window.matchMedia;
      const mockMatchMedia = (query: string) => {
        const matches =
          query.includes('prefers-contrast: high') || query === '(color-gamut: p3)' || query === '(color-gamut: srgb)';
        return {
          matches,
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        } as MediaQueryList;
      };

      // Directly replace window.matchMedia
      window.matchMedia = mockMatchMedia;

      // Mock ApplePay
      window.ApplePaySession = { canMakePayments: jest.fn(() => true) };

      // Create mock ImageData with realistic RGBA data
      const mockImageData = {
        data: new Uint8ClampedArray(200 * 120 * 4).fill(255), // width * height * 4 (RGBA)
        width: 200,
        height: 120,
      };

      const mockContext = {
        fillStyle: '',
        beginPath: jest.fn(),
        rect: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        closePath: jest.fn(),
        arc: jest.fn(),
        textBaseline: '',
        font: '',
        rotate: jest.fn(),
        fillText: jest.fn(),
        shadowBlur: 0,
        shadowColor: '',
        fillRect: jest.fn(),
        getImageData: jest.fn().mockReturnValue(mockImageData),
      };

      const mockCanvas = {
        id: '',
        width: 0,
        height: 0,
        style: {},
        getContext: jest.fn().mockReturnValue(mockContext),
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,fakehash'),
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as unknown as HTMLCanvasElement);

      try {
        const data = (await getBrowserData()) as BrowserData;

        // Check results
        expect(data.browser.contrastPreference).toBe('More');
        expect(data.browser.colorGamut).toContain('p3');
        expect(data.browser.colorGamut).toContain('srgb');
        expect(data.browser.applePayAvailable).toBe(true);
        // SHA-256 produces a 64-character hex string
        expect(data.browser.uniqueHash).toMatch(/^[0-9a-f]{64}$/);
      } finally {
        // Restore originals
        window.matchMedia = originalMatchMedia;
        delete window.ApplePaySession;
      }
    });

    it('should handle different permission states', async () => {
      const scenarios = [
        { navPer: '2.0', renderedPer: 'Mock Renderer', geoPer: { state: 'granted' } },
        { navPer: undefined, renderedPer: undefined, geoPer: undefined },
        { navPer: '1.0', renderedPer: 'Other Renderer', geoPer: { state: 'denied' } },
      ];

      // Test each permission state sequentially (cache must be cleared between each)

      for (const perms of scenarios) {
        // Clear cached data between iterations
        clearBrowserDataCache();

        // If permissions property already exists and is not configurable, skip redefining
        // (JSDOM sometimes makes it non-configurable)
        try {
          Object.defineProperty(navigator, 'permissions', {
            value: {
              webglVersion: perms.navPer,
              RENDERER: perms.renderedPer,
              geolocation: perms.geoPer,
            },
            configurable: true,
            writable: true,
          });
        } catch (_e) {
          // fallback: assign directly if defineProperty fails
          (navigator as any).permissions = {
            webglVersion: perms.navPer,
            RENDERER: perms.renderedPer,
            geolocation: perms.geoPer,
          };
        }

        const data = (await getBrowserData()) as BrowserData;
        expect(data.permissions.navPer).toBe(perms.navPer);
        expect(data.permissions.renderedPer).toBe(perms.renderedPer);
        expect(data.permissions.geoPer).toBe(perms.geoPer);
      }
    });

    it('should collect storage availability information', async () => {
      // Mock indexedDB
      Object.defineProperty(window, 'indexedDB', {
        value: {},
        writable: true,
      });

      // Mock openDatabase
      window.openDatabase = jest.fn();

      const data = (await getBrowserData()) as BrowserData;

      expect(data.storage.localStorage).toBeDefined();
      expect(data.storage.indexedDB).toBeDefined();
      expect(data.storage.openDB).toBeDefined();
    });

    it('should handle missing storage APIs gracefully', async () => {
      // Remove indexedDB
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        writable: true,
      });

      // Mock localStorage to return undefined instead of throwing
      const originalLocalStorage = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        get: jest.fn(() => undefined),
        configurable: true,
      });

      try {
        const data = (await getBrowserData()) as BrowserData;

        expect(data.storage.localStorage).toBeFalsy();
        expect(data.storage.indexedDB).toBeFalsy();
      } finally {
        // Restore localStorage
        Object.defineProperty(window, 'localStorage', {
          value: originalLocalStorage,
          configurable: true,
          writable: true,
        });
      }
    });

    it('should handle missing or invalid TextDecoder', async () => {
      // Create a spy on safeAccess that returns undefined for TextDecoder
      const safeAccessSpy = jest.spyOn(dataModule, 'safeAccess');

      // Mock the TextDecoder-related access to return undefined
      safeAccessSpy.mockImplementation((fn: () => any) => {
        try {
          // Execute the original function but catch any TextDecoder-related call
          const callStr = fn.toString();
          if (callStr.includes('TextDecoder')) {
            return undefined;
          }
          return fn();
        } catch {
          return undefined;
        }
      });

      try {
        const data = (await getBrowserData()) as BrowserData;

        expect(data.browser.encoding).toBeUndefined();
      } finally {
        // Restore original safeAccess implementation
        safeAccessSpy.mockRestore();
      }
    });
  });

  describe('getWalletData', () => {
    beforeEach(() => {
      // Mock wallet-related functions
      jest.spyOn(evmUtils, 'getConnectedWalletAddress').mockResolvedValue('0x123');
      jest.spyOn(evmUtils, 'getWalletName').mockResolvedValue('MetaMask');
      jest.spyOn(evmUtils, 'getExtendedProviderInfo').mockResolvedValue({
        chainId: '0x1',
        name: 'Ethereum',
        isMetaMask: true,
        isCoinbaseWallet: false,
        isWalletConnect: false,
        isTrust: false,
        // Add other required properties from ProviderInfo
      } as ProviderInfo);
      jest.spyOn(solanaUtils, 'getConnectedSolanaWallet').mockResolvedValue('abc123');
      jest.spyOn(solanaUtils, 'getSolanaWalletName').mockResolvedValue('Phantom');
    });

    it('should collect wallet information correctly', async () => {
      const walletData = (await getWalletData()) as WalletData;

      expect(walletData).toHaveProperty('walletAddress', '0x123');
      expect(walletData).toHaveProperty('solanaAddress', 'abc123');
      expect(walletData).toHaveProperty('providerInfo');
      expect(walletData).toHaveProperty('walletName', 'MetaMask');
      expect(walletData).toHaveProperty('solWalletName', 'Phantom');
    });

    it('handles null provider info with valid addresses', async () => {
      jest.spyOn(evmUtils, 'getExtendedProviderInfo').mockResolvedValue(null);

      const walletData = (await getWalletData()) as WalletData;

      expect(walletData.walletAddress).toBe('0x123');
      expect(walletData.providerInfo).toBeNull();
      expect(walletData.walletName).toBe('MetaMask');
    });

    it('handles all wallet data returning null', async () => {
      jest.spyOn(evmUtils, 'getConnectedWalletAddress').mockResolvedValue(null);
      jest.spyOn(evmUtils, 'getWalletName').mockResolvedValue(null);
      jest.spyOn(evmUtils, 'getExtendedProviderInfo').mockResolvedValue(null);
      jest.spyOn(solanaUtils, 'getConnectedSolanaWallet').mockResolvedValue(null);
      jest.spyOn(solanaUtils, 'getSolanaWalletName').mockResolvedValue(null);

      const walletData = (await getWalletData()) as WalletData;

      expect(walletData.walletAddress).toBeNull();
      expect(walletData.solanaAddress).toBeNull();
      expect(walletData.providerInfo).toBeNull();
      expect(walletData.walletName).toBeNull();
      expect(walletData.solWalletName).toBeNull();
    });

    it('should filter the provider info object', async () => {
      jest.spyOn(evmUtils, 'getExtendedProviderInfo').mockResolvedValue({
        chainId: '0x1',
        name: 'Ethereum',
        isMetaMask: true,
        isCoinbaseWallet: false, // falsy value
        isWalletConnect: '', // falsy value
        isTrust: null, // falsy value
        networkVersion: '1',
        selectedAddress: '0x123',
      } as unknown as ProviderInfo);

      const walletData = (await getWalletData()) as WalletData;

      // Verify that only truthy values were kept
      expect(walletData.providerInfo).toEqual({
        chainId: '0x1',
        name: 'Ethereum',
        isMetaMask: true,
        networkVersion: '1',
        selectedAddress: '0x123',
      });
    });

    it('should handle provider info with empty object', async () => {
      jest.spyOn(evmUtils, 'getExtendedProviderInfo').mockResolvedValue({} as ProviderInfo);

      const walletData = (await getWalletData()) as WalletData;

      // Empty object should result in empty filtered object
      expect(walletData.providerInfo).toEqual({});
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
      setTestUrl('https://example.com/');

      const utmParams = getUtmParams();
      expect(utmParams).toEqual({});
    });

    it('should extract id-related and ref/source parameters', () => {
      setTestUrl('https://example.com/?affiliate_id=123&ref=partner&source=email&product_id=456');

      const utmParams = getUtmParams();
      expect(utmParams).toEqual({
        affiliate_id: '123',
        ref: 'partner',
        source: 'email',
        product_id: '456',
      });
    });

    it('should handle malformed URLs gracefully', () => {
      // Test with a URL that has unusual but valid path - jsdom handles this fine
      setTestUrl('https://example.com/path:with:colons');

      // This test verifies that the function doesn't throw
      // when dealing with unusual URLs
      expect(() => getUtmParams()).not.toThrow();
      expect(getUtmParams()).toEqual({});
    });
  });

  describe('filterObject', () => {
    it('filters out falsy values from an object', () => {
      const input = { a: 1, b: '', c: false, d: 0, e: 'hello', f: undefined, g: null };
      expect(filterObject(input)).toEqual({ a: 1, e: 'hello' });
    });

    it('returns empty object for all falsy', () => {
      expect(filterObject({ a: '', b: 0, c: false, d: undefined, e: null })).toEqual({});
    });

    it('returns empty object for empty input', () => {
      expect(filterObject({})).toEqual({});
    });

    it('does not filter nested object properties', () => {
      const input = {
        a: 1,
        b: { x: '', y: 'value' },
      };
      const result = filterObject(input);
      expect(result).toEqual({ a: 1, b: { x: '', y: 'value' } });
      // Note: nested falsy values like x: '' are NOT filtered
    });

    it.each([
      [{ a: 1, b: false }, { a: 1 }],
      [{ a: 0, b: null }, {}],
      [{ a: 'hello', b: '' }, { a: 'hello' }],
      [
        { a: [], b: {} },
        { a: [], b: {} },
      ], // empty arrays/objects are truthy
    ])('correctly filters %j to %j', (input, expected) => {
      expect(filterObject(input)).toEqual(expected);
    });
  });

  describe('safeAccess', () => {
    it('returns the value if no error is thrown', () => {
      expect(safeAccess(() => 42)).toBe(42);
    });

    it('returns undefined if an error is thrown', () => {
      expect(
        safeAccess(() => {
          throw new Error('fail');
        }),
      ).toBeUndefined();
    });

    it('returns fallback if an error is thrown and fallback is provided', () => {
      expect(
        safeAccess(() => {
          throw new Error('fail');
        }, 99),
      ).toBe(99);
    });

    it('returns null when function returns null', () => {
      expect(safeAccess(() => null)).toBeNull();
    });

    it('returns falsy values like 0 and empty string correctly', () => {
      expect(safeAccess(() => 0)).toBe(0);
      expect(safeAccess(() => '')).toBe('');
    });

    it('handles complex errors correctly', () => {
      const customError = new TypeError('Custom error');

      expect(
        safeAccess(() => {
          throw 'string error'; // Non-Error object throw
        }, 'fallback for string'),
      ).toBe('fallback for string');

      expect(
        safeAccess(() => {
          throw customError; // TypeError
        }, 'fallback for TypeError'),
      ).toBe('fallback for TypeError');

      expect(
        safeAccess(() => {
          throw null; // null throw
        }, 'fallback for null'),
      ).toBe('fallback for null');
    });
  });

  describe('getApplePayAvailable', () => {
    afterEach(() => {
      // Clean up
      delete window.ApplePaySession;
    });

    it('returns true if ApplePaySession.canMakePayments returns true', () => {
      window.ApplePaySession = { canMakePayments: jest.fn(() => true) };
      expect(getApplePayAvailable()).toBe(true);
    });

    it('returns false if ApplePaySession.canMakePayments is not a function', () => {
      window.ApplePaySession = { canMakePayments: undefined };
      expect(getApplePayAvailable()).toBe(false);
    });

    it('returns undefined if accessing ApplePaySession throws', () => {
      Object.defineProperty(window, 'ApplePaySession', {
        get() {
          throw new Error('fail');
        },
        configurable: true,
      });
      expect(getApplePayAvailable()).toBeUndefined();
    });
  });

  describe('getContrastPreference', () => {
    let originalMatchMedia: typeof window.matchMedia;
    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
    });
    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('returns "None" if prefers-contrast: no-preference', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({ matches: query.includes('no-preference') }));
      expect(getContrastPreference()).toBe('None');
    });

    it('returns "More" if prefers-contrast: high', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({ matches: query.includes('high') }));
      expect(getContrastPreference()).toBe('More');
    });

    it('returns "More" if prefers-contrast: more', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({ matches: query.includes('more') }));
      expect(getContrastPreference()).toBe('More');
    });

    it('returns "Less" if prefers-contrast: low', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({ matches: query.includes('low') }));
      expect(getContrastPreference()).toBe('Less');
    });

    it('returns "Less" if prefers-contrast: less', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({ matches: query.includes('less') }));
      expect(getContrastPreference()).toBe('Less');
    });

    it('returns "ForcedColors" if prefers-contrast: forced', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => ({ matches: query.includes('forced') }));
      expect(getContrastPreference()).toBe('ForcedColors');
    });

    it('returns undefined if no match', () => {
      window.matchMedia = jest.fn().mockImplementation(() => ({ matches: false }));
      expect(getContrastPreference()).toBeUndefined();
    });

    it('returns undefined when matchMedia is not available', () => {
      // Delete matchMedia
      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        configurable: true,
      });

      try {
        expect(getContrastPreference()).toBeUndefined();
      } finally {
        window.matchMedia = originalMatchMedia;
      }
    });
  });

  describe('getColorGamut', () => {
    let originalMatchMedia: typeof window.matchMedia;
    beforeEach(() => {
      originalMatchMedia = window.matchMedia;
    });
    afterEach(() => {
      window.matchMedia = originalMatchMedia;
    });

    it('returns all supported gamuts', () => {
      window.matchMedia = jest.fn().mockImplementation((query) => {
        if (query === '(color-gamut: p3)') return { matches: true };
        if (query === '(color-gamut: srgb)') return { matches: true };
        return { matches: false };
      });
      const result = getColorGamut();
      // Check that the result contains both values without enforcing order
      expect(result).toHaveLength(2);
      expect(result).toContain('p3');
      expect(result).toContain('srgb');
    });

    it('returns empty array if none supported', () => {
      window.matchMedia = jest.fn().mockImplementation(() => ({ matches: false }));
      expect(getColorGamut()).toEqual([]);
    });

    it('returns empty array when matchMedia is not available', () => {
      // Delete matchMedia
      const originalMatchMedia = window.matchMedia;
      Object.defineProperty(window, 'matchMedia', {
        value: undefined,
        configurable: true,
      });

      try {
        expect(getColorGamut()).toEqual([]);
      } finally {
        window.matchMedia = originalMatchMedia;
      }
    });
  });

  describe('getCanvasFingerprint', () => {
    it('returns undefined if getContext returns null', async () => {
      jest.spyOn(document, 'createElement').mockReturnValueOnce({ getContext: () => null } as any);
      expect(await getCanvasFingerprint()).toBeUndefined();
    });

    it('returns undefined if createElement throws', async () => {
      jest.spyOn(document, 'createElement').mockImplementationOnce(() => {
        throw new Error('fail');
      });
      expect(await getCanvasFingerprint()).toBeUndefined();
    });
  });

  describe('isTouchEnabled', () => {
    it('returns false if createEvent throws', () => {
      jest.spyOn(document, 'createEvent').mockImplementationOnce(() => {
        throw new Error('fail');
      });
      expect(isTouchEnabled()).toBe(false);
    });

    it('returns true if createEvent does not throw', () => {
      jest.spyOn(document, 'createEvent').mockImplementationOnce(() => ({}) as Event);
      expect(isTouchEnabled()).toBe(true);
    });
  });
});
