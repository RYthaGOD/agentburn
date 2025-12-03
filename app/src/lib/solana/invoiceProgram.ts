import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import idl from '../../idl/invoice_program.json';

// Placeholder program ID - will be updated after deployment
export const PROGRAM_ID = new PublicKey('inv1pVoiCe11111111111111111111111111111111');

export const getInvoiceProgram = (provider: AnchorProvider): Program => {
  return new Program(idl as any, PROGRAM_ID, provider);
};
