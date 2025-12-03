# Invoice Platform - Build & Deployment Guide

This guide walks you through building, deploying, and testing the Solana B2B Invoicing Platform.

## Prerequisites

Ensure you have the following installed:

```bash
# Check versions
anchor --version    # Should be 0.30.1 or higher
solana --version    # Should be 1.17.0 or higher
node --version      # Should be 18.0.0 or higher
```

### Install Prerequisites (if needed)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.30.1
avm use 0.30.1

# Verify installations
anchor --version
solana --version
```

## Step 1: Build the Anchor Program

```bash
# Navigate to project root
cd /path/to/agentburn

# Build the invoice_program
anchor build

# This will:
# - Compile the Rust program
# - Generate the program keypair
# - Create the IDL in target/idl/
```

**Expected output:**
```
   Compiling invoice_program v0.1.0
    Finished release [optimized] target(s) in X.XXs
```

## Step 2: Get Program ID

After building, get your program's public key:

```bash
solana address -k target/deploy/invoice_program-keypair.json
```

**Example output:**
```
Bxyz123...abc789
```

## Step 3: Update Program ID

Update the program ID in three locations:

### 3a. Update `programs/invoice_program/src/lib.rs`

```rust
declare_id!("YOUR_PROGRAM_ID_HERE");
```

### 3b. Update `Anchor.toml`

```toml
[programs.localnet]
invoice_program = "YOUR_PROGRAM_ID_HERE"
```

### 3c. Rebuild after updating

```bash
anchor build
```

## Step 4: Deploy to Localnet

### 4a. Start local validator

In a **separate terminal**:

```bash
solana-test-validator
```

**Keep this running!** It should show:
```
Ledger location: test-ledger
Listening on http://127.0.0.1:8899
...
```

### 4b. Configure Solana CLI

In your main terminal:

```bash
# Set to localnet
solana config set --url localhost

# Check balance
solana balance

# If balance is 0, airdrop some SOL
solana airdrop 2
```

### 4c. Deploy the program

```bash
anchor deploy
```

**Expected output:**
```
Deploying cluster: http://127.0.0.1:8899
Upgrade authority: ~/.config/solana/id.json
Deploying program "invoice_program"...
Program Id: Bxyz123...abc789

Deploy success
```

## Step 5: Copy IDL Files

After successful deployment, copy the IDL to all required locations:

```bash
# From project root
cp target/idl/invoice_program.json idl/
cp target/idl/invoice_program.json scripts/idl/
cp target/idl/invoice_program.json app/idl/
```

Verify the files exist:

```bash
ls -la idl/invoice_program.json
ls -la scripts/idl/invoice_program.json
ls -la app/idl/invoice_program.json
```

## Step 6: Test Scripts

### 6a. Install dependencies

```bash
cd scripts
npm install
```

### 6b. Configure environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env if needed (defaults should work for localnet)
cat .env
```

Should contain:
```
SOLANA_RPC_ENDPOINT=http://127.0.0.1:8899
KEYPAIR_PATH=~/.config/solana/id.json
```

### 6c. Create an invoice

```bash
npm run create:invoice
```

**Expected output:**
```
🚀 Creating Invoice...

📋 Configuration:
   RPC Endpoint: http://127.0.0.1:8899
   Wallet: 7xK...3mN
   Balance: 2.0 SOL

🎨 Minting invoice NFT...
✅ Invoice NFT Mint: Abc123...xyz789

📋 Invoice PDA: Def456...uvw012
   Bump: 255

💰 Invoice Details:
   Amount: 1.0 SOL
   Due Date: 2024-01-15T12:00:00.000Z
   Token Mint: 11111111111111111111111111111111 (SOL placeholder)

✅ Transaction Signature: 5k3...d8j

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Invoice Created Successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Invoice Information:
   Invoice PDA: Def456...uvw012
   Invoice Mint: Abc123...xyz789
   Creator: 7xK...3mN
   Amount: 1.0 SOL
   Status: Unpaid

💡 To mark this invoice as paid, run:
   npm run mark:paid Def456...uvw012 <receipt_reference>
```

**Copy the Invoice PDA for the next step!**

### 6d. Mark invoice as paid

```bash
# Replace with your actual Invoice PDA and any receipt reference
npm run mark:paid Def456...uvw012 payment-sig-123abc
```

