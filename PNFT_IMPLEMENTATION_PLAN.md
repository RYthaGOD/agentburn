# pNFT System Implementation Plan for B2B Invoicing

**Date**: December 5, 2025  
**Requirement**: Programmable NFT system for invoicers and invoicees  
**Current System**: B2B invoicing with Arcium encryption, Solana blockchain

---

## 🎯 Executive Summary

Implementing pNFTs (Programmable NFTs) for the invoicing system will enable:
- **Invoice NFTs**: Each invoice becomes a tradeable, verifiable NFT
- **Payment Proof NFTs**: Payment receipts as NFTs for tax/audit purposes
- **Identity NFTs**: Business profiles as verified credentials
- **Access Control**: NFT-gated invoice viewing and decryption
- **Invoice Financing**: NFTs can be sold/traded before payment

**Recommended Approach**: Metaplex Bubblegum (compressed NFTs) for scalability and low cost

---

## 📊 Use Cases Analysis

### Primary Use Cases

#### 1. Invoice as NFT ✨
**Purpose**: Each invoice becomes a unique, tradeable NFT

**Benefits**:
- Verifiable on-chain proof of invoice
- Can be transferred/sold (invoice financing)
- Immutable record keeping
- NFT metadata shows invoice status
- Easy audit trail

**Implementation**:
```typescript
Invoice NFT = {
  name: "Invoice #ACME-2025-001",
  symbol: "INV",
  uri: "https://api.solanainvoice.com/metadata/inv-123",
  attributes: {
    invoiceNumber: "ACME-2025-001",
    amount: "encrypted",
    currency: "USDC",
    status: "pending",
    dueDate: "2025-01-15",
    issuer: "invoicerWallet",
    recipient: "invoiceeWallet"
  },
  programmable: {
    transferRule: "onlyWhenPaid", // Can't transfer unpaid invoices
    updateRule: "ownerOnly"
  }
}
```

#### 2. Payment Receipt NFT 💳
**Purpose**: Proof of payment for tax/audit

**Benefits**:
- Immutable payment proof
- Tax deduction documentation
- Audit trail for businesses
- Can't be forged or altered

**Implementation**:
```typescript
Payment Receipt NFT = {
  name: "Payment Receipt #PMT-001",
  symbol: "RCPT",
  uri: "https://api.solanainvoice.com/metadata/pmt-123",
  attributes: {
    invoiceNumber: "ACME-2025-001",
    amount: "1000 USDC",
    paidBy: "invoiceeWallet",
    paidTo: "invoicerWallet",
    txSignature: "solana_tx_hash",
    paidAt: "2025-01-10",
    taxYear: "2025"
  }
}
```

#### 3. Business Identity NFT 🏢
**Purpose**: Verified business credentials

**Benefits**:
- KYB (Know Your Business) verification
- Trust signals for new customers
- Reduced fraud
- Professional credibility

**Implementation**:
```typescript
Business Identity NFT = {
  name: "ACME Corp - Verified Business",
  symbol: "BIZ",
  uri: "https://api.solanainvoice.com/metadata/biz-123",
  attributes: {
    businessName: "ACME Corp",
    taxId: "encrypted",
    verified: true,
    verifiedAt: "2025-01-01",
    industry: "SaaS",
    totalInvoices: 150,
    totalRevenue: "encrypted",
    rating: 4.8
  }
}
```

#### 4. Customer Loyalty NFT 🎁
**Purpose**: Rewards for prompt payments

**Benefits**:
- Incentivize early payment
- Build customer loyalty
- Gamification
- Fee discounts

**Implementation**:
```typescript
Loyalty NFT = {
  name: "Gold Customer - ACME Corp",
  symbol: "LOYAL",
  tier: "gold", // bronze, silver, gold, platinum
  benefits: {
    feeDiscount: "50%", // 50% off service fees
    prioritySupport: true,
    earlyPaymentBonus: "2%" // 2% cashback on early payments
  },
  requirements: {
    minInvoicesPaid: 50,
    onTimePaymentRate: 95,
    averagePaymentDays: 15
  }
}
```

