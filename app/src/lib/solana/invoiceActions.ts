import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey, Connection } from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';
import { getInvoiceProgram } from './invoiceProgram';

/**
 * Creates an Anchor provider from wallet adapter context
 */
export const fromWalletAdapter = (
  connection: Connection,
  wallet: WalletContextState
): AnchorProvider => {
  return new AnchorProvider(
    connection,
    wallet as any,
    { commitment: 'confirmed' }
  );
};

/**
 * Marks an invoice as paid on-chain
 */
export const markInvoicePaidOnChain = async (
  provider: AnchorProvider,
  invoicePda: PublicKey,
  receiptReference: string
): Promise<string> => {
  const program = getInvoiceProgram(provider);
  
  // Fetch invoice to get creator
  const invoice = await program.account.invoiceAccount.fetch(invoicePda);
  
  const tx = await program.methods
    .markInvoicePaid(receiptReference)
    .accounts({
      invoice: invoicePda,
      creator: invoice.creator,
    })
    .rpc();
  
  return tx;
};
