import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Wallet } from '@coral-xyz/anchor';
import { Connection, Keypair, SystemProgram, PublicKey } from '@solana/web3.js';
import { createMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
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
  console.error('   Make sure to build the Anchor program and copy the IDL:');
  console.error('   anchor build');
  console.error('   cp target/idl/invoice_program.json scripts/idl/');
  process.exit(1);
}

async function main() {
  console.log('🚀 Creating Invoice...\n');

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
  
  // Check wallet balance
  const balance = await connection.getBalance(wallet.publicKey);
  console.log('   Balance:', balance / anchor.web3.LAMPORTS_PER_SOL, 'SOL\n');
  
  if (balance === 0) {
    console.error('❌ Error: Wallet has no SOL. Please airdrop some SOL:');
    console.error('   solana airdrop 2 --url', SOLANA_RPC_ENDPOINT);
    process.exit(1);
  }

  // Setup Anchor provider and program
  const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
  anchor.setProvider(provider);
  
  const programId = new PublicKey(idl.address || idl.metadata.address);
  const program = new Program(idl, programId, provider);
  
  console.log('📄 Program ID:', programId.toBase58(), '\n');

  // Step 1: Create a mint for the invoice pNFT (simplified for MVP)
  console.log('🎨 Minting invoice NFT...');
  const mintKeypair = Keypair.generate();
  
  const mint = await createMint(
    connection,
    walletKeypair,
    walletKeypair.publicKey,
    null,
    0, // 0 decimals for NFT
    mintKeypair,
    undefined,
    TOKEN_PROGRAM_ID
  );
  
  console.log('✅ Invoice NFT Mint:', mint.toBase58());
  
  // For MVP, we're not creating full metadata, but this is where you'd add:
  // - Token Metadata (name, symbol, URI)
  // - Master Edition (to make it an NFT)
  console.log('   (Metadata creation skipped for MVP - can add mpl-token-metadata later)\n');

  // Step 2: Derive Invoice PDA
  const [invoicePda, bump] = PublicKey.findProgramAddressSync(
    [Buffer.from('invoice'), mint.toBuffer()],
    programId
  );
  
  console.log('📋 Invoice PDA:', invoicePda.toBase58());
  console.log('   Bump:', bump, '\n');

  // Step 3: Create invoice on-chain
  const amount = 1_000_000_000; // 1 SOL in lamports
  const dueDate = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days from now
  const tokenMint = SystemProgram.programId; // Use SystemProgram as SOL placeholder
  
  console.log('💰 Invoice Details:');
  console.log('   Amount:', amount / anchor.web3.LAMPORTS_PER_SOL, 'SOL');
  console.log('   Due Date:', new Date(dueDate * 1000).toISOString());
  console.log('   Token Mint:', tokenMint.toBase58(), '(SOL placeholder)\n');
  
  console.log('🔄 Submitting transaction...');
  
  try {
    const tx = await program.methods
      .createInvoice(
        new anchor.BN(amount),
        new anchor.BN(dueDate),
        tokenMint,
        bump
      )
      .accounts({
        invoice: invoicePda,
        creator: wallet.publicKey,
        invoiceMint: mint,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    
    console.log('✅ Transaction Signature:', tx);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Invoice Created Successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('📋 Invoice Information:');
    console.log('   Invoice PDA:', invoicePda.toBase58());
    console.log('   Invoice Mint:', mint.toBase58());
    console.log('   Creator:', wallet.publicKey.toBase58());
    console.log('   Amount:', amount / anchor.web3.LAMPORTS_PER_SOL, 'SOL');
    console.log('   Status: Unpaid');
    console.log('\n💡 To mark this invoice as paid, run:');
    console.log(`   npm run mark:paid ${invoicePda.toBase58()} <receipt_reference>`);
    console.log();
  } catch (error: any) {
    console.error('❌ Error creating invoice:', error.message);
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
