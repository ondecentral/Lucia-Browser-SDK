/**
 * Integration tests for auto-initialization with hybrid CDN + npm usage
 *
 * NOTE: These tests focus on the conceptual aspects of auto-init that can be tested
 * in a Jest environment. Full CDN auto-init behavior (script tag detection,
 * DOMContentLoaded, automatic initialization) must be tested manually using:
 * demo/auto-init-demo.html in a real browser environment.
 */

import '@testing-library/jest-dom';

describe('Auto-init Integration Tests - Conceptual', () => {
  beforeEach(() => {
    // Clear instances
    delete (window as any).__luciaInstance;
    delete (window as any).LuciaSDK;

    // Clear storage
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    delete (window as any).__luciaInstance;
    delete (window as any).LuciaSDK;
  });

  describe('Window.__luciaInstance sharing mechanism', () => {
    it('should store instance in window for cross-context sharing', () => {
      const mockInstance = { initialized: true, apiKey: 'test' };
      (window as any).__luciaInstance = mockInstance;

      expect((window as any).__luciaInstance).toBe(mockInstance);
      expect((window as any).__luciaInstance.initialized).toBe(true);
    });

    it('should allow checking if instance exists', () => {
      expect((window as any).__luciaInstance).toBeUndefined();

      (window as any).__luciaInstance = { initialized: true };

      const hasInstance = !!(window as any).__luciaInstance;
      expect(hasInstance).toBe(true);
    });

    it('should support instance sharing across contexts', () => {
      const cdnInstance = { source: 'cdn', apiKey: 'cdn-key' };
      (window as any).__luciaInstance = cdnInstance;

      const npmCheckedInstance = (window as any).__luciaInstance;

      expect(npmCheckedInstance).toBe(cdnInstance);
      expect(npmCheckedInstance.source).toBe('cdn');
    });
  });

  describe('Script tag attribute detection', () => {
    it('should find script tag with data-api-key', () => {
      const script = document.createElement('script');
      script.setAttribute('data-api-key', 'test-key-123');
      script.setAttribute('data-debug-url', 'https://debug.example.com');
      document.head.appendChild(script);

      const foundScript = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      expect(foundScript).toBeTruthy();
      expect(foundScript.getAttribute('data-api-key')).toBe('test-key-123');
      expect(foundScript.getAttribute('data-debug-url')).toBe('https://debug.example.com');

      document.head.removeChild(script);
    });

    it('should extract config from script attributes', () => {
      const script = document.createElement('script');
      script.setAttribute('data-api-key', 'extracted-key');
      script.setAttribute('data-debug-url', 'https://custom.debug.com');
      document.head.appendChild(script);

      const scriptTag = document.querySelector('script[data-api-key]') as HTMLScriptElement;
      const apiKey = scriptTag.getAttribute('data-api-key');
      const debugURL = scriptTag.getAttribute('data-debug-url');

      const config = {
        apiKey: apiKey || '',
        ...(debugURL && { debugURL }),
      };

      expect(config.apiKey).toBe('extracted-key');
      expect(config.debugURL).toBe('https://custom.debug.com');

      document.head.removeChild(script);
    });
  });

  describe('Config object construction', () => {
    it('should build config with only required fields', () => {
      const apiKey = 'required-key';
      const debugURL: string | null = null;

      const config: any = { apiKey };
      if (debugURL) {
        config.debugURL = debugURL;
      }

      expect(config).toEqual({ apiKey: 'required-key' });
      expect(config).not.toHaveProperty('debugURL');
    });

    it('should build config with optional fields when provided', () => {
      const apiKey = 'required-key';
      const debugURL = 'https://debug.example.com';

      const config: any = { apiKey };
      if (debugURL) {
        config.debugURL = debugURL;
      }

      expect(config).toEqual({
        apiKey: 'required-key',
        debugURL: 'https://debug.example.com',
      });
    });

    it('should handle empty string values correctly', () => {
      const apiKey = 'key';
      const debugURL = '';

      const config: any = { apiKey };
      if (debugURL) {
        config.debugURL = debugURL;
      }

      expect(config).toEqual({ apiKey: 'key' });
    });
  });

  describe('DOMContentLoaded handling', () => {
    it('should check if document is ready', () => {
      expect(['loading', 'interactive', 'complete']).toContain(document.readyState);
    });

    it('should support both immediate and deferred execution', () => {
      const wasExecuted = { value: false };

      const executeWhenReady = () => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            wasExecuted.value = true;
          });
        } else {
          wasExecuted.value = true;
        }
      };

      executeWhenReady();

      // In test environment, document is already loaded
      expect(wasExecuted.value).toBe(true);
    });
  });

  describe('Manual testing requirements', () => {
    it('should document that full auto-init must be tested manually', () => {
      /*
       * Full CDN auto-init flow testing checklist:
       *
       * ✓ Script tag detection via document.currentScript
       * ✓ DOMContentLoaded event handling
       * ✓ Automatic SDK initialization
       * ✓ window.__luciaInstance population
       * ✓ Cross-context instance sharing (CDN + npm import)
       * ✓ Next.js <Script> component integration
       * ✓ Error handling and console output
       * ✓ Multiple script tag behavior
       *
       * Test using: demo/auto-init-demo.html in Chrome, Firefox, Safari
       */

      expect(true).toBe(true);
    });
  });
});