---

## 🏗️ Architecture Options

### Option 1: Metaplex Bubblegum (Compressed NFTs) ⭐ RECOMMENDED

**Why This is Best**:
- **Cost**: $0.001 per NFT (vs $0.02 for regular NFTs)
- **Scalability**: Millions of invoices = thousands of dollars (not millions)
- **Speed**: Fast minting and transfers
- **Storage**: Merkle tree compression on-chain
- **Proven**: Battle-tested by major projects

**Cost Comparison** (1000 invoices/month):
- Regular NFTs: ~$20/month
- Compressed NFTs: ~$1/month
- **Savings**: 95% cheaper

**Implementation Complexity**: Medium (well-documented SDK)

**Tech Stack**:
```bash
npm install @metaplex-foundation/mpl-bubblegum
npm install @metaplex-foundation/mpl-token-metadata
npm install @solana/spl-account-compression
```

**Architecture**:
```
Invoice Created → Mint Compressed NFT → Store in Merkle Tree
                ↓
            Update Metadata (status changes)
                ↓
            Transfer NFT (invoice financing)
                ↓
            Burn NFT (invoice paid/cancelled)
```

### Option 2: Metaplex Standard NFTs

**Why Consider**:
- Simpler implementation
- More tooling support
- Better wallet compatibility
- No compression complexity

**Drawbacks**:
- 20x more expensive ($0.02 per NFT)
- Not scalable for high-volume invoicing
- Storage costs add up quickly

**Cost**: $20/month for 1000 invoices

### Option 3: Custom SPL Token + Metadata

**Why Consider**:
- Full control over implementation
- Custom logic possible
- No external dependencies

**Drawbacks**:
- Complex to build from scratch
- Security risks if not done correctly
- No standard wallet support
- Reinventing the wheel

**Cost**: Development time + maintenance

---

## 💡 Recommended Implementation: Bubblegum Compressed NFTs

### Phase 1: Invoice NFTs (Week 1-2)

#### 1.1 Add NFT Fields to Database Schema

```typescript
// Update shared/invoice-schema.ts
export const invoices = pgTable("invoices", {
  // ... existing fields ...
  
  // NFT Integration
  nftMint: text("nft_mint"), // NFT mint address
  nftMerkleTree: text("nft_merkle_tree"), // Merkle tree address
  nftLeafIndex: integer("nft_leaf_index"), // Position in tree
  nftCreatedAt: timestamp("nft_created_at"),
  nftTransferredTo: text("nft_transferred_to"), // For invoice financing
  nftBurnedAt: timestamp("nft_burned_at"), // When paid/cancelled
});
```

#### 1.2 Create NFT Service

```typescript
// server/nft-service.ts
import { Metaplex } from "@metaplex-foundation/js";
import { createTree } from "@metaplex-foundation/mpl-bubblegum";

export class InvoiceNFTService {
  // Mint invoice as compressed NFT
  async mintInvoiceNFT(invoice: Invoice): Promise<string> {
    // 1. Create metadata
    const metadata = {
      name: `Invoice ${invoice.invoiceNumber}`,
      symbol: "INV",
      uri: `${process.env.API_URL}/nft-metadata/invoice/${invoice.id}`,
      sellerFeeBasisPoints: 0,
      creators: [
        {
          address: invoice.invoicerWalletAddress,
          verified: true,
          share: 100
        }
      ],
      collection: null,
      uses: null
    };
    
    // 2. Mint compressed NFT
    const { mint } = await createCompressedNFT({
      metadata,
      owner: invoice.invoicerWalletAddress,
      merkleTree: this.getMerkleTree()
    });
    
    return mint.toString();
  }
  
  // Update NFT when invoice status changes
  async updateInvoiceNFT(invoice: Invoice): Promise<void> {
    // Update metadata URI to reflect new status
    await updateCompressedNFT({
      mint: invoice.nftMint,
      uri: `${process.env.API_URL}/nft-metadata/invoice/${invoice.id}`
    });
  }
  
  // Transfer NFT (invoice financing)
  async transferInvoiceNFT(
    invoice: Invoice, 
    newOwner: string
  ): Promise<void> {
    await transferCompressedNFT({
      mint: invoice.nftMint,
      from: invoice.invoicerWalletAddress,
      to: newOwner
    });
  }
  
  // Burn NFT when invoice is paid
  async burnInvoiceNFT(invoice: Invoice): Promise<void> {
    await burnCompressedNFT({
      mint: invoice.nftMint
    });
  }
}
```

