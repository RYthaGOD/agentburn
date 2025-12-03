# Solana B2B Invoicing Platform

A B2B invoicing platform on Solana where each invoice is represented as a pNFT (programmable NFT for MVP). The platform uses an Anchor program to track invoices on-chain and supports x402 payment protocol integration.

## Architecture

This project consists of three main components:

1. **Anchor Program** (`programs/invoice_program`) - On-chain invoice tracking
2. **Scripts** (`scripts/`) - CLI tools for invoice creation and management
3. **Next.js dApp** (`app/`) - Web interface for invoice management

```
solana-invoice-mvp/
├── programs/
│   └── invoice_program/       # Anchor program for on-chain invoices
├── scripts/                    # TypeScript utilities for invoice management
├── app/                        # Next.js frontend dApp
├── idl/                        # IDL files copied from program build
├── Anchor.toml                 # Anchor workspace configuration
├── Cargo.toml                  # Rust workspace configuration
└── README.md                   # This file
```

## Features

- 🔐 **On-chain Invoice Tracking** - Each invoice is stored as a PDA on Solana
- 🎨 **pNFT Representation** - Invoices are represented as programmable NFTs
- 💳 **x402 Payment Protocol** - Ready for x402 micropayment integration
- 📊 **Invoice Dashboard** - View all invoices as creator or client
- ✅ **Status Management** - Track invoice status (Unpaid, Paid, Disputed, etc.)
- 💰 **SOL Payments** - MVP supports SOL transfers (ready for USDC/SPL tokens)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Rust** (latest stable)
- **Solana CLI** (v1.17+)
- **Anchor** (v0.30.1)
- **Node.js** (v18+)
- **Yarn** or **npm**

### Installation Commands

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Install Node.js dependencies (in scripts/ and app/ directories)
cd scripts && npm install
cd ../app && npm install
```

## Quick Start

### 1. Build and Deploy the Anchor Program

```bash
# Build the program
anchor build

# Get the program ID
solana address -k target/deploy/invoice_program-keypair.json

# Update the program ID in:
# - Anchor.toml (under [programs.localnet])
# - programs/invoice_program/src/lib.rs (declare_id!)

# Start local validator (in a separate terminal)
solana-test-validator

# Deploy to localnet
anchor deploy

# Copy IDL to required locations
cp target/idl/invoice_program.json idl/
cp target/idl/invoice_program.json scripts/idl/
cp target/idl/invoice_program.json app/idl/
```

### 2. Run Scripts to Create Invoices

```bash
cd scripts

# Create a new invoice
npm run create:invoice

# Mark an invoice as paid (replace with actual invoice PDA)
npm run mark:paid <INVOICE_PDA> <RECEIPT_REFERENCE>
```

### 3. Run the Frontend dApp

```bash
cd app

# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## Usage

### Creating an Invoice

1. Navigate to `http://localhost:3000`
2. Connect your Solana wallet (Phantom, Solflare, etc.)
3. Fill in the invoice form:
   - Amount (in SOL)
   - Due date (days from now)
   - Optional client wallet address
4. Click "Create Invoice"
5. Approve the transaction in your wallet

### Viewing Invoices

1. Navigate to `http://localhost:3000/dashboard`
2. Connect your wallet
3. View invoices where you are:
   - **Creator** (issuer) - Invoices you created
   - **Client** (payer) - Invoices assigned to you

### Paying an Invoice

1. From the dashboard or invoice detail page
2. Click the "Pay" button on an unpaid invoice
3. The system will:
   - Process x402 payment request (stub for MVP)
   - Transfer SOL to the invoice creator
   - Mark the invoice as paid on-chain

## Program Instructions

### `create_invoice`

Creates a new invoice on-chain with associated pNFT.

**Parameters:**
- `amount: u64` - Invoice amount in lamports
- `due_date: i64` - Unix timestamp for due date
- `token_mint: Pubkey` - Token mint for payment (SOL placeholder for MVP)
- `bump: u8` - PDA bump seed

