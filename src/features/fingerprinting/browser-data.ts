import { BrowserData } from '../../types';

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
 * Uses text rendering, gradients, blending, and curves to maximise
 * per-device variance in the resulting pixel data, then hashes the
 * full canvas image with SHA-256.
 *
 * @returns {Promise<string | undefined>} A SHA-256 hexadecimal hash string representing the canvas fingerprint,
 *                              or undefined if canvas is not supported or operation fails
 */
export async function getCanvasFingerprint(): Promise<string | undefined> {
  try {
    const canvas = document.createElement('canvas');
    const width = 280;
    const height = 60;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d', {
      willReadFrequently: true,
    } as CanvasRenderingContext2DSettings) as CanvasRenderingContext2D | null;
    if (!ctx) return undefined;

    // 1) Linear gradient — colour interpolation differs by GPU
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#ff0000');
    gradient.addColorStop(0.5, '#00ff00');
    gradient.addColorStop(1, '#0000ff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2) Text with common font — sub-pixel rendering & hinting vary by OS/GPU
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = 'rgba(100, 200, 50, 0.8)';
    ctx.fillText('Cwm fjord bank glyphs vext quiz!', 2, 20);

    // 3) Emoji — rendered by OS-specific emoji font (Apple vs Google vs MS)
    ctx.font = '18px serif';
    ctx.fillText('\u{1F3F4}\u{200D}\u{2620}\u{FE0F}\u{1F355}\u{1F3B5}', 2, 45);

    // 4) Composited, anti-aliased circle — blending amplifies GPU differences
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = 'rgba(255, 100, 0, 0.6)';
    ctx.beginPath();
    ctx.arc(200, 30, 25, 0, Math.PI * 2);
    ctx.fill();

    // 5) Thin bezier stroke — sub-pixel anti-aliasing varies across renderers
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(50, 50, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, 5);
    ctx.bezierCurveTo(130, 55, 170, 5, 200, 55);
    ctx.stroke();

    // Hash the full image (captures every rendering difference)
    const dataUrl = canvas.toDataURL('image/png');
    return sha256(dataUrl);
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