#### 1.3 Add NFT Metadata Endpoint

```typescript
// server/invoice-routes.ts

// Get NFT metadata for invoice
app.get("/nft-metadata/invoice/:id", async (req, res) => {
  const { id } = req.params;
  const invoice = await invoiceStorage.getInvoice(id);
  
  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }
  
  // Return NFT-compatible metadata
  res.json({
    name: `Invoice ${invoice.invoiceNumber}`,
    symbol: "INV",
    description: `Invoice from ${invoice.invoicerWalletAddress} to ${invoice.invoiceeWalletAddress}`,
    image: `${process.env.API_URL}/images/invoice-nft.png`,
    external_url: `${process.env.APP_URL}/invoices/${id}`,
    attributes: [
      {
        trait_type: "Invoice Number",
        value: invoice.invoiceNumber
      },
      {
        trait_type: "Status",
        value: invoice.status
      },
      {
        trait_type: "Currency",
        value: invoice.currency
      },
      {
        trait_type: "Amount",
        value: invoice.isArciumEncrypted ? "Encrypted" : invoice.totalAmount,
        display_type: invoice.isArciumEncrypted ? null : "number"
      },
      {
        trait_type: "Due Date",
        value: invoice.dueDate.toISOString(),
        display_type: "date"
      },
      {
        trait_type: "Issuer",
        value: invoice.invoicerWalletAddress
      },
      {
        trait_type: "Recipient",
        value: invoice.invoiceeWalletAddress
      }
    ],
    properties: {
      category: "invoice",
      creators: [
        {
          address: invoice.invoicerWalletAddress,
          share: 100
        }
      ]
    }
  });
});
```

#### 1.4 Integrate with Invoice Creation

```typescript
// server/invoice-routes.ts - Update create invoice endpoint

app.post("/api/invoices", async (req, res) => {
  // ... existing validation ...
  
  // Create invoice
  const invoice = await invoiceStorage.createInvoice(validatedData);
  
  // Mint NFT if requested
  if (req.body.mintNFT !== false) { // Default to true
    try {
      const nftService = new InvoiceNFTService();
      const nftMint = await nftService.mintInvoiceNFT(invoice);
      
      // Update invoice with NFT info
      await invoiceStorage.updateInvoice(invoice.id, {
        nftMint,
        nftCreatedAt: new Date()
      });
      
      invoice.nftMint = nftMint;
    } catch (error) {
      console.error("Failed to mint invoice NFT:", error);
      // Continue without NFT - non-blocking
    }
  }
  
  res.status(201).json({ invoice });
});
```

### Phase 2: Payment Receipt NFTs (Week 3)

```typescript
// Mint receipt NFT when payment is recorded
app.post("/api/payments", async (req, res) => {
  // ... existing code ...
  
  const payment = await invoiceStorage.createPayment(validatedData);
  
  // Mint payment receipt NFT
  const nftService = new InvoiceNFTService();
  const receiptNFT = await nftService.mintPaymentReceiptNFT(payment, invoice);
  
  res.status(201).json({ payment, receiptNFT });
});
```

### Phase 3: Business Identity NFTs (Week 4)

```typescript
// Mint business verification NFT
app.post("/api/business/mint-identity-nft", async (req, res) => {
  const profile = await invoiceStorage.getBusinessProfile(req.body.wallet);
  
  // Verify business (would integrate with KYB provider)
  const verified = await verifyBusiness(profile);
  
  if (verified) {
    const nftService = new InvoiceNFTService();
    const identityNFT = await nftService.mintBusinessIdentityNFT(profile);
    
    res.json({ identityNFT });
  }
});
```

### Phase 4: Invoice Financing (Week 5-6)

