import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { Keypair, SystemProgram, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { fromWalletAdapter } from '@lib/solana/invoiceActions';
import { getInvoiceProgram } from '@lib/solana/invoiceProgram';

export default function InvoiceForm() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [amount, setAmount] = useState('1.0');
  const [daysUntilDue, setDaysUntilDue] = useState('7');
  const [clientAddress, setClientAddress] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [lastInvoice, setLastInvoice] = useState<{
    pda: string;
    mint: string;
    tx: string;
  } | null>(null);
  const [error, setError] = useState<string>('');

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!wallet.connected || !wallet.publicKey) {
      setError('Please connect your wallet first');
      return;
    }
    
    setError('');
    setIsCreating(true);
    
    try {
      // Parse inputs
      const amountLamports = Math.floor(parseFloat(amount) * anchor.web3.LAMPORTS_PER_SOL);
      const dueDate = Math.floor(Date.now() / 1000) + (parseInt(daysUntilDue) * 24 * 60 * 60);
      
      // For MVP, generate a fake mint (in production, mint actual pNFT)
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;
      
      // Create Anchor provider
      const provider = fromWalletAdapter(connection, wallet);
      const program = getInvoiceProgram(provider);
      
      // Derive Invoice PDA
      const [invoicePda, bump] = PublicKey.findProgramAddressSync(
        [Buffer.from('invoice'), mint.toBuffer()],
        program.programId
      );
      
      console.log('Creating invoice:', {
        amount: amountLamports,
        dueDate,
        mint: mint.toBase58(),
        invoicePda: invoicePda.toBase58(),
      });
      
      // Create invoice on-chain
      const tx = await program.methods
        .createInvoice(
          new anchor.BN(amountLamports),
          new anchor.BN(dueDate),
          SystemProgram.programId, // SOL placeholder
          bump
        )
        .accounts({
          invoice: invoicePda,
          creator: wallet.publicKey,
          invoiceMint: mint,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      
      setLastInvoice({
        pda: invoicePda.toBase58(),
        mint: mint.toBase58(),
        tx,
      });
      
      // Reset form
      setAmount('1.0');
      setDaysUntilDue('7');
      setClientAddress('');
    } catch (err: any) {
      console.error('Error creating invoice:', err);
      setError(err.message || 'Failed to create invoice');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">
        Create New Invoice
      </h2>
      
      <form onSubmit={handleCreateInvoice} className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-slate-700 mb-1">
            Amount (SOL)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="0.01"
            min="0.01"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="1.0"
          />
        </div>
        
        <div>
          <label htmlFor="days" className="block text-sm font-medium text-slate-700 mb-1">
            Days Until Due
          </label>
          <input
            type="number"
            id="days"
            value={daysUntilDue}
            onChange={(e) => setDaysUntilDue(e.target.value)}
            min="1"
            required
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="7"
          />
        </div>
        
        <div>
          <label htmlFor="client" className="block text-sm font-medium text-slate-700 mb-1">
            Client Wallet Address (Optional)
          </label>
          <input
            type="text"
            id="client"
            value={clientAddress}
            onChange={(e) => setClientAddress(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Client's Solana address"
          />
          <p className="mt-1 text-xs text-slate-500">
            Leave empty to allow any payer
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {error}
          </div>
        )}
        
        {lastInvoice && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
            <p className="font-semibold mb-1">✅ Invoice Created!</p>
            <p className="text-xs break-all">Invoice PDA: {lastInvoice.pda}</p>
            <p className="text-xs break-all">Mint: {lastInvoice.mint}</p>
            <p className="text-xs break-all">Tx: {lastInvoice.tx}</p>
          </div>
        )}
        
        <button
          type="submit"
          disabled={!wallet.connected || isCreating}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          {!wallet.connected ? 'Connect Wallet' : isCreating ? 'Creating...' : 'Create Invoice'}
        </button>
      </form>
    </div>
  );
}
