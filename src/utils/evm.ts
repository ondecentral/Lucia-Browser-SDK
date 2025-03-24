/**
 * Ethereum wallet utilities for Lucia Browser SDK
 */

/**
 * Checks if an Ethereum provider exists in the window object
 * @returns boolean indicating if an Ethereum provider exists
 */
export function checkIfEthereumProviderExists(): boolean {
  const { ethereum } = window as any;
  return !!ethereum;
}

/**
 * Gets the Ethereum address from the connected wallet
 * @returns Promise resolving to the Ethereum address or null if not available
 */
export async function getEthereumAddress(): Promise<string | null> {
  try {
    // Check if Ethereum provider exists
    const { ethereum } = window as any;
    if (!ethereum) {
      console.error('No Ethereum wallet detected.');
      return null;
    }
    
    // Request accounts access
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
    
    // Get the first account (current account)
    if (accounts && accounts.length > 0) {
      const address = accounts[0];
      return address;
    }
    
    return null;
  } catch (error: any) {
    if (error.code === 4001) {
      // User rejected the request
      console.error('Connection request rejected by user.');
    } else {
      console.error('Error connecting to wallet:', error);
    }
    return null;
  }
}

/**
 * Formats an Ethereum address for display by shortening it
 * @param address The full Ethereum address
 * @returns Shortened address in the format "0x1234...5678"
 */
export function formatEthereumAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Sets up listeners for Ethereum account changes
 * @param callback Function to call when accounts change
 */
export function setupEthereumAccountListeners(
  callback: (accounts: string[]) => void
): void {
  const { ethereum } = window as any;
  if (!ethereum) return;
  
  ethereum.on('accountsChanged', callback);
}

/**
 * Gets the current Ethereum chain ID
 * @returns Promise resolving to the chain ID or null if not available
 */
export async function getEthereumChainId(): Promise<string | null> {
  try {
    const { ethereum } = window as any;
    if (!ethereum) return null;
    
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    return chainId;
  } catch (error) {
    console.error('Error getting chain ID:', error);
    return null;
  }
}

/**
 * Checks if a wallet is connected and returns the address if it is
 * @returns Promise resolving to the connected address or null
 */
export async function getConnectedWalletAddress(): Promise<string | null> {
  try {
    const { ethereum } = window as any;
    if (!ethereum) return null;
    
    const accounts = await ethereum.request({ method: 'eth_accounts' });
    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
    return null;
  } catch (error) {
    console.error('Error checking connected wallet:', error);
    return null;
  }
}
/**
 * Checks if the connected wallet is MetaMask
 * @returns boolean indicating if the connected wallet is MetaMask
 */
export async function isMetaMask(): Promise<boolean> {
  try {
    const { ethereum } = window as any;
    if (!ethereum) return false;
    
    const isMetaMask = await ethereum.isMetaMask;
    return !!isMetaMask;
  } catch (error) {
    console.error('Error checking if MetaMask:', error);
    return false;
  }
}


