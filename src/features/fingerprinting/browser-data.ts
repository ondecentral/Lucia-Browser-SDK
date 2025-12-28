import { BrowserData, WalletData } from '../../types';
import { getConnectedWalletAddress, getWalletName, getExtendedProviderInfo } from '../web3';
import { getConnectedSolanaWallet, getSolanaWalletName } from '../web3';

/**
 * Collects static browser and hardware data that's unlikely to change during a session.
 * This data can be cached for performance optimization.
 *
 * @returns {Promise<BrowserData>} Static browser and hardware data including device capabilities,
 *                  screen specifications, and browser features.
 */
export async function getBrowserData(): Promise<BrowserData> {
  // Use module-level cache for the result after first call
  if (browserDataCache) {
    return browserDataCache;
  }

  const device = {
    cores: safeAccess(() => navigator.hardwareConcurrency),
    memory: safeAccess(() => (navigator as Navigator & { deviceMemory?: number }).deviceMemory),
    cpuClass: safeAccess(() => (navigator as Navigator & { cpuClass?: string }).cpuClass),
    touch: isTouchEnabled(),
    devicePixelRatio: safeAccess(() => window.devicePixelRatio),
  };

  const screen = {
    width: safeAccess(() => window.screen.width),
    height: safeAccess(() => window.screen.height),
    colorDepth: safeAccess(() => window.screen.colorDepth),
    availHeight: safeAccess(() => window.screen.availHeight),
    availWidth: safeAccess(() => window.screen.availWidth),
    orientation: {
      type: safeAccess(() => window.screen.orientation.type),
      angle: safeAccess(() => window.screen.orientation.angle),
    },
  };

  const browser = {
    language: safeAccess(() => navigator.language),
    encoding: safeAccess(() => (TextDecoder as typeof TextDecoder & { encoding?: string }).encoding),
    timezone: safeAccess(() => -new Date().getTimezoneOffset() / 60),
    pluginsLength: safeAccess(() => navigator.plugins.length),
    pluginNames: safeAccess(() => Array.from(navigator.plugins, (p) => p.name)),
    applePayAvailable: getApplePayAvailable(),
    uniqueHash: await getCanvasFingerprint(),
    colorGamut: getColorGamut(),
    contrastPreference: getContrastPreference(),
  };
  type ExtendedPermissions = Permissions & {
    webglVersion?: PermissionStatus;
    RENDERER?: PermissionStatus;
    geolocation?: PermissionStatus;
  };
  const permissions = {
    navPer: safeAccess(() => (navigator.permissions as ExtendedPermissions).webglVersion),
    renderedPer: safeAccess(() => (navigator.permissions as ExtendedPermissions).RENDERER),
    geoPer: safeAccess(() => (navigator.permissions as ExtendedPermissions).geolocation),
  };

  const storage = {
    localStorage: safeAccess(() => !!window.localStorage),
    indexedDB: safeAccess(() => !!window.indexedDB),
    openDB: safeAccess(() => (window as Window & { openDatabase?: unknown }).openDatabase),
  };

  const staticData: BrowserData = {
    device,
    screen,
    browser,
    permissions,
    storage,
  };

  // Cache the result
  browserDataCache = staticData;
  return staticData;
}

/**
 * Clears the browser data cache (useful for testing)
 */
export function clearBrowserDataCache(): void {
  browserDataCache = null;
}

/**
 * Collects dynamic wallet information that may change during a session.
 * This data should be fetched each time it's needed for up-to-date values.
 *
 * @returns {Promise<WalletData>} Dynamic wallet data including addresses and provider information.
 */
export async function getWalletData(): Promise<WalletData> {
  const [solAddress, ethAddress, walletName, solWalletName, providerInfo] = await Promise.all([
    getConnectedSolanaWallet(),
    getConnectedWalletAddress(),
    getWalletName(),
    getSolanaWalletName(),
    getExtendedProviderInfo(),
  ]);

  return {
    walletAddress: ethAddress,
    solanaAddress: solAddress,
    providerInfo: providerInfo && filterObject(providerInfo),
    walletName,
    solWalletName,
  };
}

/**
 * Extracts tracking parameters from the current URL.
 * Captures UTM parameters, ID-related values, and referrer information.
 *
 * @returns {Record<string, string>} An object containing all tracking parameters
 *                                  from the current URL as key-value pairs.
 */
export function getUtmParams(): Record<string, string> {
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const utmObject: Record<string, string> = {};

  params.forEach((value, key) => {
    if (key.startsWith('utm_') || key.includes('id') || key === 'ref' || key === 'source') {
      utmObject[key] = value;
    }
  });

  return utmObject;
}

/**
 * Safely executes a function and handles any exceptions that may occur.
 * Provides type safety through function overloads.
 *
 * @template T - The return type of the function
 * @param {() => T} fn - The function to execute safely
 * @param {T} [fallback] - Optional fallback value to return if the function throws
 * @returns {T | undefined} The result of the function or fallback/undefined if it throws
 * @example
 * // Returns 42 or undefined if window.answer doesn't exist
 * const answer = safeAccess(() => window.answer);
 *
 * // Returns window.width or 800 if accessing window.width throws
 * const width = safeAccess(() => window.width, 800);
 */
