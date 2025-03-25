// Define the Solana wallet interface
interface SolanaWallet {
  isPhantom?: boolean;
  isConnected?: boolean;
  publicKey: { toString: () => string };
}

// Extend the Window interface to include the solana property
declare global {
  interface Window {
    phantom?: {
      solana?: SolanaWallet;
    };
  }
}

export async function getConnectedSolanaWallet(): Promise<string | null> {
  try {
    const solana = window.phantom?.solana;
    if (solana && solana.isConnected) {
      return solana.publicKey.toString();
    }
    return null;
  } catch (error) {
    console.error('Error connecting to Solana wallet:', error);
    return null;
  }
}
