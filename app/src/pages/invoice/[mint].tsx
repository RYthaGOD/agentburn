import { useRouter } from 'next/router';
import { useWallet } from '@solana/wallet-adapter-react';
import PaymentButton from '@components/invoices/PaymentButton';
import * as anchor from '@coral-xyz/anchor';

/**
 * Invoice detail page (stub for MVP)
 * 
 * In production, this would:
 * 1. Fetch invoice data from on-chain using the mint parameter
 * 2. Display full invoice details
 * 3. Show payment history
 * 4. Allow status updates
 */
export default function InvoiceDetail() {
  const router = useRouter();
  const wallet = useWallet();
  const { mint } = router.query;

  // For MVP, we're showing a stub with fake data
  // In production, fetch real invoice data using the mint parameter
  const fakeInvoice = {
    mint: mint as string,
    amount: 1_000_000_000, // 1 SOL
    creator: '11111111111111111111111111111111', // Fake creator
    status: 'Unpaid',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };

  if (!mint) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Invalid Invoice
        </h2>
        <p className="text-slate-600">No invoice mint provided</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notice */}
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md">
        <p className="font-semibold">⚠️ Stub Implementation</p>
        <p className="text-sm mt-1">
          This is a placeholder page. In production, it would fetch and display real invoice
          data from on-chain using the mint parameter.
        </p>
      </div>

      {/* Invoice Details (Fake Data) */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Invoice Details</h2>

        <div className="space-y-3">
          <div>
            <span className="font-medium text-slate-700">Invoice Mint:</span>
            <p className="text-slate-900 font-mono text-sm break-all">{mint}</p>
          </div>

          <div>
            <span className="font-medium text-slate-700">Amount:</span>
            <p className="text-slate-900">
              {(fakeInvoice.amount / anchor.web3.LAMPORTS_PER_SOL).toFixed(2)} SOL
            </p>
          </div>

          <div>
            <span className="font-medium text-slate-700">Status:</span>
            <p className="text-slate-900">{fakeInvoice.status}</p>
          </div>

          <div>
            <span className="font-medium text-slate-700">Due Date:</span>
            <p className="text-slate-900">{fakeInvoice.dueDate}</p>
          </div>

          <div>
            <span className="font-medium text-slate-700">Creator:</span>
            <p className="text-slate-900 font-mono text-sm">{fakeInvoice.creator}</p>
          </div>
        </div>

        {/* Payment Button */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900 mb-3">Make Payment</h3>
          <PaymentButton
            amountLamports={fakeInvoice.amount}
            creator={fakeInvoice.creator}
            invoicePda={mint as string} // Note: This should be derived from mint in production
            invoiceMint={mint as string}
          />
        </div>
      </div>

      {/* Implementation Note */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          🔧 Production Implementation
        </h3>
        <p className="text-sm text-slate-700 mb-2">
          To complete this page for production:
        </p>
        <ol className="space-y-1 text-sm text-slate-600 list-decimal list-inside">
          <li>Derive Invoice PDA from mint using program seeds</li>
          <li>Fetch InvoiceAccount data from on-chain</li>
          <li>Display real invoice details (amount, creator, client, status, etc.)</li>
          <li>Show payment history if available</li>
          <li>Add real-time status updates</li>
        </ol>
      </div>
    </div>
  );
}
