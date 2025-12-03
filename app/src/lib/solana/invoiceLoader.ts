import { AnchorProvider } from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { getInvoiceProgram } from './invoiceProgram';

export interface InvoiceItem {
  pubkey: string;
  creator: string;
  client: string | null;
  mint: string;
  amount: number;
  tokenMint: string;
  dueDate: number;
  status: string;
  createdAt: number;
  updatedAt: number;
  lastReceiptReference: string | null;
}

/**
 * Loads all invoices for a wallet (as creator or client)
 */
export const loadInvoicesForWallet = async (
  provider: AnchorProvider,
  walletPubkey: PublicKey
): Promise<InvoiceItem[]> => {
  const program = getInvoiceProgram(provider);
  
  // Fetch invoices where wallet is creator
  const creatorInvoices = await program.account.invoiceAccount.all([
    {
      memcmp: {
        offset: 8, // After discriminator
        bytes: walletPubkey.toBase58(), // Anchor's all() method accepts base58
      },
    },
  ]);
  
  // Fetch invoices where wallet is client
  // Note: client is optional, so we need to check if it's set
  const allInvoices = await program.account.invoiceAccount.all();
  const clientInvoices = allInvoices.filter(
    (inv) => inv.account.client && inv.account.client.equals(walletPubkey)
  );
  
  // Combine and deduplicate
  const combinedMap = new Map<string, any>();
  
  [...creatorInvoices, ...clientInvoices].forEach((inv) => {
    combinedMap.set(inv.publicKey.toBase58(), inv);
  });
  
  // Convert to InvoiceItem format
  const invoices: InvoiceItem[] = Array.from(combinedMap.values()).map((inv) => {
    const account = inv.account;
    
    // Decode status enum - Anchor returns it as { unpaid: {} }, { paid: {} }, etc.
    let status = 'Unknown';
    if (account.status.unpaid !== undefined) status = 'Unpaid';
    else if (account.status.partiallyPaid !== undefined) status = 'PartiallyPaid';
    else if (account.status.paid !== undefined) status = 'Paid';
    else if (account.status.canceled !== undefined) status = 'Canceled';
    else if (account.status.disputed !== undefined) status = 'Disputed';
    else if (account.status.expired !== undefined) status = 'Expired';
    
    return {
      pubkey: inv.publicKey.toBase58(),
      creator: account.creator.toBase58(),
      client: account.client ? account.client.toBase58() : null,
      mint: account.mint.toBase58(),
      amount: account.amount.toNumber(),
      tokenMint: account.tokenMint.toBase58(),
      dueDate: account.dueDate.toNumber(),
      status,
      createdAt: account.createdAt.toNumber(),
      updatedAt: account.updatedAt.toNumber(),
      lastReceiptReference: account.lastReceiptReference || null,
    };
  });
  
  // Sort by created date descending
  invoices.sort((a, b) => b.createdAt - a.createdAt);
  
  return invoices;
};
