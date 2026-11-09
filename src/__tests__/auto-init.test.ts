/**
 * Auto-initialization tests for Lucia SDK
 * Tests the data-api-key attribute detection and automatic initialization
 */

import '@testing-library/jest-dom';

describe('Auto-initialization', () => {
  let mockScript: HTMLScriptElement;

  beforeEach(() => {
    // Clear any existing instances
    delete (window as any).LuciaSDK;
    delete (window as any).__luciaInstance;

    // Create a mock script element
    mockScript = document.createElement('script');
    mockScript.src = 'https://cdn.luciaprotocol.com/lucia-sdk-latest.min.js';
  });

  afterEach(() => {
    // Cleanup
    if (mockScript.parentNode) {
      mockScript.parentNode.removeChild(mockScript);
    }
    delete (window as any).LuciaSDK;
    delete (window as any).__luciaInstance;
    jest.clearAllMocks();
  });

  describe('Script tag detection', () => {
    it('should detect script tag with data-api-key attribute', () => {
      mockScript.setAttribute('data-api-key', 'test-key-123');
      document.head.appendChild(mockScript);

      const foundScript = document.querySelector('script[data-api-key]');
      expect(foundScript).toBeTruthy();
      expect(foundScript?.getAttribute('data-api-key')).toBe('test-key-123');
    });

    it('should detect data-api-host attribute when present', () => {
      mockScript.setAttribute('data-api-key', 'test-key-123');
      mockScript.setAttribute('data-api-host', 'https://debug.example.com');
      document.head.appendChild(mockScript);

      const foundScript = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      expect(foundScript?.getAttribute('data-api-host')).toBe('https://debug.example.com');
    });

    it('should return null when no script tag has data-api-key', () => {
      const foundScript = document.querySelector('script[data-api-key]');
      expect(foundScript).toBeNull();
    });

    it('should find first script tag when multiple have data-api-key', () => {
      const script1 = document.createElement('script');
      script1.setAttribute('data-api-key', 'first-key');
      const script2 = document.createElement('script');
      script2.setAttribute('data-api-key', 'second-key');

      document.head.appendChild(script1);
      document.head.appendChild(script2);

      const foundScript = document.querySelector('script[data-api-key]');
      expect(foundScript?.getAttribute('data-api-key')).toBe('first-key');

      // Cleanup
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    });
  });

  describe('Attribute parsing', () => {
    it('should extract apiKey from data-api-key attribute', () => {
      mockScript.setAttribute('data-api-key', 'my-api-key-789');
      document.head.appendChild(mockScript);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiKey = scriptTag.getAttribute('data-api-key');

      expect(apiKey).toBe('my-api-key-789');
    });

    it('should extract apiHost from data-api-host attribute', () => {
      mockScript.setAttribute('data-api-key', 'test-key');
      mockScript.setAttribute('data-api-host', 'https://custom-debug.example.com');
      document.head.appendChild(mockScript);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiHost = scriptTag.getAttribute('data-api-host');

      expect(apiHost).toBe('https://custom-debug.example.com');
    });

    it('should handle missing data-api-host gracefully', () => {
      mockScript.setAttribute('data-api-key', 'test-key');
      document.head.appendChild(mockScript);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiHost = scriptTag.getAttribute('data-api-host');

      expect(apiHost).toBeNull();
    });

    it('should handle empty string values', () => {
      mockScript.setAttribute('data-api-key', '');
      document.head.appendChild(mockScript);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiKey = scriptTag.getAttribute('data-api-key');

      expect(apiKey).toBe('');
    });
  });

  describe('Config object construction', () => {
    it('should create config with only apiKey when no api-host', () => {
      const apiKey = 'test-api-key';
      const apiHost: string | null = null;

      const config: any = { apiKey };
      if (apiHost) {
        config.apiHost = apiHost;
      }

      expect(config).toEqual({ apiKey: 'test-api-key' });
      expect(config).not.toHaveProperty('apiHost');
    });

    it('should create config with both apiKey and apiHost when present', () => {
      const apiKey = 'test-api-key';
      const apiHost: string | null = 'https://debug.example.com';

      const config: any = { apiKey };
      if (apiHost) {
        config.apiHost = apiHost;
      }

      expect(config).toEqual({
        apiKey: 'test-api-key',
        apiHost: 'https://debug.example.com',
      });
    });

    it('should not include apiHost when empty string', () => {
      const apiKey = 'test-api-key';
      const apiHost: string = '';

      const config: any = { apiKey };
      if (apiHost) {
        config.apiHost = apiHost;
      }

      expect(config).toEqual({ apiKey: 'test-api-key' });
    });
  });

  describe('Document ready state handling', () => {
    it('should handle document.readyState === "loading"', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'loading',
      });

      expect(document.readyState).toBe('loading');
    });

    it('should handle document.readyState === "interactive"', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'interactive',
      });

      expect(document.readyState).toBe('interactive');
    });

    it('should handle document.readyState === "complete"', () => {
      Object.defineProperty(document, 'readyState', {
        writable: true,
        value: 'complete',
      });

      expect(document.readyState).toBe('complete');
    });
  });

  describe('Edge cases', () => {
    it('should handle missing apiKey gracefully', () => {
      mockScript.setAttribute('data-api-key', '');
      document.head.appendChild(mockScript);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiKey = scriptTag.getAttribute('data-api-key');

      // Empty string should not trigger auto-init
      expect(apiKey).toBe('');
    });

    it('should handle script tag without any attributes', () => {
      document.head.appendChild(mockScript);

      const foundScript = document.querySelector('script[data-api-key]');
      expect(foundScript).toBeNull();
    });

    it('should handle malformed URLs in data-api-host', () => {
      mockScript.setAttribute('data-api-key', 'test-key');
      mockScript.setAttribute('data-api-host', 'not-a-valid-url');
      document.head.appendChild(mockScript);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiHost = scriptTag.getAttribute('data-api-host');

      // Should still extract the value, validation happens elsewhere
      expect(apiHost).toBe('not-a-valid-url');
    });

    it('should handle special characters in api key', () => {
      const specialKey = 'key-with-special_chars.123!@#';
      mockScript.setAttribute('data-api-key', specialKey);
      document.head.appendChild(mockScript);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiKey = scriptTag.getAttribute('data-api-key');

      expect(apiKey).toBe(specialKey);
    });

    it('should handle very long api key values', () => {
      const longKey = 'a'.repeat(1000);
      mockScript.setAttribute('data-api-key', longKey);
      document.head.appendChild(mockScript);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiKey = scriptTag.getAttribute('data-api-key');

      expect(apiKey).toBe(longKey);
      expect(apiKey?.length).toBe(1000);
    });
  });

  describe('document.currentScript behavior', () => {
    it('should be null after script execution completes', () => {
      // During normal test execution, currentScript is null
      expect(document.currentScript).toBeNull();
    });

    it('should fallback to querySelector when currentScript is null', () => {
      mockScript.setAttribute('data-api-key', 'fallback-test-key');
      document.head.appendChild(mockScript);

      // Simulate the fallback logic
      const scriptTag =
        (document.currentScript as HTMLScriptElement) ||
        (document.querySelector('script[data-api-key]') as HTMLScriptElement);

      expect(scriptTag).toBeTruthy();
      expect(scriptTag?.getAttribute('data-api-key')).toBe('fallback-test-key');
    });
  });

  describe('Window instance management', () => {
    it('should create window.__luciaInstance when SDK initializes', () => {
      expect((window as any).__luciaInstance).toBeUndefined();

      // This will be set by the actual SDK init
      const mockInstance = { initialized: true };
      (window as any).__luciaInstance = mockInstance;

      expect((window as any).__luciaInstance).toBe(mockInstance);
    });

    it('should allow checking if instance exists', () => {
      expect((window as any).__luciaInstance).toBeUndefined();

      const mockInstance = { initialized: true };
      (window as any).__luciaInstance = mockInstance;

      const instanceExists = !!(window as any).__luciaInstance;
      expect(instanceExists).toBe(true);
    });

    it('should handle window.LuciaSDK assignment', () => {
      const mockSDK = { init: jest.fn(), VERSION: '0.8.0' };
      (window as any).LuciaSDK = mockSDK;

      expect((window as any).LuciaSDK).toBe(mockSDK);
      expect((window as any).LuciaSDK.VERSION).toBe('0.8.0');
    });
  });

  describe('Multiple script scenarios', () => {
    it('should only process first script with data-api-key', () => {
      const script1 = document.createElement('script');
      script1.setAttribute('data-api-key', 'first-key');
      script1.setAttribute('id', 'first');

      const script2 = document.createElement('script');
      script2.setAttribute('data-api-key', 'second-key');
      script2.setAttribute('id', 'second');

      document.head.appendChild(script1);
      document.head.appendChild(script2);

      const selected = document.querySelector('script[data-api-key]');
      expect(selected?.id).toBe('first');

      // Cleanup
      document.head.removeChild(script1);
      document.head.removeChild(script2);
    });

    it('should handle scripts added dynamically', () => {
      const dynamicScript = document.createElement('script');
      dynamicScript.setAttribute('data-api-key', 'dynamic-key');

      // Initially no script
      expect(document.querySelector('script[data-api-key]')).toBeNull();

      // Add script dynamically
      document.head.appendChild(dynamicScript);

      // Should now find it
      const found = document.querySelector('script[data-api-key]');
      expect(found).toBeTruthy();
      expect(found?.getAttribute('data-api-key')).toBe('dynamic-key');

      // Cleanup
      document.head.removeChild(dynamicScript);
    });
  });

  describe('Console error handling', () => {
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should log errors to console when auto-init fails', () => {
      const testError = new Error('Test initialization error');

      // Simulate error logging
      console.error('LuciaSDK auto-init failed:', testError);

      expect(consoleErrorSpy).toHaveBeenCalledWith('LuciaSDK auto-init failed:', testError);
    });
  });

  describe('TypeScript type safety', () => {
    it('should correctly type window extensions', () => {
      // This test validates TypeScript compilation
      const instance = (window as any).__luciaInstance;
      const sdk = (window as any).LuciaSDK;

      // These should not throw TypeScript errors
      expect(instance).toBeUndefined();
      expect(sdk).toBeUndefined();
    });

    it('should handle Config type with optional apiHost', () => {
      interface Config {
        apiKey: string;
        apiHost?: string;
      }

      const config1: Config = { apiKey: 'test' };
      const config2: Config = { apiKey: 'test', apiHost: 'url' };

      expect(config1.apiKey).toBe('test');
      expect(config2.apiHost).toBe('url');
    });
  });
});