```typescript
// Create marketplace for selling invoices
app.post("/api/invoices/:id/list-for-sale", async (req, res) => {
  const { id } = req.params;
  const { price } = req.body; // Discount rate (e.g., 95% of face value)
  
  const invoice = await invoiceStorage.getInvoice(id);
  
  // Transfer NFT to escrow
  const nftService = new InvoiceNFTService();
  await nftService.transferToEscrow(invoice.nftMint);
  
  // List on marketplace
  await marketplaceStorage.createListing({
    invoiceId: id,
    nftMint: invoice.nftMint,
    faceValue: invoice.totalAmount,
    askingPrice: price,
    seller: invoice.invoicerWalletAddress
  });
  
  res.json({ listed: true });
});

// Buy invoice from marketplace
app.post("/api/marketplace/buy/:listingId", async (req, res) => {
  const listing = await marketplaceStorage.getListing(req.params.listingId);
  
  // Transfer payment to seller
  // Transfer NFT to buyer
  // Buyer now owns the invoice and will receive payment when customer pays
  
  res.json({ purchased: true });
});
```

---

## 📐 Database Schema Changes

### Add NFT Tables

```typescript
// shared/invoice-schema.ts

export const invoiceNFTs = pgTable("invoice_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  mint: text("mint").notNull().unique(),
  merkleTree: text("merkle_tree").notNull(),
  leafIndex: integer("leaf_index").notNull(),
  currentOwner: text("current_owner").notNull(),
  metadataUri: text("metadata_uri").notNull(),
  status: text("status").notNull().default("active"), // active, transferred, burned
  mintedAt: timestamp("minted_at").notNull().defaultNow(),
  burnedAt: timestamp("burned_at"),
});

export const paymentReceiptNFTs = pgTable("payment_receipt_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paymentId: varchar("payment_id").notNull().references(() => payments.id),
  mint: text("mint").notNull().unique(),
  owner: text("owner").notNull(), // Payment recipient
  metadataUri: text("metadata_uri").notNull(),
  mintedAt: timestamp("minted_at").notNull().defaultNow(),
});

export const businessIdentityNFTs = pgTable("business_identity_nfts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessProfileId: varchar("business_profile_id").notNull()
    .references(() => businessProfiles.id),
  mint: text("mint").notNull().unique(),
  verificationLevel: text("verification_level").notNull(), // basic, verified, premium
  verifiedBy: text("verified_by"), // KYB provider
  mintedAt: timestamp("minted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Identity NFTs can expire
});

export const invoiceMarketplace = pgTable("invoice_marketplace", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  nftMint: text("nft_mint").notNull(),
  seller: text("seller").notNull(),
  faceValue: decimal("face_value", { precision: 18, scale: 9 }).notNull(),
  askingPrice: decimal("asking_price", { precision: 18, scale: 9 }).notNull(),
  discountRate: decimal("discount_rate", { precision: 5, scale: 2 }).notNull(), // %
  status: text("status").notNull().default("active"), // active, sold, cancelled
  listedAt: timestamp("listed_at").notNull().defaultNow(),
  soldAt: timestamp("sold_at"),
  soldTo: text("sold_to"),
});
```

---

## 💰 Cost Analysis

### Setup Costs (One-time)
- Merkle Tree Creation: ~$0.50 per tree (supports 1M+ NFTs)
- Initial Development: ~40 hours

### Operational Costs (per month, 1000 invoices)
- Invoice NFTs: $1.00 (1000 × $0.001)
- Payment Receipt NFTs: $1.00 (1000 × $0.001)
- Metadata Storage: $5.00 (S3 or equivalent)
- **Total**: ~$7/month

### Revenue Opportunities
- Invoice Financing Fees: 2-5% of invoice value
- Business Verification: $50-100 one-time fee
- Premium Features: $10-50/month
- Marketplace Fees: 1% of sales

---

## 🎨 UI/UX Changes

