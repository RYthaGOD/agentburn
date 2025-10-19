# BurnBot Production Deployment Guide

## 🚀 Pre-Deployment Checklist

### 1. Environment Variables

Set the following environment variables in your Replit deployment settings:

#### Required Secrets

```bash
# Database (Auto-configured by Replit)
DATABASE_URL=<auto-configured>
PGHOST=<auto-configured>
PGPORT=<auto-configured>
PGDATABASE=<auto-configured>
PGUSER=<auto-configured>
PGPASSWORD=<auto-configured>

# Session Security (Auto-configured by Replit)
SESSION_SECRET=<auto-configured>

# Encryption Master Key (CRITICAL - Must generate yourself)
ENCRYPTION_MASTER_KEY=<your-32-byte-hex-key-here>
```

#### ⚠️ CRITICAL: Generate Your Own Encryption Key

Generate a secure 32-byte encryption key using this command:

```bash
# In Replit Shell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and set it as `ENCRYPTION_MASTER_KEY` in your Replit Secrets.

### 2. Verify Configuration

Check that these settings are correct:

- **Solana Network**: Mainnet-beta (hardcoded in code)
- **Jupiter API**: Ultra API endpoint enabled
- **PumpFun API**: Lightning API endpoint enabled
- **Treasury Wallet**: `jawKuQ3xtcYoAuqE9jyG2H35sv2pWJSzsyjoNpsxG38`

### 3. Database Migration

The database schema is already set up. No manual migrations needed.

If you need to verify the database:

```bash
# In Replit Shell
npm run db:push
```

This will sync your schema with the database without data loss.

## 🔐 Security Verification

### Encryption System

The platform uses **AES-256-GCM encryption** for private keys:

- Each key has a unique initialization vector (IV)
- Authentication tags prevent tampering
- Keys are encrypted at rest and decrypted on-demand
- No keys are ever logged or exposed

### Authentication System

Wallet-based authentication using:

- **Solana Wallet Adapter** for browser wallet connections
- **Message signing** for operation authentication
- **Signature verification** on backend using tweetnacl
- **Replay attack prevention** via signature hashing
- **Time-based validation** (5-minute signature window)

## 📋 Post-Deployment Steps

### 1. Test Wallet Connection

1. Navigate to the deployed app
2. Click "Connect Wallet"
3. Select Phantom or Solflare wallet
4. Approve connection
5. Verify your wallet address appears in the header

### 2. Test Key Management

1. Create a test project (or use existing)
2. Navigate to Settings
3. Select your project
4. Enter treasury private key (use a test keypair first!)
5. Sign the message with your wallet
6. Verify the key is saved (green success banner)
7. Test key deletion with wallet signature

### 3. Test Automated Buyback (Optional)

1. Create a project with real configuration
2. Add PumpFun creator wallet if using PumpFun rewards
3. Pay the service fee (0.2 SOL for Starter, 0.4 SOL for Pro)
4. Activate the project
5. Add treasury private key via Settings
6. Monitor the transactions page for automated buybacks

### 4. Monitor Scheduler

The scheduler runs hourly in production mode. Check the server logs:

```bash
# In Replit Console
# Look for entries like:
"Scheduler: Checking project {id} for automated buyback"
"Successfully executed buyback for project {id}"
```

## 🔍 Verification Commands

### Check Database Connection

```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM projects;"
```

### Verify Encryption Key

```bash
# In Node.js shell
node -e "console.log(process.env.ENCRYPTION_MASTER_KEY ? 'ENCRYPTION_MASTER_KEY is set' : 'ERROR: ENCRYPTION_MASTER_KEY not set')"
```

### Test Solana Connection

```bash
curl -X POST https://api.mainnet-beta.solana.com -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
# Should return: {"jsonrpc":"2.0","result":"ok","id":1}
```

## ⚙️ Configuration Files

### Key Files

- `server/scheduler.ts` - Automated buyback execution
- `server/crypto.ts` - Encryption/decryption utilities
- `server/key-manager.ts` - Key storage management
- `server/solana-sdk.ts` - Solana blockchain operations
- `shared/schema.ts` - Database schema

### Environment Detection

The system automatically detects production mode:

```typescript
const isProduction = process.env.NODE_ENV === 'production'
```

In production:
- Scheduler is **enabled** (runs hourly checks)
- Real transactions are executed
- All security features are active

In development:
- Scheduler is **disabled** (manual testing only)
- Simulated mode available for testing

## 🚨 Troubleshooting

### Issue: "Wallet signature required" error

**Solution**: The user's wallet must be connected before they can save keys in Settings.

### Issue: Scheduler not running

**Check**:
1. `NODE_ENV=production` is set
2. Server logs show "Scheduler enabled in production mode"
3. Projects are activated (`isActive: true`)
4. Service fees are paid

### Issue: Buyback fails

**Check**:
1. Treasury has sufficient SOL for swap + fees
2. Project has valid token mint address
3. Private keys are correctly stored
4. Jupiter API is responding (check network)

### Issue: Encryption/decryption errors

**Solution**: Verify `ENCRYPTION_MASTER_KEY` is exactly 64 hex characters (32 bytes).

```bash
# Check key length
node -e "console.log(process.env.ENCRYPTION_MASTER_KEY?.length)"
# Should output: 64
```

## 📊 Monitoring

### Key Metrics

Monitor these in production:

1. **Active Projects**: Projects with `isActive: true`
2. **Paid Projects**: Projects with verified SOL payments
3. **Transaction Success Rate**: Successful vs failed burns
4. **Scheduler Execution Time**: Should complete within seconds

### Database Queries

```sql
-- Active projects
SELECT COUNT(*) FROM projects WHERE "isActive" = true;

-- Total burns executed
SELECT COUNT(*) FROM transactions WHERE status = 'completed';

-- Payment verification
SELECT COUNT(*) FROM payments WHERE status = 'verified';
```

## 🎯 Success Criteria

Your deployment is successful when:

✅ Wallet connection works (Phantom/Solflare)
✅ Key management requires wallet signature
✅ Keys are encrypted in database
✅ Scheduler runs hourly (check server logs)
✅ Test buyback executes successfully
✅ Transactions appear in dashboard
✅ SOL payments are verified on-chain

## 📞 Support

For issues or questions:

1. Check server logs in Replit Console
2. Review browser console for frontend errors
3. Verify all environment variables are set
4. Test with a fresh project using devnet first

## 🔄 Updates & Maintenance

### Updating Dependencies

```bash
npm update
```

### Database Schema Changes

If you modify `shared/schema.ts`:

```bash
npm run db:push --force
```

### Rotating Encryption Key

**WARNING**: Rotating the encryption key will invalidate all existing stored keys!

To rotate safely:
1. Decrypt all existing keys
2. Change `ENCRYPTION_MASTER_KEY`
3. Re-encrypt all keys with new key
4. Test thoroughly before going live

---

**Version**: 1.0.0
**Last Updated**: October 19, 2025
**Status**: Production Ready ✅
