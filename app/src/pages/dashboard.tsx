import { useEffect, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { fromWalletAdapter } from '@lib/solana/invoiceActions';
import { loadInvoicesForWallet, InvoiceItem } from '@lib/solana/invoiceLoader';
import * as anchor from '@coral-xyz/anchor';
import PaymentButton from '@components/invoices/PaymentButton';

export default function Dashboard() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const loadInvoices = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const provider = fromWalletAdapter(connection, wallet);
      const loadedInvoices = await loadInvoicesForWallet(provider, wallet.publicKey);
      setInvoices(loadedInvoices);
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [wallet.connected, wallet.publicKey]);

  const getRole = (invoice: InvoiceItem): string => {
    if (!wallet.publicKey) return 'Other';
    
    const walletAddress = wallet.publicKey.toBase58();
    
    if (invoice.creator === walletAddress) {
      return 'Issuer';
    } else if (invoice.client && invoice.client === walletAddress) {
      return 'Payer';
    } else {
      return 'Other';
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (lamports: number): string => {
    return (lamports / anchor.web3.LAMPORTS_PER_SOL).toFixed(4);
  };

  if (!wallet.connected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-4xl mb-4">👛</div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">
          Connect Your Wallet
        </h2>
        <p className="text-slate-600">
          Please connect your Solana wallet to view your invoices
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Invoice Dashboard</h2>
            <p className="text-slate-600 mt-1">
              View and manage your invoices
            </p>
          </div>
          <button
            onClick={loadInvoices}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white px-4 py-2 rounded-md font-medium"
          >
            {isLoading ? '🔄 Loading...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoading && invoices.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="animate-spin text-4xl mb-4">⚙️</div>
          <p className="text-slate-600">Loading invoices...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && invoices.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <div className="text-4xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            No Invoices Found
          </h3>
          <p className="text-slate-600">
            Create your first invoice on the home page to get started
          </p>
        </div>
      )}

      {/* Invoice List */}
      {invoices.length > 0 && (
        <div className="space-y-4">
          {invoices.map((invoice) => (
            <div
              key={invoice.pubkey}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Invoice Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">
                      {formatAmount(invoice.amount)} SOL
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        invoice.status === 'Paid'
                          ? 'bg-green-100 text-green-800'
                          : invoice.status === 'Unpaid'
                          ? 'bg-yellow-100 text-yellow-800'
                          : invoice.status === 'Expired'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {invoice.status}
                    </span>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        getRole(invoice) === 'Issuer'
                          ? 'bg-blue-100 text-blue-800'
                          : getRole(invoice) === 'Payer'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {getRole(invoice)}
                    </span>
                  </div>

                  <div className="text-sm text-slate-600 space-y-1">
                    <div>
                      <span className="font-medium">Invoice PDA:</span>{' '}
                      <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                        {invoice.pubkey.substring(0, 8)}...{invoice.pubkey.substring(invoice.pubkey.length - 6)}
                      </code>
                    </div>
                    <div>
                      <span className="font-medium">Due:</span> {formatDate(invoice.dueDate)}
                    </div>
                    <div>
                      <span className="font-medium">Creator:</span>{' '}
                      <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                        {invoice.creator.substring(0, 8)}...
                      </code>
                    </div>
                    {invoice.client && (
                      <div>
                        <span className="font-medium">Client:</span>{' '}
                        <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                          {invoice.client.substring(0, 8)}...
                        </code>
                      </div>
                    )}
                    {invoice.lastReceiptReference && (
                      <div>
                        <span className="font-medium">Receipt:</span>{' '}
                        <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">
                          {invoice.lastReceiptReference.substring(0, 20)}...
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Payment Action */}
                <div>
                  {invoice.status === 'Unpaid' && getRole(invoice) !== 'Issuer' && (
                    <PaymentButton
                      amountLamports={invoice.amount}
                      creator={invoice.creator}
                      invoicePda={invoice.pubkey}
                      invoiceMint={invoice.mint}
                      onPaymentComplete={loadInvoices}
                    />
                  )}
                  {invoice.status === 'Paid' && (
                    <div className="text-green-600 font-semibold">✅ Paid</div>
                  )}
                  {invoice.status === 'Unpaid' && getRole(invoice) === 'Issuer' && (
                    <div className="text-slate-500 text-sm">Awaiting payment</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