export function safeAccess<T>(fn: () => T): T | undefined;
export function safeAccess<T>(fn: () => T, fallback: T): T;
export function safeAccess<T>(fn: () => T, fallback?: T) {
  try {
    return fn();
  } catch {
    return fallback;
  }
}

/**
 * Filters an object by removing all falsy values (undefined, null, false, 0, '', NaN)
 * from its properties.
 *
 * @template T - The type of the input object
 * @param {T} obj - The object to filter
 * @returns {Partial<T>} A new object containing only the properties with truthy values
 * @example
 * // Returns { name: 'John', age: 30 }
 * filterObject({ name: 'John', age: 30, address: '', active: false });
 */
export function filterObject<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  Object.keys(obj).forEach((key) => {
    const typedKey = key as keyof T;
    if (obj[typedKey]) {
      result[typedKey] = obj[typedKey];
    }
  });
  return result;
}

/**
 * Computes SHA-256 hash using the Web Crypto API.
 * Returns a 64-character hex string.
 *
 * @param str - The string to hash
 * @returns Promise resolving to a 64-char hex string
 */
async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Cache for browser data (module-level to avoid Function interface extension)
let browserDataCache: BrowserData | null = null;

/**
 * Generates a unique hash based on canvas rendering characteristics.
 * Creates a canvas with specific shapes and colors, then generates a SHA-256 hash
 * of the canvas data. This serves as a fingerprinting mechanism for the browser.
 *
 * @returns {Promise<string | undefined>} A SHA-256 hexadecimal hash string representing the canvas fingerprint,
 *                              or undefined if canvas is not supported or operation fails
 */
export async function getCanvasFingerprint(): Promise<string | undefined> {
  try {
    const canvas = document.createElement('canvas');
    // Ask for a 2D context we'll read frequently (safe to ignore if unsupported)
    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
    } as CanvasRenderingContext2DSettings) as CanvasRenderingContext2D | null;
    if (!ctx) return undefined;

    // Fixed canvas size in CSS pixels (no DPR scaling)
    const width = 200;
    const height = 120;
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    // 1) Opaque background to avoid alpha/premultiplication surprises
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // 2) Deterministic, integer-aligned, filled shapes (no strokes/shadows/text)
    ctx.fillStyle = '#ff00ff'; // magenta
    ctx.fillRect(10, 10, 100, 100); // fully covered interior pixels

    ctx.fillStyle = '#00ffff'; // cyan
    ctx.beginPath();
    ctx.arc(150, 50, 40, 0, Math.PI * 2, true);
    ctx.fill();

    // 3) Read raw pixels and sample only interior points (far from edges)
    const { data } = ctx.getImageData(0, 0, width, height);
    const pts: Array<[number, number]> = [
      [20, 20],
      [60, 60],
      [100, 100], // inside rectangle
      [150, 50],
      [150, 60],
      [140, 50], // inside circle
      [5, 5], // background
    ];
    const acc = pts
      .map(([x, y]) => {
        const i = (y * width + x) * 4;
        return `${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]};`;
      })
      .join('');

    // 4) Hash the sampled RGBA bytes using SHA-256
    return sha256(acc);
  } catch {
    return undefined;
  }
}

/**
 * Detects if the device supports touch events.
 * Used to determine if the user is on a touch-enabled device.
 *
 * @returns {boolean} True if touch events are supported, false otherwise
 */
export function isTouchEnabled(): boolean {
  try {
    return !!document.createEvent('TouchEvent');
  } catch {
    return false;
  }
}

/**
 * Detects if Apple Pay is available in the current browser.
 * Checks for the presence and functionality of the ApplePaySession API.
 *
 * @returns {boolean | undefined} True if Apple Pay is available, false if it's not,
 *                               or undefined if detection fails
 */
export function getApplePayAvailable(): boolean | undefined {
  try {
    // @ts-ignore
    if (typeof window.ApplePaySession?.canMakePayments !== 'function') {
      return false;
    }
    // @ts-ignore
    return window.ApplePaySession.canMakePayments();
  } catch {
    return undefined;
  }
}

/**
 * Detects the user's contrast preference setting from the browser.
 * Uses the matchMedia API to determine if the user has specified any
 * contrast preference in their system settings.
 *
 * @returns {string | undefined} The contrast preference ('None', 'More', 'Less', 'ForcedColors'),
 *                              or undefined if detection fails
 */
export function getContrastPreference(): string | undefined {
  try {
    const { matchMedia } = window;
    const doesMatch = (value: string) => matchMedia(`(prefers-contrast: ${value})`).matches;
    if (doesMatch('no-preference')) return 'None';
    if (doesMatch('high') || doesMatch('more')) return 'More';
    if (doesMatch('low') || doesMatch('less')) return 'Less';
    if (doesMatch('forced')) return 'ForcedColors';
    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * Detects the color gamuts supported by the user's device.
 * Uses the matchMedia API to test for support of various color gamut formats.
 *
 * @returns {string[]} An array of supported color gamut identifiers
 *                    (e.g., 'rec2020', 'p3', 'srgb', etc.)
 */
export function getColorGamut(): string[] {
  try {
    const gamuts = ['rec2020', 'p3', 'srgb', 'display-p3', 'adobe-rgb'];
    return gamuts.filter((g) => window.matchMedia(`(color-gamut: ${g})`).matches);
  } catch {
    return [];
  }
}
