#!/bin/bash

###############################################################################
# GigaBrain Deployment Script - Devnet
# Builds and deploys the Anchor program to Solana devnet
###############################################################################

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 GigaBrain Deployment - Devnet"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check prerequisites
echo ""
echo "📋 Checking prerequisites..."

if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor not found. Install with: cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    exit 1
fi

if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI not found. Install from: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

echo "✅ Anchor $(anchor --version)"
echo "✅ Solana $(solana --version)"

# Configure for devnet
echo ""
echo "🔧 Configuring Solana CLI for devnet..."
solana config set --url https://api.devnet.solana.com

# Check/request airdrop
echo ""
echo "💰 Checking SOL balance..."
BALANCE=$(solana balance | awk '{print $1}')
if (( $(echo "$BALANCE < 2" | bc -l) )); then
    echo "⚠️  Low balance: $BALANCE SOL"
    echo "   Requesting airdrop..."
    solana airdrop 2
    sleep 5
fi

# Build program
echo ""
echo "🔨 Building Anchor program..."
anchor build

# Get program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/gigabrain_burn-keypair.json)
echo ""
echo "📝 Program ID: $PROGRAM_ID"

# Update Anchor.toml and lib.rs with actual program ID
echo ""
echo "📝 Updating program ID in Anchor.toml and lib.rs..."
sed -i.bak "s/PLACEHOLDER_PROGRAM_ID_REPLACE_AFTER_DEPLOY/$PROGRAM_ID/g" Anchor.toml
sed -i.bak "s/PLACEHOLDER_PROGRAM_ID_REPLACE_AFTER_DEPLOY/$PROGRAM_ID/g" programs/gigabrain-burn/src/lib.rs

# Rebuild with correct program ID
echo ""
echo "🔨 Rebuilding with correct program ID..."
anchor build

# Deploy
echo ""
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Deployment Info:"
echo "   Network: Devnet"
echo "   Program ID: $PROGRAM_ID"
echo "   Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"
echo ""
echo "💡 Next Steps:"
echo "   1. Update scripts/x402-agent.js with PROGRAM_ID=$PROGRAM_ID"
echo "   2. Run: export PROGRAM_ID=$PROGRAM_ID"
echo "   3. Test: node scripts/x402-agent.js"
echo ""
