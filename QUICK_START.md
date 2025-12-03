# 🚀 Quick Start Guide - Solana Invoice Platform

Get up and running in 10 minutes!

## Prerequisites

```bash
# Check if you have the tools
anchor --version  # Need 0.30.1+
solana --version  # Need 1.17.0+
node --version    # Need 18.0+
```

Don't have them? See `INVOICE_BUILD_GUIDE.md` for installation.

## 5-Minute Setup

### 1. Build the Program (2 min)

```bash
# Build Anchor program
anchor build

# Get program ID
solana address -k target/deploy/invoice_program-keypair.json

# Copy the output (looks like: Bxyz123...abc789)
```

### 2. Update Program ID (1 min)

Update in **3 places**:

**File 1**: `programs/invoice_program/src/lib.rs`
```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

**File 2**: `Anchor.toml`
```toml
[programs.localnet]
invoice_program = "YOUR_PROGRAM_ID_HERE"
```

**File 3**: Rebuild
```bash
anchor build
```

### 3. Deploy (2 min)

```bash
# Terminal 1: Start validator
solana-test-validator

# Terminal 2: Deploy
solana config set --url localhost
solana airdrop 2
anchor deploy

# Copy IDL files
cp target/idl/invoice_program.json idl/
cp target/idl/invoice_program.json scripts/idl/
cp target/idl/invoice_program.json app/idl/
```

## Try the Scripts (2 min)

```bash
cd scripts
npm install
cp .env.example .env
npm run create:invoice
```

You should see:
```
✅ Invoice Created Successfully!
   Invoice PDA: Def456...
   Mint: Abc123...
```

## Try the UI (3 min)

```bash
cd ../app
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000

1. Click "Select Wallet"
2. Choose your wallet (e.g., Phantom)
3. Create an invoice:
   - Amount: 1.0
   - Days: 7
4. Click "Create Invoice"
5. View on Dashboard

## Common Issues

**"anchor: command not found"**
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1
```

**"Program not deployed"**
```bash
# Make sure validator is running
solana cluster-version

# Redeploy
anchor deploy
```

**"IDL not found"**
```bash
# Copy manually
cp target/idl/invoice_program.json idl/
cp target/idl/invoice_program.json scripts/idl/
cp target/idl/invoice_program.json app/idl/
```

**"Insufficient funds"**
```bash
solana airdrop 2
```

## What's Next?

- Read `invoice-project-README.md` for full documentation
- Check `INVOICE_BUILD_GUIDE.md` for detailed steps
- Review `INVOICE_SECURITY_NOTES.md` before production
- See `INVOICE_FINAL_SUMMARY.md` for complete details

## Quick Commands Reference

```bash
# Build
anchor build

# Deploy
anchor deploy

# Create invoice (CLI)
cd scripts && npm run create:invoice

# Mark paid (CLI)
npm run mark:paid <INVOICE_PDA> <RECEIPT>

# Run UI
cd app && npm run dev

# Test on devnet
solana config set --url devnet
anchor deploy
# Update .env files to use devnet RPC
```

## Architecture at a Glance

```
┌──────────────┐
│   Solana     │  ← Anchor Program (invoice_program)
│  Blockchain  │     - create_invoice
└──────┬───────┘     - mark_invoice_paid
       │
   ┌───┴────┬──────────┐
   │        │          │
┌──▼───┐ ┌─▼───┐  ┌───▼────┐
│ CLI  │ │ UI  │  │ Future │
│Scripts│ │App │  │  APIs  │
└──────┘ └─────┘  └────────┘
```

## File Structure Summary

```
agentburn/
├── programs/invoice_program/  # Anchor program (Rust)
├── scripts/                   # CLI tools (TypeScript)
├── app/                       # Next.js UI (React)
├── idl/                       # IDL files (copy after build)
├── Anchor.toml               # Anchor config
├── Cargo.toml                # Rust workspace
└── [Documentation files]     # 6 guides
```

## Support

- **Build Issues**: See `INVOICE_BUILD_GUIDE.md` troubleshooting section
- **Security**: Read `INVOICE_SECURITY_NOTES.md`
- **Complete Docs**: Start with `invoice-project-README.md`

---

**Time to Hello World**: ~10 minutes

**Status**: ✅ Ready to use

**Version**: 1.0.0 MVP
