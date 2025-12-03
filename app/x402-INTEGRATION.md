# x402 Integration Guide

This document explains how to integrate a real x402 SDK in place of the stub implementation.

## Current Implementation (Stub)

The MVP uses a stub implementation of the x402 payment protocol located in:
- `src/lib/x402/types.ts` - Type definitions
- `src/lib/x402/x402Stub.ts` - Stub service implementation
- `src/lib/x402/useX402.ts` - React hook

The stub logs payment requests and returns fake transaction signatures and receipt IDs.

## Integrating Real x402 SDK

To integrate a real x402 SDK, follow these steps:

### 1. Install x402 SDK

```bash
npm install @x402/sdk
# or
yarn add @x402/sdk
```

### 2. Create Real x402 Service

Create a new file `src/lib/x402/x402Real.ts`:

```typescript
import { IX402Service, X402PaymentRequest, X402PaymentResult } from './types';
import { X402Client } from '@x402/sdk'; // Replace with actual SDK import

class X402RealService implements IX402Service {
  private client: X402Client;

  constructor() {
    this.client = new X402Client({
      network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
      apiKey: process.env.NEXT_PUBLIC_X402_API_KEY,
    });
  }

  async payInvoice(request: X402PaymentRequest): Promise<X402PaymentResult> {
    try {
      // Use real x402 SDK to create payment
      const payment = await this.client.createPayment({
        recipient: request.payee,
        sender: request.payer,
        amount: request.amount,
        token: request.token?.mint,
        metadata: {
          invoicePda: request.invoice?.invoicePda,
          invoiceMint: request.invoice?.invoiceMint,
          memo: request.memo,
        },
      });

      return {
        success: true,
        txSignature: payment.signature,
        receiptId: payment.receiptId,
      };
    } catch (error: any) {
      console.error('x402 payment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const x402Service = new X402RealService();
```

### 3. Update the Hook

Modify `src/lib/x402/useX402.ts` to use the real service:

```typescript
import { useMemo } from 'react';
// Change this import:
// import { x402Service } from './x402Stub';
import { x402Service } from './x402Real';
import { IX402Service } from './types';

export const useX402 = (): IX402Service => {
  return useMemo(() => x402Service, []);
};
```

### 4. Add Environment Variables

Add to your `.env.local`:

```bash
NEXT_PUBLIC_X402_API_KEY=your_x402_api_key
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

### 5. Update Types (if needed)

If the real x402 SDK has different types, update `src/lib/x402/types.ts` to match the SDK's interface while maintaining the `IX402Service` interface contract.

## x402 Protocol Overview

The x402 protocol (HTTP 402 Payment Required) enables micropayments for web services:

1. **Service Request** - Client requests a service (e.g., mark invoice as paid)
2. **Payment Required** - Service returns HTTP 402 with payment details
3. **Payment Execution** - Client executes payment via x402 SDK
4. **Receipt Verification** - Service verifies payment and processes request
5. **Service Delivery** - Service completes the original request

## Integration with Invoice Payment Flow

The current payment flow in `PaymentButton.tsx`:

1. User clicks "Pay Invoice"
2. x402 stub is called (logs the request)
3. SOL transfer transaction is created
4. After transfer, invoice is marked as paid on-chain

With real x402 integration:

1. User clicks "Pay Invoice"
2. x402 SDK creates payment request
3. x402 SDK handles payment execution (SOL/USDC transfer)
4. x402 returns verified receipt
5. Invoice is marked as paid with x402 receipt reference

## Testing

To test the integration:

1. Deploy to a test environment (devnet/testnet)
2. Connect a wallet with test tokens
3. Create an invoice
4. Pay the invoice using x402
5. Verify the payment signature and receipt on-chain

## References

- x402 Protocol: https://payai.com/x402
- x402 SDK Documentation: [Replace with actual SDK docs]
- Solana Web3.js: https://solana-labs.github.io/solana-web3.js/

## Troubleshooting

### Payment Fails

- Check API key is valid
- Verify wallet has sufficient balance
- Check network configuration (localnet/devnet/mainnet)
- Review x402 SDK logs for errors

### Receipt Verification Fails

- Ensure receipt ID format matches on-chain storage
- Check that receipt reference is passed correctly to `mark_invoice_paid`
- Verify the on-chain program accepts the receipt format

### Network Mismatch

- Ensure all components use the same network (localnet/devnet/mainnet)
- Check RPC endpoint configuration
- Verify program deployment on the correct network
