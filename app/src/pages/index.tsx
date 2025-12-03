import Link from 'next/link';
import InvoiceForm from '@components/invoices/InvoiceForm';

export default function Home() {
  return (
    <div className="space-y-8">
      {/* Introduction */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Welcome to Solana Invoice Platform
        </h2>
        <p className="text-slate-600 mb-4">
          Create and manage B2B invoices on Solana blockchain with pNFT representation
          and x402 payment protocol integration.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-purple-50 p-4 rounded-md">
            <div className="text-2xl mb-2">🔐</div>
            <h3 className="font-semibold text-slate-900 mb-1">On-Chain Tracking</h3>
            <p className="text-sm text-slate-600">
              Every invoice is stored as a PDA on Solana for transparency and immutability
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="font-semibold text-slate-900 mb-1">pNFT Invoices</h3>
            <p className="text-sm text-slate-600">
              Each invoice is represented as a programmable NFT for easy tracking
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-md">
            <div className="text-2xl mb-2">💳</div>
            <h3 className="font-semibold text-slate-900 mb-1">x402 Payments</h3>
            <p className="text-sm text-slate-600">
              Ready for x402 micropayment protocol integration (stub for MVP)
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Creation Form */}
      <InvoiceForm />

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          Next Steps
        </h3>
        <ul className="space-y-2">
          <li>
            <Link
              href="/dashboard"
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              → View Dashboard
            </Link>
            <span className="text-slate-600 text-sm ml-2">
              See all your invoices as creator or client
            </span>
          </li>
          <li className="text-slate-600 text-sm">
            → After creating an invoice, share the Invoice PDA with your client
          </li>
          <li className="text-slate-600 text-sm">
            → Clients can pay invoices and track status on the dashboard
          </li>
        </ul>
      </div>

      {/* Quick Start Guide */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-3">
          🚀 Quick Start
        </h3>
        <ol className="space-y-2 text-sm text-slate-700">
          <li>1. Connect your Solana wallet (Phantom, Solflare, etc.)</li>
          <li>2. Fill in the invoice details (amount, due date, optional client address)</li>
          <li>3. Click "Create Invoice" and approve the transaction</li>
          <li>4. Copy the Invoice PDA and share it with your client</li>
          <li>5. View all invoices on the Dashboard page</li>
        </ol>
      </div>
    </div>
  );
}