**Expected output:**
```
🔄 Marking Invoice as Paid...

📋 Configuration:
   RPC Endpoint: http://127.0.0.1:8899
   Wallet: 7xK...3mN
   Invoice PDA: Def456...uvw012
   Receipt: payment-sig-123abc

🔍 Fetching invoice state...
   Current Status: Unpaid
   Amount: 1000000000 lamports
   Creator: 7xK...3mN

✅ Transaction Signature: 2hB...9pL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Invoice Marked as Paid!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Updated Invoice:
   Status: Paid
   Receipt: payment-sig-123abc
```

## Step 7: Run the Next.js App

### 7a. Install dependencies

```bash
cd ../app
npm install
```

### 7b. Configure environment

```bash
# Copy example env file
cp .env.example .env.local

# Edit if needed (defaults work for localnet)
cat .env.local
```

Should contain:
```
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=http://127.0.0.1:8899
```

### 7c. Start development server

```bash
npm run dev
```

**Expected output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
...
```

### 7d. Open in browser

Navigate to: **http://localhost:3000**

You should see:
- Header with "Solana Invoice MVP"
- Wallet connection button in top right
- Invoice creation form
- Links to dashboard

## Step 8: Test the Full Flow in UI

### 8a. Connect your wallet

1. Click "Select Wallet" button
2. Choose Phantom (or your preferred wallet)
3. Approve the connection
4. Your wallet address should appear in the button

### 8b. Create an invoice

1. Fill in the form:
   - Amount: `0.5` (or any amount)
   - Days Until Due: `7`
   - Client Wallet: (optional, leave empty for now)
2. Click "Create Invoice"
3. Approve the transaction in your wallet
4. You should see a success message with:
   - Invoice PDA
   - Invoice Mint
   - Transaction signature

### 8c. View dashboard

1. Click "View Dashboard" link
2. You should see your newly created invoice listed with:
   - Amount and status
   - Invoice PDA (truncated)
   - Due date
   - Your role as "Issuer"
   - "Awaiting payment" message

### 8d. Pay an invoice (optional - requires two wallets)

To test payment:
1. Switch to a different wallet in your extension
2. Refresh the dashboard
3. Find an unpaid invoice where you're not the creator
4. Click "Pay X SOL" button
5. Approve the transaction
6. The invoice status should update to "Paid"

## Troubleshooting

### Program deployment fails

```bash
# Check validator is running
solana cluster-version

# Check wallet balance
solana balance

# If balance is 0
solana airdrop 2

# Try deploying again
anchor deploy
```

### "Program not found" error

- Ensure you updated the program ID in all locations
- Rebuild: `anchor build`
- Redeploy: `anchor deploy`

### IDL not found in scripts/app

```bash
# Copy IDL manually
cp target/idl/invoice_program.json idl/
cp target/idl/invoice_program.json scripts/idl/
cp target/idl/invoice_program.json app/idl/
```

### Next.js build errors

```bash
# Clear Next.js cache
cd app
rm -rf .next
npm run dev
```

### Wallet connection issues

- Ensure you have a Solana wallet extension installed (Phantom)
- Check that wallet is set to Localnet/Localhost
- Try refreshing the page
- Check browser console for errors

### Transaction fails

- Check wallet has sufficient SOL balance
- Verify localnet validator is still running
- Check program is deployed: `solana program show <PROGRAM_ID>`

## Network Configuration

### Switch to Devnet

```bash
# Update Anchor.toml
[provider]
cluster = "devnet"

# Configure Solana CLI
solana config set --url devnet

# Airdrop devnet SOL
solana airdrop 2 --url devnet

# Deploy
anchor deploy

# Update .env files to use devnet
# scripts/.env
SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com

# app/.env.local
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Switch to Mainnet (Production)

⚠️ **Use with caution!** Mainnet transactions cost real SOL.

```bash
# Update Anchor.toml
[provider]
cluster = "mainnet-beta"

# Configure Solana CLI
solana config set --url mainnet-beta

# Deploy (costs real SOL!)
anchor deploy

# Update .env files to use mainnet
# scripts/.env
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# app/.env.local
NEXT_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com
```

## Additional Resources

- **Anchor Documentation**: https://www.anchor-lang.com/
- **Solana Documentation**: https://docs.solana.com/
- **Solana Cookbook**: https://solanacookbook.com/
- **Web3.js Documentation**: https://solana-labs.github.io/solana-web3.js/

## Next Steps

- [ ] Add full pNFT metadata using mpl-token-metadata
- [ ] Implement Token-2022 programmable NFTs
- [ ] Integrate real x402 SDK
- [ ] Add USDC/SPL token payment support
- [ ] Build organization/workspace features
- [ ] Add invoice templates
- [ ] Implement recurring invoices
- [ ] Add dispute resolution flow
