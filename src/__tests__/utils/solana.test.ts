import { getConnectedSolanaWallet, getSolanaWalletName } from '../../utils/solana';

// Mock the Logger
jest.mock('../../utils/logger', () =>
  jest.fn().mockImplementation(() => ({
    log: jest.fn(),
  })),
);

describe('Solana Utilities', () => {
  // Store original window properties to restore after tests
  let originalSolana: any;
  let originalSolflare: any;
  let originalPhantom: any;
  let originalWalletAdapterNetwork: any;
  let originalSolanaWalletAdapterContext: any;

  beforeEach(() => {
    // Save original properties
    originalSolana = window.solana;
    originalSolflare = window.solflare;
    originalPhantom = window.phantom;
    originalWalletAdapterNetwork = window.walletAdapterNetwork;
    originalSolanaWalletAdapterContext = window.SolanaWalletAdapterContext;

    // Reset all properties to undefined
    delete (window as any).solana;
    delete (window as any).solflare;
    delete (window as any).phantom;
    delete (window as any).walletAdapterNetwork;
    delete (window as any).SolanaWalletAdapterContext;
  });

  afterEach(() => {
    // Restore original properties
    if (originalSolana !== undefined) {
      (window as any).solana = originalSolana;
    } else {
      delete (window as any).solana;
    }

    if (originalSolflare !== undefined) {
      (window as any).solflare = originalSolflare;
    } else {
      delete (window as any).solflare;
    }

    if (originalPhantom !== undefined) {
      (window as any).phantom = originalPhantom;
    } else {
      delete (window as any).phantom;
    }

    if (originalWalletAdapterNetwork !== undefined) {
      (window as any).walletAdapterNetwork = originalWalletAdapterNetwork;
    } else {
      delete (window as any).walletAdapterNetwork;
    }

    if (originalSolanaWalletAdapterContext !== undefined) {
      (window as any).SolanaWalletAdapterContext = originalSolanaWalletAdapterContext;
    } else {
      delete (window as any).SolanaWalletAdapterContext;
    }
  });

  describe('getConnectedSolanaWallet', () => {
    it('should return wallet address when Solana provider is connected', async () => {
      // Mock Solana provider (like Phantom)
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('solana-address-123'),
      };

      (window as any).solana = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      const result = await getConnectedSolanaWallet();

      expect(result).toBe('solana-address-123');
      expect(publicKeyMock.toString).toHaveBeenCalled();
    });

    it('should return null when Solana provider exists but is not connected', async () => {
      // Mock unconnected Solana provider
      (window as any).solana = {
        isConnected: false,
        publicKey: null,
      };

      const result = await getConnectedSolanaWallet();

      expect(result).toBeNull();
    });

    it('should return wallet address when Solflare provider is connected', async () => {
      // First, make sure window.solana is not set
      // This is important because the code checks window.solana first
      // and only falls back to window.solflare if window.solana doesn't exist
      (window as any).solana = undefined;

      // Mock Solflare provider
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('solflare-address-456'),
      };

      // Set up Solflare
      (window as any).solflare = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      const result = await getConnectedSolanaWallet();

      expect(result).toBe('solflare-address-456');
      expect(publicKeyMock.toString).toHaveBeenCalled();
    });

    it('should attempt to connect to Phantom wallet silently', async () => {
      // First, make sure window.solana and window.solflare are not set
      // The code only checks window.phantom.solana if both window.solana
      // and window.solflare are not available
      (window as any).solana = undefined;
      (window as any).solflare = undefined;

      // Mock Phantom provider with connect method
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('phantom-address-789'),
      };

      const connectMock = jest.fn().mockResolvedValue({
        // This represents a successful connection response
      });

      // Set up phantom
      (window as any).phantom = {
        solana: {
          isConnected: false,
          publicKey: null,
          connect: connectMock,
        },
      };

      // After connect is called, we need to update the publicKey
      connectMock.mockImplementation(() => {
        (window as any).phantom.solana.publicKey = publicKeyMock;
        return Promise.resolve(true);
      });

      const result = await getConnectedSolanaWallet();

      expect(connectMock).toHaveBeenCalledWith({ onlyIfTrusted: true });
      expect(result).toBe('phantom-address-789');
    });

    it('should handle rejection from Phantom silent connection', async () => {
      // Clear window.solana and window.solflare
      (window as any).solana = undefined;
      (window as any).solflare = undefined;

      // Mock Phantom provider that rejects connection
      const connectMock = jest.fn().mockRejectedValue(new Error('User rejected'));

      (window as any).phantom = {
        solana: {
          isConnected: false,
          publicKey: null,
          connect: connectMock,
        },
      };

      const result = await getConnectedSolanaWallet();

      expect(connectMock).toHaveBeenCalledWith({ onlyIfTrusted: true });
      expect(result).toBeNull();
    });

    it('should detect wallet from walletAdapterNetwork adapters', async () => {
      // Mock wallet adapter
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('adapter-address-abc'),
      };

      (window as any).walletAdapterNetwork = {
        adapters: [
          {
            connected: false, // First adapter not connected
            publicKey: { toString: () => 'not-this-one' },
          },
          {
            connected: true, // This one should be used
            publicKey: publicKeyMock,
          },
        ],
      };

      const result = await getConnectedSolanaWallet();

      expect(result).toBe('adapter-address-abc');
      expect(publicKeyMock.toString).toHaveBeenCalled();
    });

    it('should detect wallet from SolanaWalletAdapterContext', async () => {
      // Mock wallet adapter context
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('context-address-def'),
      };

      (window as any).SolanaWalletAdapterContext = {
        current: {
          connected: true,
          publicKey: publicKeyMock,
        },
      };

      const result = await getConnectedSolanaWallet();

      expect(result).toBe('context-address-def');
      expect(publicKeyMock.toString).toHaveBeenCalled();
    });

    it('should return null when no wallet is found', async () => {
      // Don't set up any wallet mocks
      const result = await getConnectedSolanaWallet();

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      // Instead of redefining the property, we'll use a mock implementation
      // that throws when accessed
      const mockError = new Error('Something went wrong');

      // Use a spy that throws when the code tries to access window.solana
      jest.spyOn(global, 'window', 'get').mockImplementation(() => {
        const windowMock: any = {};
        Object.defineProperty(windowMock, 'solana', {
          get: () => {
            throw mockError;
          },
        });
        return windowMock;
      });

      const result = await getConnectedSolanaWallet();

      expect(result).toBeNull();

      // Restore the original window object
      jest.spyOn(global, 'window', 'get').mockRestore();
    });
  });

  describe('getSolanaWalletName', () => {
    it('should return "Phantom" when Phantom wallet is connected', async () => {
      // Mock Phantom provider
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('phantom-address-123'),
      };

      (window as any).solana = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      (window as any).phantom = {
        solana: {},
      };

      const result = await getSolanaWalletName();

      expect(result).toBe('Phantom');
    });

    it('should return "Solflare" when Solflare wallet is connected', async () => {
      // Mock Solflare provider
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('solflare-address-456'),
      };

      (window as any).solana = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      (window as any).solflare = {};

      const result = await getSolanaWalletName();

      expect(result).toBe('Solflare');
    });

    it('should return wallet name from adapter', async () => {
      // Mock Solana provider for the address check
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('adapter-address-789'),
      };

      (window as any).solana = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      // Mock adapter with the same address
      (window as any).walletAdapterNetwork = {
        adapters: [
          {
            connected: true,
            publicKey: {
              toString: () => 'adapter-address-789',
            },
            name: 'Custom Wallet',
          },
        ],
      };

      const result = await getSolanaWalletName();

      expect(result).toBe('Custom Wallet');
    });

    it('should return "Unknown Wallet" when adapter has no name', async () => {
      // Mock Solana provider for the address check
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('adapter-address-abc'),
      };

      (window as any).solana = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      // Mock adapter with no name property
      (window as any).walletAdapterNetwork = {
        adapters: [
          {
            connected: true,
            publicKey: {
              toString: () => 'adapter-address-abc',
            },
            // No name property
          },
        ],
      };

      const result = await getSolanaWalletName();

      expect(result).toBe('Unknown Wallet');
    });

    it('should return wallet name from SolanaWalletAdapterContext', async () => {
      // Mock Solana provider for the address check
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('context-address-def'),
      };

      (window as any).solana = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      // Mock adapter context
      (window as any).SolanaWalletAdapterContext = {
        current: {
          connected: true,
          publicKey: {
            toString: () => 'context-address-def',
          },
          name: 'Context Wallet',
        },
      };

      const result = await getSolanaWalletName();

      expect(result).toBe('Context Wallet');
    });

    it('should return null when no wallet is connected', async () => {
      // Don't set up any wallet mocks
      const result = await getSolanaWalletName();

      expect(result).toBeNull();
    });

    it('should prioritize Phantom over other adapters', async () => {
      // Set up Phantom and adapter at the same time
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('wallet-address-ghi'),
      };

      (window as any).solana = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      (window as any).phantom = {
        solana: {},
      };

      // Also set up an adapter, which should not be used
      (window as any).walletAdapterNetwork = {
        adapters: [
          {
            connected: true,
            publicKey: {
              toString: () => 'wallet-address-ghi',
            },
            name: 'Should Not Be Used',
          },
        ],
      };

      const result = await getSolanaWalletName();

      expect(result).toBe('Phantom');
    });

    it('should prioritize Solflare over adapters (but after Phantom)', async () => {
      // Set up Solflare
      const publicKeyMock = {
        toString: jest.fn().mockReturnValue('wallet-address-jkl'),
      };

      (window as any).solana = {
        isConnected: true,
        publicKey: publicKeyMock,
      };

      (window as any).solflare = {};

      // Also set up an adapter, which should not be used
      (window as any).walletAdapterNetwork = {
        adapters: [
          {
            connected: true,
            publicKey: {
              toString: () => 'wallet-address-jkl',
            },
            name: 'Should Not Be Used',
          },
        ],
      };

      const result = await getSolanaWalletName();

      expect(result).toBe('Solflare');
    });
  });
});
