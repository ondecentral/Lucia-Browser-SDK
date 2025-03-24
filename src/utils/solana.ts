import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';

export function getSolanaConfig(): { connection: Connection } {
  return { connection: new Connection(clusterApiUrl('mainnet-beta')) };
}

export async function fetchTokenAccounts(walletAddress: string, connection: Connection) {
  if (walletAddress) {
    try {
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(walletAddress), {
        programId: TOKEN_PROGRAM_ID,
      });
      console.log('Token Accounts:', tokenAccounts);
      const token22Accounts = await connection.getParsedTokenAccountsByOwner(new PublicKey(walletAddress), {
        programId: TOKEN_2022_PROGRAM_ID,
      });
      let allTokens = [...tokenAccounts.value, ...token22Accounts.value];

      let tokenData = allTokens.map((token) => ({
        associatedTokenAccount: token.pubkey.toString(),
        owner: token.account.data.parsed.info.owner.toString(),
        mint: token.account.data.parsed.info.mint.toString(),
        amount: token.account.data.parsed.info.tokenAmount.uiAmount,
        decimals: token.account.data.parsed.info.tokenAmount.decimals,
      }));
      console.log('tokenData', tokenData);
      return tokenData;
    } catch (error) {
      console.error('Error fetching token accounts:', error);
    }
  }
  return [];
}
