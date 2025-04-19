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
} from '../../utils/data';
import * as evmUtils from '../../utils/evm';
import * as solanaUtils from '../../utils/solana';

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

      const data = await udata();
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

      const data = await udata();

      expect(data).toHaveProperty('data');
    });

    it('handles null providerInfo but valid wallet addresses', async () => {
      jest.spyOn(evmUtils, 'getConnectedWalletAddress').mockResolvedValue('0x123');
      jest.spyOn(evmUtils, 'getWalletName').mockResolvedValue('MetaMask');
      jest.spyOn(evmUtils, 'getExtendedProviderInfo').mockResolvedValue(null);
      jest.spyOn(solanaUtils, 'getConnectedSolanaWallet').mockResolvedValue('abc123');
      jest.spyOn(solanaUtils, 'getSolanaWalletName').mockResolvedValue('Phantom');

      const data = await udata();
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
      const data = await udata();
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
      const data = await udata();
      expect(data.redirectHash).toBeNull();
    });

    it('returns screen properties with mocked contrast and gamut', async () => {
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
        const data = await udata();
        expect(data.data.screen.contrastPreference).toBe('More');
        expect(data.data.screen.colorGamut).toContain('p3');
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
      const data = await udata();
      expect(data.data.applePayAvailable).toBe(true);
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
