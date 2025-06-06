// Type definitions for the Solana wallet objects
import Logger from './logger';
import Store from './store';

const logger = new Logger(Store.store);

interface SolanaProvider {
  isPhantom?: boolean;
  isConnected: boolean;
  publicKey: {
    toString: () => string;
  };
  connect: (options?: { onlyIfTrusted?: boolean }) => Promise<any>;
}

interface SolflareProvider {
  isConnected: boolean;
  publicKey: {
    toString: () => string;
  };
}

interface WalletAdapter {
  connected: boolean;
  publicKey: {
    toString: () => string;
  };
  name?: string;
}

interface PhantomProvider {
  solana?: SolanaProvider;
}

// Declare global window types
declare global {
  interface Window {
    solana?: SolanaProvider;
    solflare?: SolflareProvider;
    phantom?: PhantomProvider;
    walletAdapterNetwork?: {
      adapters: WalletAdapter[];
    };
    SolanaWalletAdapterContext?: {
      current: WalletAdapter;
    };
  }
}

/**
 * Get the connected Solana wallet address without prompting for connection
 * @returns Promise that resolves to the wallet address string or null if none found
 */
export async function getConnectedSolanaWallet(): Promise<string | null> {
  try {
    // Check if Solana is available in window object (Phantom, Solflare, etc.)
    if (window.solana) {
      // Check if already connected
      if (window.solana.isConnected && window.solana.publicKey) {
        return window.solana.publicKey.toString();
      }
    }
    // Check for Solflare specifically as it may use a different pattern
    else if (window.solflare) {
      if (window.solflare.isConnected && window.solflare.publicKey) {
        return window.solflare.publicKey.toString();
      }
    }
    // Check for Phantom's Solana adapter
    else if (window.phantom?.solana) {
      try {
        // Try to connect with onlyIfTrusted to avoid prompting the user
        const response = await window.phantom.solana.connect({ onlyIfTrusted: true });
        if (response && window.phantom.solana.publicKey) {
          return window.phantom.solana.publicKey.toString();
        }
      } catch (error) {
        logger.log('error', 'Error silently connecting to Phantom wallet:', error);
        // If silent connection fails, we return null but don't throw an error
      }
    }

    // Check for other wallet adapters
    const adapters: WalletAdapter[] = [];

    // Check for wallet adapter instances in common locations
    if (window.walletAdapterNetwork?.adapters) {
      adapters.push(...window.walletAdapterNetwork.adapters);
    }

    // Check for @solana/wallet-adapter-react context exposed globally
    if (window.SolanaWalletAdapterContext?.current) {
      adapters.push(window.SolanaWalletAdapterContext.current);
    }

    // Find first connected adapter
    const connectedAdapter = adapters.find((adapter) => adapter.connected && adapter.publicKey);

    if (connectedAdapter) {
      return connectedAdapter.publicKey.toString();
    }

    // No connected wallet found
    return null;
  } catch (err) {
    // Error detecting Solana wallet
    logger.log('error', 'Error detecting Solana wallet:', err);
    return null;
  }
}
/**
 * Get the name of the connected Solana wallet
 * @returns Promise that resolves to the name of the wallet or null if none found
 */
export async function getSolanaWalletName(): Promise<string | null> {
  const address = await getConnectedSolanaWallet();

  if (!address) {
    return null;
  }

  // Check if the wallet is Phantom
  if (window.phantom?.solana) {
    return 'Phantom';
  }

  // Check if the wallet is Solflare
  if (window.solflare) {
    return 'Solflare';
  }

  // Try to detect the wallet name from the adapter
  const adapters: WalletAdapter[] = [];

  // Check for wallet adapter instances in common locations
  if (window.walletAdapterNetwork?.adapters) {
    adapters.push(...window.walletAdapterNetwork.adapters);
  }

  // Check for @solana/wallet-adapter-react context exposed globally
  if (window.SolanaWalletAdapterContext?.current) {
    adapters.push(window.SolanaWalletAdapterContext.current);
  }

  // Find first matching adapter
  const matchingAdapter = adapters.find(
    (adapter) => adapter.connected && adapter.publicKey && adapter.publicKey.toString() === address,
  );

  if (matchingAdapter) {
    return matchingAdapter.name || 'Unknown Wallet';
  }

  // If all else fails, return null
  return null;
}
