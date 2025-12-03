import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { SOLANA_RPC_ENDPOINT, KEYPAIR_PATH } from './env';

// Load IDL
const idlPath = path.join(__dirname, '../idl/invoice_program.json');
let idl: any;

try {
  idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
} catch (error) {
  console.error('❌ Error: Could not load IDL file from:', idlPath);
  process.exit(1);
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Usage: ts-node mark_invoice_paid.ts <INVOICE_PDA> <RECEIPT_REFERENCE>');
    console.error('\nExample:');
    console.error('  npm run mark:paid 9xQeW...abc123 5hf7g...payment-sig');
    process.exit(1);
  }
  
  const [invoicePdaStr, receiptReference] = args;
  
  console.log('🔄 Marking Invoice as Paid...\n');

  // Setup connection and wallet
  const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
  
  let keypairData: Uint8Array;
  try {
    const keypairFile = fs.readFileSync(KEYPAIR_PATH.replace('~', process.env.HOME || ''), 'utf-8');
    keypairData = new Uint8Array(JSON.parse(keypairFile));
  } catch (error) {
    console.error('❌ Error: Could not load wallet keypair from:', KEYPAIR_PATH);
    process.exit(1);
  }
  
  const walletKeypair = Keypair.fromSecretKey(keypairData);
  const wallet = new Wallet(walletKeypair);
  
  console.log('📋 Configuration:');
  console.log('   RPC Endpoint:', SOLANA_RPC_ENDPOINT);
  console.log('   Wallet:', wallet.publicKey.toBase58());
  console.log('   Invoice PDA:', invoicePdaStr);
  console.log('   Receipt:', receiptReference, '\n');

  // Setup Anchor provider and program
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  anchor.setProvider(provider);
  
  const programId = new PublicKey(idl.address || idl.metadata.address);
  const program = new Program(idl, programId, provider);
  
  const invoicePda = new PublicKey(invoicePdaStr);
  
  // Fetch current invoice state
  console.log('🔍 Fetching invoice state...');
  try {
    const invoice = await program.account.invoiceAccount.fetch(invoicePda);
    console.log('   Current Status:', Object.keys(invoice.status)[0]);
    console.log('   Amount:', invoice.amount.toString(), 'lamports');
    console.log('   Creator:', invoice.creator.toBase58());
    
    // Verify that the signer is the creator
    if (!invoice.creator.equals(wallet.publicKey)) {
      console.error('❌ Error: Only the invoice creator can mark it as paid');
      console.error('   Creator:', invoice.creator.toBase58());
      console.error('   Your wallet:', wallet.publicKey.toBase58());
      process.exit(1);
    }
    
    console.log('\n🔄 Submitting transaction...');
  } catch (error: any) {
    console.error('❌ Error fetching invoice:', error.message);
    process.exit(1);
  }

  // Mark invoice as paid
  try {
    const tx = await program.methods
      .markInvoicePaid(receiptReference)
      .accounts({
        invoice: invoicePda,
        creator: wallet.publicKey,
      })
      .rpc();
    
    console.log('✅ Transaction Signature:', tx);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Invoice Marked as Paid!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Fetch updated state
    const updatedInvoice = await program.account.invoiceAccount.fetch(invoicePda);
    console.log('📋 Updated Invoice:');
    console.log('   Status:', Object.keys(updatedInvoice.status)[0]);
    console.log('   Receipt:', updatedInvoice.lastReceiptReference);
    console.log();
  } catch (error: any) {
    console.error('❌ Error marking invoice as paid:', error.message);
    if (error.logs) {
      console.error('Program logs:', error.logs);
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