### Invoice Detail Page
```
┌─────────────────────────────────────┐
│ Invoice #ACME-2025-001      [NFT 🎨]│
│                                     │
│ Status: Pending                     │
│ Amount: $1,000 USDC                 │
│                                     │
│ [View on Solana Explorer]           │
│ [Transfer Invoice NFT]              │
│ [List on Marketplace]               │
└─────────────────────────────────────┘
```

### NFT Gallery (New Page)
```
┌─────────────────────────────────────┐
│ My Invoice NFTs                     │
│                                     │
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │INV  │ │INV  │ │INV  │            │
│ │#001 │ │#002 │ │#003 │            │
│ └─────┘ └─────┘ └─────┘            │
│                                     │
│ My Payment Receipts                 │
│ ┌─────┐ ┌─────┐                    │
│ │RCPT │ │RCPT │                    │
│ │#001 │ │#002 │                    │
│ └─────┘ └─────┘                    │
└─────────────────────────────────────┘
```

---

## 🔐 Security Considerations

### 1. NFT Transfer Rules
- Only allow transfer if invoice is paid or explicitly listed
- Prevent transfer of overdue invoices (configurable)
- Require signature verification

### 2. Metadata Privacy
- Don't expose sensitive amounts in public metadata
- Use "Encrypted" placeholder for Arcium-encrypted invoices
- Only show full details to NFT owner

### 3. Marketplace Safety
- Escrow system for NFT sales
- Dispute resolution process
- Buyer protection

---

## 🚀 Implementation Timeline

### Week 1-2: Foundation
- [ ] Install Metaplex dependencies
- [ ] Create NFT service
- [ ] Add database schema
- [ ] Implement invoice NFT minting
- [ ] Test on devnet

### Week 3: Payment Receipts
- [ ] Implement receipt NFT minting
- [ ] Auto-mint on payment
- [ ] Create receipt gallery UI

### Week 4: Business Identity
- [ ] KYB integration
- [ ] Business NFT minting
- [ ] Verification UI

### Week 5-6: Marketplace
- [ ] Build marketplace contracts
- [ ] Create listing UI
- [ ] Implement buy/sell flow
- [ ] Add escrow system

### Week 7-8: Polish
- [ ] NFT gallery UI
- [ ] Explorer integration
- [ ] Mobile wallet support
- [ ] Documentation

**Total Time**: 8 weeks (2 months)

---

## 📊 Success Metrics

### Phase 1 (Month 1)
- [ ] 100% of invoices minted as NFTs
- [ ] <$0.002 cost per NFT
- [ ] 99% minting success rate

### Phase 2 (Month 2)
- [ ] 50% of businesses have identity NFT
- [ ] 10+ invoices listed on marketplace
- [ ] $10K+ in invoice financing volume

### Phase 3 (Month 3)
- [ ] 1000+ active invoice NFTs
- [ ] 500+ payment receipt NFTs
- [ ] 100+ verified businesses

---

## 🎯 Recommended Decision

**✅ Proceed with Metaplex Bubblegum Compressed NFTs**

**Why**:
1. **Cost-Effective**: 95% cheaper than standard NFTs
2. **Scalable**: Handle millions of invoices
3. **Battle-Tested**: Used by major projects
4. **Future-Proof**: Supports all planned features
5. **Fast Implementation**: 2-3 weeks for MVP

**Next Steps**:
1. Approve this plan
2. Install dependencies
3. Start Phase 1 implementation
4. MVP in 2-3 weeks

---

## 📞 Questions to Answer

Before implementation, clarify:

1. **Primary Use Case**: Which feature is most important?
   - Invoice NFTs?
   - Payment receipts?
   - Business identity?
   - Invoice financing?

2. **NFT Minting**: Auto-mint for all invoices or opt-in?

3. **Marketplace**: Build custom or integrate existing (e.g., Magic Eden)?

4. **Pricing**: How to monetize NFT features?

5. **Timeline**: Need MVP in 2 weeks or full implementation in 2 months?

---

**Status**: ⏳ **Awaiting Approval to Proceed**  
**Estimated MVP**: 2-3 weeks  
**Estimated Full System**: 8 weeks  
**Recommended Approach**: Metaplex Bubblegum Compressed NFTs
