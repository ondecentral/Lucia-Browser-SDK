// Type definitions for the Solana wallet objects
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
    else if (window.phantom) {
        let addr: string | null = null;
        const checkPhantomConnection = async () => {
            if (window.phantom?.solana) {
                try {
                    let mockConnect = await window.phantom.solana.connect({ onlyIfTrusted: true })
                    if (mockConnect) {
                        addr = window.phantom.solana.publicKey.toString();
                      }
                }
                catch {
                    return null;
                }
              
            }
          }
        checkPhantomConnection()
      return addr;
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
    for (const adapter of adapters) {
      if (adapter.connected && adapter.publicKey) {
        return adapter.publicKey.toString();
      }
    }
    
    // No connected wallet found
    return null;
  } catch (err) {
    console.error('Error detecting Solana wallet:', err);
    return null;
  }
}
