import { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { fromWalletAdapter, markInvoicePaidOnChain } from '@lib/solana/invoiceActions';
import { useX402 } from '@lib/x402/useX402';

interface PaymentButtonProps {
  amountLamports: number;
  creator: string;
  invoicePda: string;
  invoiceMint?: string;
  onPaymentComplete?: () => void;
}

export default function PaymentButton({
  amountLamports,
  creator,
  invoicePda,
  invoiceMint,
  onPaymentComplete,
}: PaymentButtonProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const x402 = useX402();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const handlePayment = async () => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      setError('Please connect your wallet first');
      return;
    }

    setError('');
    setSuccess(false);
    setIsPaying(true);

    try {
      // Step 1: x402 payment request (stub for MVP)
      console.log('🔄 Processing x402 payment request...');
      const x402Result = await x402.payInvoice({
        payee: creator,
        payer: wallet.publicKey.toBase58(),
        amount: amountLamports,
        invoice: invoiceMint ? {
          invoicePda,
          invoiceMint,
        } : undefined,
        memo: 'Invoice payment',
      });

      if (!x402Result.success) {
        throw new Error(x402Result.error || 'x402 payment failed');
      }

      console.log('✅ x402 payment request processed:', x402Result);

      // Step 2: SOL transfer transaction
      console.log('🔄 Creating SOL transfer transaction...');
      const creatorPubkey = new PublicKey(creator);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: wallet.publicKey,
          toPubkey: creatorPubkey,
          lamports: amountLamports,
        })
      );

      // Get recent blockhash
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = wallet.publicKey;

      // Sign and send transaction
      const signed = await wallet.signTransaction(transaction);
      const paymentSig = await connection.sendRawTransaction(signed.serialize());
      
      console.log('🔄 Confirming payment transaction...');
      await connection.confirmTransaction({
        signature: paymentSig,
        blockhash,
        lastValidBlockHeight,
      });

      console.log('✅ Payment transaction confirmed:', paymentSig);

      // Step 3: Mark invoice as paid on-chain
      console.log('🔄 Marking invoice as paid on-chain...');
      const provider = fromWalletAdapter(connection, wallet);
      const invoicePdaPubkey = new PublicKey(invoicePda);
      
      await markInvoicePaidOnChain(provider, invoicePdaPubkey, paymentSig);
      
      console.log('✅ Invoice marked as paid on-chain');
      
      setSuccess(true);
      
      if (onPaymentComplete) {
        onPaymentComplete();
      }
    } catch (err: any) {
      console.error('Error processing payment:', err);
      setError(err.message || 'Payment failed');
    } finally {
      setIsPaying(false);
    }
  };

  const amountSol = amountLamports / anchor.web3.LAMPORTS_PER_SOL;

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={!wallet.connected || isPaying || success}
        className="bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition-colors"
      >
        {!wallet.connected
          ? 'Connect Wallet'
          : isPaying
          ? 'Processing...'
          : success
          ? '✅ Paid'
          : `Pay ${amountSol.toFixed(2)} SOL`}
      </button>

      {error && (
        <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mt-2 bg-green-50 border border-green-200 text-green-800 px-3 py-2 rounded-md text-sm">
          ✅ Payment completed and invoice marked as paid!
        </div>
      )}
    </div>
  );
}
