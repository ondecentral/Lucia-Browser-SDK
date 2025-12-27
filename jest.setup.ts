import '@testing-library/jest-dom';

// Helper to mock location URL in tests using history API (works with jsdom)
declare global {
  var setTestUrl: (url: string) => void;
}

global.setTestUrl = (url: string) => {
  window.history.replaceState({}, '', url);
};

// Mock TextEncoder (required for crypto.subtle.digest)
Object.defineProperty(global, 'TextEncoder', {
  value: class MockTextEncoder {
    encode(str: string): Uint8Array {
      const arr = new Uint8Array(str.length);
      for (let i = 0; i < str.length; i++) {
        arr[i] = str.charCodeAt(i);
      }
      return arr;
    }
  },
  writable: true,
  configurable: true,
});

// Mock TextDecoder
Object.defineProperty(global, 'TextDecoder', {
  value: class MockTextDecoder {
    decode() {
      return 'mock decoded text';
    }
  },
});

// Mock Canvas
class MockCanvasRenderingContext2D {
  fillStyle: string = '';
  fillRect = jest.fn();
  beginPath = jest.fn();
  arc = jest.fn();
  fill = jest.fn();
  measureText = jest.fn().mockReturnValue({ width: 100 });
  fillText = jest.fn();
  getImageData = jest.fn().mockReturnValue({ data: new Uint8ClampedArray([1, 2, 3, 4]) });
}

HTMLCanvasElement.prototype.getContext = jest.fn().mockImplementation(() => {
  return new MockCanvasRenderingContext2D();
});

// Mock navigator permissions
Object.defineProperty(navigator, 'permissions', {
  value: {
    query: jest.fn().mockResolvedValue({ state: 'granted' }),
    webglVersion: '2.0',
    RENDERER: 'Mock GPU Renderer',
    geolocation: { state: 'granted' },
  },
  writable: true,
});

// Mock window crypto
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      digest: jest.fn().mockImplementation(() => {
        return Promise.resolve(new ArrayBuffer(32));
      }),
    },
    getRandomValues: jest.fn().mockImplementation((buffer) => {
      return buffer;
    }),
  },
  writable: true,
});

// Mock window ethereum for MetaMask tests
Object.defineProperty(window, 'ethereum', {
  value: {
    isConnected: jest.fn().mockReturnValue(true),
    selectedAddress: '0x1234567890abcdef',
    request: jest.fn().mockImplementation((request) => {
      if (request.method === 'eth_requestAccounts') {
        return Promise.resolve(['0x1234567890abcdef']);
      }
      if (request.method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.reject(new Error('Method not implemented'));
    }),
    on: jest.fn(),
    isMetaMask: true,
  },
  writable: true,
});

// Mock window.solana for Phantom wallet tests
Object.defineProperty(window, 'solana', {
  value: {
    isPhantom: true,
    publicKey: { toBase58: () => 'solana_public_key_123' },
    connect: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn(),
    on: jest.fn(),
  },
  writable: true,
  configurable: true,
});
