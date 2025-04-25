import CryptoJS from 'crypto-js';

import {
  udata,
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
} from '../../utils/data';
import * as evmUtils from '../../utils/evm';
import { ProviderInfo } from '../../utils/evm';
import * as solanaUtils from '../../utils/solana';

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

interface UdataResult {
  redirectHash: string | null;
  data: WalletData & BrowserData;
}

declare global {
  interface Window {
    ApplePaySession?: any;
  }
}

describe('Data Utilities', () => {
  let originalWindow: typeof window;

  beforeEach(() => {
    // Store original window and navigator
    originalWindow = { ...window };

    // Clear cached browser data between tests
    delete getBrowserData.cachedData;

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

  describe('getBrowserData', () => {
    it('should collect static browser information', () => {
      const mockUserAgent = 'Mozilla/5.0 Test Browser';
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgent,
        writable: true,
      });

      const data = getBrowserData() as BrowserData;

      // Check the structure
      expect(data).toHaveProperty('device');
      expect(data).toHaveProperty('screen');
      expect(data).toHaveProperty('browser');
      expect(data).toHaveProperty('permissions');
      expect(data).toHaveProperty('storage');
    });

    it('should cache the result after the first call', () => {
      // First call
      const firstResult = getBrowserData();

      // Modify a value that would affect the result if not cached
      Object.defineProperty(navigator, 'language', {
        value: 'fr-FR', // Changed from default
        writable: true,
      });

      // Second call should return the cached result
      const secondResult = getBrowserData();

      expect(secondResult).toBe(firstResult); // Should be the same object reference
    });

    it('should handle errors when browser features are missing', () => {
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

      const data = getBrowserData() as BrowserData;

      // Even with errors, we should get a result with undefined for problematic properties
      expect(data).toHaveProperty('screen');
      expect(data.screen.width).toBeUndefined();
      expect(data.screen.height).toBeUndefined();
      expect(data.screen.colorDepth).toBe(24);
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
  });

  describe('udata', () => {
    it('should combine static and dynamic data', async () => {
      const mockUserAgent = 'Mozilla/5.0 Test Browser';
      Object.defineProperty(navigator, 'userAgent', {
        value: mockUserAgent,
        writable: true,
      });

      // Mock wallet functions
      jest.spyOn(evmUtils, 'getConnectedWalletAddress').mockResolvedValue('0x123');
      jest.spyOn(evmUtils, 'getWalletName').mockResolvedValue('MetaMask');

      const data = (await udata()) as UdataResult;
      // Check for data structure based on actual implementation
      expect(data).toHaveProperty('redirectHash');
      expect(data).toHaveProperty('data');

      // Should include both static browser data and dynamic wallet data
      expect(data.data).toHaveProperty('walletAddress');
      expect(data.data).toHaveProperty('device');
      expect(data.data).toHaveProperty('screen');
      expect(data.data).toHaveProperty('browser');
    });

    it('should collect screen information when available', async () => {
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

      const data = (await udata()) as UdataResult;
      expect(data.data.screen.width).toBe(1920);
      expect(data.data.screen.height).toBe(1080);
      expect(data.data.screen.colorDepth).toBe(24);
      expect(data.data.screen.availHeight).toBe(1040);
      expect(data.data.screen.availWidth).toBe(1900);
      expect(data.data.screen.orientation.type).toBe('landscape-primary');
      expect(data.data.screen.orientation.angle).toBe(0);
    });

    it('should handle errors when browser features are missing', async () => {
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

      const data = (await udata()) as UdataResult;

      expect(data).toHaveProperty('data');
    });

    it('handles null providerInfo but valid wallet addresses', async () => {
      jest.spyOn(evmUtils, 'getConnectedWalletAddress').mockResolvedValue('0x123');
      jest.spyOn(evmUtils, 'getWalletName').mockResolvedValue('MetaMask');
      jest.spyOn(evmUtils, 'getExtendedProviderInfo').mockResolvedValue(null);
      jest.spyOn(solanaUtils, 'getConnectedSolanaWallet').mockResolvedValue('abc123');
      jest.spyOn(solanaUtils, 'getSolanaWalletName').mockResolvedValue('Phantom');

      const data = (await udata()) as UdataResult;
      expect(data.data.walletAddress).toBe('0x123');
      expect(data.data.providerInfo).toBeNull();
      expect(data.data.walletName).toBe('MetaMask');
      expect(data.data.solanaAddress).toBe('abc123');
      expect(data.data.solWalletName).toBe('Phantom');
    });

    it('handles all async calls returning null', async () => {
      jest.spyOn(evmUtils, 'getConnectedWalletAddress').mockResolvedValue(null);
      jest.spyOn(evmUtils, 'getWalletName').mockResolvedValue(null);
      jest.spyOn(evmUtils, 'getExtendedProviderInfo').mockResolvedValue(null);
      jest.spyOn(solanaUtils, 'getConnectedSolanaWallet').mockResolvedValue(null);
      jest.spyOn(solanaUtils, 'getSolanaWalletName').mockResolvedValue(null);
      const data = (await udata()) as UdataResult;
      expect(data.data.walletAddress).toBeNull();
      expect(data.data.solanaAddress).toBeNull();
      expect(data.data.providerInfo).toBeNull();
      expect(data.data.walletName).toBeNull();
      expect(data.data.solWalletName).toBeNull();
    });

    it('handles redirectHash being null when searchParams.get returns null', async () => {
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://example.com/',
          search: '',
        },
        writable: true,
      });
      const data = (await udata()) as UdataResult;
      expect(data.redirectHash).toBeNull();
    });

    it('returns browser properties with mocked contrast and gamut', async () => {
      // Mock both contrast and gamut detection
      const originalMatchMedia = window.matchMedia;
      const mockMatchMedia = (query: string) => {
        const matches = query.includes('prefers-contrast: high') || query === '(color-gamut: p3)';
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

      try {
        const data = (await udata()) as UdataResult;
        expect(data.data.browser.contrastPreference).toBe('More');
        expect(data.data.browser.colorGamut).toContain('p3');
      } finally {
        // Restore original
        window.matchMedia = originalMatchMedia;
      }
    });

    it('generates a fingerprint when canvas is supported', () => {
      // Create a minimal canvas mock with the necessary methods
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
      };

      const mockCanvas = {
        getContext: jest.fn().mockReturnValue(mockContext),
        toDataURL: jest.fn().mockReturnValue('data:image/png;base64,fakehash'),
      };

      jest.spyOn(document, 'createElement').mockReturnValueOnce(mockCanvas as unknown as HTMLCanvasElement);
      // Mock the entire SHA256 process
      const mockSHA256Result = { toString: jest.fn().mockReturnValue('testfingerprint') };
      jest.spyOn(CryptoJS, 'SHA256').mockReturnValue(mockSHA256Result as any);

      const fingerprint = getCanvasFingerprint();
      expect(fingerprint).toBeDefined();
      expect(typeof fingerprint).toBe('string');
    });

    it('includes applePayAvailable status', async () => {
      window.ApplePaySession = { canMakePayments: jest.fn(() => true) };
      const data = (await udata()) as UdataResult;
      expect(data.data.browser.applePayAvailable).toBe(true);
      delete window.ApplePaySession;
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
    it('returns undefined if getContext returns null', () => {
      jest.spyOn(document, 'createElement').mockReturnValueOnce({ getContext: () => null } as any);
      expect(getCanvasFingerprint()).toBeUndefined();
    });

    it('returns undefined if createElement throws', () => {
      jest.spyOn(document, 'createElement').mockImplementationOnce(() => {
        throw new Error('fail');
      });
      expect(getCanvasFingerprint()).toBeUndefined();
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
