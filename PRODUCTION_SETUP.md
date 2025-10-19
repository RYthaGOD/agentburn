# BurnBot Production Setup Guide

## 🔐 Private Key Configuration

BurnBot is now **PRODUCTION-READY**! To enable automatic buyback execution, you need to configure private keys for each project.

### Environment Variables

For each project, set two environment variables in your Replit Secrets:

1. **Treasury Wallet Private Key** (Required for swaps and burns)
   ```
   TREASURY_KEY_<PROJECT_ID> = <base58-encoded-private-key>
   ```

2. **PumpFun Creator Private Key** (Optional, only for PumpFun tokens)
   ```
   PUMPFUN_CREATOR_KEY_<PROJECT_ID> = <base58-encoded-private-key>
   ```

### How to Get Your Project ID

1. Create a project in the BurnBot dashboard
2. View the project in your database or check the URL when viewing the project
3. The project ID is a UUID like: `550e8400-e29b-41d4-a716-446655440000`

### How to Get Base58 Private Key

#### From Phantom Wallet:
1. Open Phantom wallet
2. Go to Settings → Security & Privacy
3. Click "Export Private Key"
4. Copy the base58 string (starts with a number or letter, ~88 characters)

#### From Solflare Wallet:
1. Open Solflare wallet
2. Click the menu → Settings
3. Select "Export Private Key"
4. Copy the base58 string

#### From Keypair File (if you generated it programmatically):
```bash
# If you have a JSON keypair file
cat keypair.json | jq -r '.[:32]' | base58
```

### Example Configuration

Let's say you create a project with ID: `abc123-def456-789`

**For a regular token:**
```
TREASURY_KEY_abc123-def456-789 = 5J7WzMq8hN3pR2... (your treasury private key)
```

**For a PumpFun token:**
```
TREASURY_KEY_abc123-def456-789 = 5J7WzMq8hN3pR2... (your treasury private key)
PUMPFUN_CREATOR_KEY_abc123-def456-789 = 3K9XmPd7gQ4tY8... (your creator private key)
```

## 🚀 Deployment Steps

### 1. Database Setup
The database is already configured via Replit's built-in PostgreSQL. No additional setup needed.

### 2. Configure Environment Variables

Add to Replit Secrets (Tools → Secrets):
```bash
# Optional: Custom Solana RPC endpoint (default: mainnet-beta.solana.com)
SOLANA_RPC_ENDPOINT=https://api.mainnet-beta.solana.com

# Session secret (auto-generated)
SESSION_SECRET=<your-session-secret>

# For each project:
TREASURY_KEY_<project-id>=<base58-private-key>
PUMPFUN_CREATOR_KEY_<project-id>=<base58-private-key>  # Only for PumpFun tokens
```

### 3. Deploy to Production

Click the **Publish** button in Replit to deploy your app!

The scheduler will automatically:
- Run every hour (only in production mode)
- Check for scheduled buybacks
- Claim PumpFun rewards (if configured)
- Execute swaps via Jupiter Ultra API
- Burn tokens to Solana incinerator

## 🔒 Security Best Practices

### Private Key Management

1. **Never commit private keys to Git**
   - Always use environment variables/Replit Secrets
   - Never hardcode keys in your code

2. **Use dedicated treasury wallets**
   - Create a new wallet specifically for each project's treasury
   - Don't use your personal wallet as the treasury

3. **Separate creator and treasury wallets**
   - Creator wallet claims PumpFun rewards
   - Treasury wallet executes buybacks and burns
   - They can be different wallets for better security

4. **Rotate keys periodically**
   - Generate new keypairs every 6-12 months
   - Update environment variables when rotating

### Access Control

1. **Replit Secrets** are encrypted and only accessible to your Repl
2. **Never log private keys** - the system logs public keys only
3. **Limit team access** - only share with trusted team members

## 📊 Monitoring

### Transaction Monitoring

View all transactions in the dashboard:
- **Completed**: Successfully executed and confirmed on-chain
- **Pending**: Transaction generated but not yet executed
- **Failed**: Execution failed (check error message)

### Logs

Production logs show:
```
[05:00:00] Checking 3 active projects for scheduled buybacks
[05:00:01] Executing buyback for Project: MyToken
[05:00:01] PumpFun rewards available! Executing claim...
[05:00:02] PumpFun rewards claimed! Signature: 5K7...
[05:00:03] Treasury balance after claim: 1.234 SOL
[05:00:04] Getting Jupiter Ultra order for 1.0 SOL to EPjF...
[05:00:05] Order received: 1.0 SOL → 1000000 tokens
[05:00:06] 1. Executing swap: 1.0 SOL → 1000000 tokens
[05:00:08]    Swap completed: 3J9...
[05:00:09] 2. Burning 1000000 tokens to incinerator...
[05:00:11]    Burn completed: 8N2...
[05:00:11] ✅ Buyback completed successfully for MyToken!
```

## 🆘 Troubleshooting

### "No private key configured for automatic execution"

**Solution**: Set the environment variable for your project:
```bash
TREASURY_KEY_<your-project-id>=<your-private-key>
```

### "Insufficient balance"

**Solution**: 
1. Check your treasury wallet has enough SOL
2. For PumpFun tokens, set creator private key to claim rewards first
3. Adjust buyback amount if needed

### "Transaction failed"

**Possible causes**:
1. Insufficient SOL for transaction fees (~0.001 SOL)
2. Token mint address incorrect
3. Network congestion (retry automatically)

### "PumpFun rewards claim failed"

**Possible causes**:
1. No unclaimed rewards available
2. Token not on PumpFun platform
3. Incorrect creator wallet address

## 💡 Production Tips

### Optimize Costs

1. **Adjust buyback frequency**
   - Hourly: Maximum frequency, higher fees
   - Daily: Good balance of frequency and costs
   - Weekly: Lowest fees, less frequent

2. **Batch operations**
   - Set higher buyback amounts with less frequent schedule
   - Reduces total transaction fees

3. **Monitor slippage**
   - Jupiter Ultra automatically optimizes slippage
   - Check transaction history for price impact

### Scale Your Operation

1. **Multiple tokens**
   - Create separate projects for each token
   - Configure private keys for each project
   - All run independently on the same schedule

2. **Custom schedules**
   - Use cron expressions for precise timing
   - Example: `0 */6 * * *` = Every 6 hours
   - Example: `0 0 * * 1` = Every Monday at midnight

## 📞 Support

If you encounter issues:
1. Check the transaction history for error messages
2. Review the logs in Replit console
3. Verify environment variables are set correctly
4. Ensure wallets have sufficient SOL balance

---

**Ready to go live?** 🚀

1. ✅ Configure private keys in Replit Secrets
2. ✅ Click Publish to deploy
3. ✅ Watch your first automated buyback execute!

Your token's supply reduction journey starts now. 🔥
