import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../.env') });

export const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'http://127.0.0.1:8899';
export const KEYPAIR_PATH = process.env.KEYPAIR_PATH || `${process.env.HOME}/.config/solana/id.json`;
