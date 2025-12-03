import { IX402Service, X402PaymentRequest, X402PaymentResult } from './types';

/**
 * Stub implementation of x402 payment service
 * 
 * This logs the payment request and returns a fake result.
 * Replace this with a real x402 SDK implementation.
 */
class X402StubService implements IX402Service {
  async payInvoice(request: X402PaymentRequest): Promise<X402PaymentResult> {
    console.log('🔄 [x402 Stub] Payment request:', {
      payee: request.payee,
      payer: request.payer,
      amount: request.amount,
      token: request.token,
      invoice: request.invoice,
      memo: request.memo,
    });
    
    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // Return stub result
    const stubResult: X402PaymentResult = {
      success: true,
      txSignature: 'stub_tx_' + Math.random().toString(36).substring(7),
      receiptId: 'x402_receipt_' + Math.random().toString(36).substring(7),
    };
    
    console.log('✅ [x402 Stub] Payment result:', stubResult);
    
    return stubResult;
  }
}

// Singleton instance
export const x402Service = new X402StubService();
