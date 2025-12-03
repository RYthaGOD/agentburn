import { Connection, clusterApiUrl } from '@solana/web3.js';

export const SOLANA_RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_SOLANA_RPC_ENDPOINT || 'http://127.0.0.1:8899';

export const getConnection = (): Connection => {
  return new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
};
