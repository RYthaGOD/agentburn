/**
 * x402 (HTTP 402 Payment Required) Protocol Types
 * 
 * This is a stub implementation for MVP.
 * Replace with real x402 SDK types when integrating.
 */

export interface X402Token {
  mint: string;
  amount: number;
  decimals: number;
}

export interface X402InvoiceReference {
  invoicePda: string;
  invoiceMint: string;
}

export interface X402PaymentRequest {
  payee: string; // Creator wallet address
  payer: string; // Payer wallet address
  amount: number; // Amount in lamports
  token?: X402Token; // Optional token (defaults to SOL)
  invoice?: X402InvoiceReference; // Optional invoice reference
  memo?: string; // Optional memo
}

export interface X402PaymentResult {
  success: boolean;
  txSignature?: string;
  receiptId?: string;
  error?: string;
}

export interface IX402Service {
  payInvoice(request: X402PaymentRequest): Promise<X402PaymentResult>;
}