**Accounts:**
- `invoice` - InvoiceAccount PDA (to be created)
- `creator` - Invoice creator (signer)
- `invoice_mint` - NFT mint representing the invoice
- `system_program` - System program

### `mark_invoice_paid`

Marks an invoice as paid and stores payment receipt reference.

**Parameters:**
- `receipt_reference: String` - Payment transaction signature or x402 receipt ID

**Accounts:**
- `invoice` - InvoiceAccount PDA (mut)
- `creator` - Invoice creator (signer)

## Invoice Status Lifecycle

```
Unpaid → PartiallyPaid → Paid
   ↓           ↓           ↓
Canceled   Canceled    (final)
   ↓           ↓
Disputed   Disputed
   ↓
Expired
```

## x402 Integration

The platform is designed to support x402 (HTTP 402 Payment Required) protocol for micropayments. The MVP includes a stub implementation that can be replaced with a real x402 SDK.

See `app/x402-INTEGRATION.md` for details on integrating a real x402 service.

## Development

### Project Structure

#### Anchor Program (`programs/invoice_program`)

- `src/lib.rs` - Main program logic
- Defines `InvoiceAccount` PDA structure
- Implements `create_invoice` and `mark_invoice_paid` instructions
- Validates status transitions and payment requirements

#### Scripts (`scripts/`)

- `src/create_invoice.ts` - Mints pNFT and creates invoice
- `src/mark_invoice_paid.ts` - Updates invoice status on-chain
- `src/env.ts` - Environment configuration

#### Next.js App (`app/`)

- `pages/` - Application routes
- `components/` - Reusable React components
- `lib/solana/` - Solana/Anchor utilities
- `lib/x402/` - x402 payment protocol integration (stub)

### Running Tests

```bash
# Anchor program tests
anchor test

# Scripts tests (if added)
cd scripts && npm test

# Frontend tests (if added)
cd app && npm test
```

## Configuration

### Environment Variables

Create `.env` files in both `scripts/` and `app/` directories:

**scripts/.env**
```
SOLANA_RPC_ENDPOINT=http://127.0.0.1:8899
KEYPAIR_PATH=~/.config/solana/id.json
```

**app/.env.local**
```
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=http://127.0.0.1:8899
```

### Network Configuration

Update `Anchor.toml` to switch between localnet, devnet, and mainnet:

```toml
[provider]
cluster = "localnet"  # or "devnet", "mainnet-beta"
wallet = "~/.config/solana/id.json"
```

## Roadmap

- [x] MVP with SOL payments
- [ ] USDC/SPL token support
- [ ] Real x402 SDK integration
- [ ] Token-2022 programmable NFTs
- [ ] Multi-signature invoices
- [ ] Recurring invoices
- [ ] Invoice templates
- [ ] Organization/workspace model
- [ ] Role-based access control
- [ ] Invoice dispute resolution
- [ ] Automated reminders
- [ ] Analytics dashboard

## Security Considerations

- 🔐 All transactions require wallet signature
- ✅ Status transitions are validated on-chain
- 🔍 Payment receipts are stored immutably
- ⚠️ Always verify recipient addresses before payment
- 🛡️ Use hardware wallets for production

## Troubleshooting

### Program deployment fails

```bash
# Ensure local validator is running
solana-test-validator

# Check wallet has sufficient SOL
solana balance

# Request airdrop if needed (localnet/devnet only)
solana airdrop 2
```

### Scripts can't find IDL

```bash
# Ensure IDL is copied after build
cp target/idl/invoice_program.json scripts/idl/
```

### Frontend wallet won't connect

- Ensure you have a Solana wallet extension installed (Phantom, Solflare)
- Check that the wallet is set to the correct network (localnet/devnet)
- Clear browser cache and reload

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Make your changes with clear commit messages
4. Test thoroughly (program, scripts, frontend)
5. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For questions or issues:
- Open a GitHub issue
- Join our Discord community (coming soon)
- Check the documentation in each component's directory

---

**Built with ❤️ for the Solana ecosystem**
