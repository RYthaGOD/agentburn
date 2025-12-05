# Privacy & Security Documentation

## Overview

This B2B invoicing system on Solana implements comprehensive privacy controls to protect sensitive transaction data between invoicers and invoicees. No transaction details, wallet addresses, or amounts are publicly visible without proper authentication.

## Privacy Features

### 1. Private by Default

All projects are created with privacy enabled by default:
- `isPrivate: true` - Project details hidden from public view
- `hideTransactionDetails: true` - Transaction amounts and signatures encrypted
- `hideWalletAddresses: true` - Wallet addresses redacted from public APIs

### 2. Authentication Required

All sensitive data access requires wallet-based authentication:
- Transaction history requires wallet ownership proof
- Stats and analytics require authenticated wallet parameter
- Public endpoints return only aggregated, anonymized data

### 3. Arcium v0.5 Encryption

Confidential computing via Arcium Multi-party eXecution Environment (MXE):
- End-to-end encryption of transaction data
- Only authorized parties (invoicer + invoicee) can decrypt
- Cryptographic access control on-chain
- Dynamic access management (grant/revoke)

## API Privacy Model

### Public Endpoints (No Authentication)

These endpoints provide only aggregated, anonymized statistics:

#### `GET /api/public/stats`
Returns counts and averages only, no personal data:
```json
{
  "totalPublicProjects": 42,
  "totalBurns": 156,
  "avgAIConfidence": 85,
  "totalTransactions": 312
}
```

**What's hidden:**
- ❌ Wallet addresses
- ❌ Transaction amounts
- ❌ Token details
- ❌ Individual transaction data

#### `GET /api/health`
System health check only:
```json
{
  "status": "ok",
  "service": "GigaBrain Agentic Burn System"
}
```

### Protected Endpoints (Authentication Required)

These endpoints require `?wallet=YOUR_WALLET_ADDRESS` parameter to verify ownership:

#### `GET /api/transactions/wallet/:walletAddress?wallet=xxx`
Returns transactions only for authenticated wallet owner.

**Authentication:**
```
GET /api/transactions/wallet/7xK...3mN?wallet=7xK...3mN
```
- ✅ Returns data if `walletAddress === wallet` parameter
- ❌ Returns 403 Forbidden if wallet doesn't match

**Response:**
```json
[
  {
    "id": "tx-123",
    "amount": "***ENCRYPTED***",
    "tokenAmount": "***ENCRYPTED***",
    "txSignature": "***ENCRYPTED***",
    "isEncrypted": true,
    "status": "completed"
  }
]
```

To decrypt (if you're an allowed party):
```
GET /api/transactions/wallet/:walletAddress?wallet=xxx&includeEncrypted=true
```

#### `POST /api/transactions/:id/decrypt`
Decrypt Arcium-encrypted transaction data.

**Request:**
```json
{
  "walletAddress": "7xK...3mN",
  "privateKey": "base58_encoded_private_key"
}
```

**Response (Success):**
```json
{
  "success": true,
  "transaction": {
    "id": "tx-123",
    "amount": "1.5",
    "tokenAmount": "1000000",
    "fromAddress": "7xK...3mN",
    "toAddress": "8zL...4pO",
    "txSignature": "5k3...d8j",
    "timestamp": 1702345678,
    "decryptedAt": "2025-12-05T18:30:00Z"
  }
}
```

**Response (Unauthorized):**
```json
{
  "message": "Unauthorized: Your wallet does not have decrypt access"
}
```

#### `GET /api/agentic-burn/stats/:walletAddress?wallet=xxx`
Personal burn statistics (requires authentication).

#### `GET /api/x402/payments/:walletAddress?wallet=xxx`
Personal x402 micropayment history (requires authentication).

#### `GET /api/bam/bundles/:walletAddress?wallet=xxx`
Personal Jito BAM bundle history (requires authentication).

### Disabled Endpoints (Privacy Protection)

These endpoints have been **permanently disabled** to prevent public data exposure:

#### ~~`GET /api/transactions`~~
**Status:** 403 Forbidden
**Reason:** Exposed all user transactions publicly

**Response:**
```json
{
  "message": "Public transaction listing disabled for privacy. Use /api/transactions/wallet/:walletAddress with authentication."
}
```

#### ~~`GET /api/transactions/recent`~~
**Status:** 403 Forbidden
**Reason:** Exposed recent transactions from all users

**Response:**
```json
{
  "message": "Public transaction listing disabled for privacy. Use wallet-specific authenticated endpoints."
}
```

## Access Control Model

### 3-Tier Access Control

#### Tier 1: Public (No Authentication)
- Aggregated statistics only
- No personal information
- Counts and averages

#### Tier 2: Authenticated User (Wallet Proof)
- Personal transaction list (encrypted)
- Personal statistics
- Own project details

#### Tier 3: Decryption Access (Private Key)
- Decrypt transaction amounts
- View wallet addresses
- Access full transaction details

### Access Control Matrix

| Resource | Public | Auth User | Decrypt Key | Notes |
|----------|--------|-----------|-------------|-------|
| Aggregated stats | ✅ | ✅ | ✅ | Counts only |
| Own projects | ❌ | ✅ | ✅ | List view |
| Own transactions | ❌ | ✅ (encrypted) | ✅ (full) | Encrypted by default |
| Transaction amounts | ❌ | ❌ | ✅ | Arcium MXE required |
| Wallet addresses | ❌ | ❌ | ✅ | Arcium MXE required |
| Others' data | ❌ | ❌ | ❌ | Never accessible |

## Data Protection Measures

### 1. Database Level
- Private keys encrypted at rest (AES-256-GCM)
- Transaction amounts encrypted (Arcium MXE)
- Wallet addresses redacted in public queries

### 2. API Level
- Rate limiting (500 req/15min per IP)
- Input sanitization (XSS/SQL injection prevention)
- Request size limits (1MB max)
- CORS policy enforcement

### 3. Network Level
- HTTPS required in production
- HSTS enabled (1 year)
- Content Security Policy headers
- XSS protection headers

### 4. Application Level
- Wallet ownership verification
- Project ownership verification
- Transaction access control
- Arcium encryption for sensitive data

## Privacy Settings

Project owners can configure privacy per-project:

```typescript
// Maximum Privacy (Default)
const project = {
  isPrivate: true,                // Hide project from public lists
  hideTransactionDetails: true,   // Encrypt amounts and signatures
  hideWalletAddresses: true,      // Redact wallet addresses
};

// Public Project (e.g., for marketing)
const publicProject = {
  isPrivate: false,               // Show in public stats
  hideTransactionDetails: true,   // Still hide transaction details
  hideWalletAddresses: true,      // Still hide wallet addresses
};

// Internal Use (Maximum Transparency)
const internalProject = {
  isPrivate: true,                // Private project
  hideTransactionDetails: false,  // Show amounts (still requires auth)
  hideWalletAddresses: false,     // Show addresses (still requires auth)
};
```

## Compliance

### GDPR Compliance
✅ **Right to erasure**: Transaction data can be deleted
✅ **Data minimization**: Only necessary data collected
✅ **Purpose limitation**: Data used only for invoicing
✅ **Storage limitation**: Retention policies configurable
✅ **Security**: Encryption at rest and in transit

### SOC 2 Compliance
✅ **Access control**: Role-based authentication
✅ **Audit logging**: All access attempts logged
✅ **Encryption**: AES-256-GCM + Arcium MXE
✅ **Availability**: Rate limiting and DDoS protection
✅ **Confidentiality**: Multi-layer privacy controls

### PCI DSS (if handling payments)
✅ **Encryption**: Payment amounts encrypted
✅ **Access control**: Authentication required
✅ **Audit trails**: Transaction logs immutable
✅ **Network security**: Firewall and rate limiting

## Security Headers

Automatically applied to all responses:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'; ...
Referrer-Policy: strict-origin-when-cross-origin
```

## Best Practices for Users

### For Invoicers
1. ✅ Keep private keys secure (hardware wallet recommended)
2. ✅ Never share private keys via email/chat
3. ✅ Verify recipient wallet address before invoicing
4. ✅ Enable all privacy settings for B2B transactions
5. ✅ Regularly audit transaction access logs

### For Invoicees
1. ✅ Only decrypt transactions when necessary
2. ✅ Use hardware wallet for signing
3. ✅ Verify invoicer wallet address
4. ✅ Keep payment records encrypted
5. ✅ Report suspicious access attempts

### For Developers
1. ✅ Never log private keys or decrypted data
2. ✅ Use environment variables for secrets
3. ✅ Validate wallet ownership before data access
4. ✅ Implement rate limiting on sensitive endpoints
5. ✅ Monitor failed authentication attempts

## Privacy Incidents

In case of suspected privacy breach:

1. **Immediate Actions:**
   - Disable affected API endpoints
   - Rotate encryption keys
   - Audit access logs
   - Notify affected users

2. **Investigation:**
   - Review server logs
   - Check authentication failures
   - Analyze network traffic
   - Identify attack vector

3. **Remediation:**
   - Patch vulnerabilities
   - Update security policies
   - Re-encrypt affected data
   - Document incident

4. **Notification:**
   - Notify affected users within 72 hours
   - Provide breach details and impact
   - Offer remediation steps
   - Report to authorities if required

## Monitoring & Auditing

### Automated Monitoring
- Failed authentication attempts (alert after 10 failures)
- Unusual access patterns (alert on rate limit violations)
- Decryption failures (alert on repeated failures)
- API endpoint abuse (alert on suspicious activity)

### Audit Logs
All sensitive operations are logged:
```
[SECURITY AUDIT] 2025-12-05T18:30:00Z - wallet_authenticated: {
  walletAddress: "7xK...3mN",
  resource: "/api/transactions/wallet/7xK...3mN",
  ip: "192.168.1.1"
}
```

**Logged Operations:**
- Wallet authentication
- Transaction decryption
- Access grants/revokes
- Failed authorization attempts

## Future Enhancements

Planned privacy features:
- [ ] Zero-knowledge proofs for transaction validation
- [ ] Multi-party computation for analytics
- [ ] Homomorphic encryption for private queries
- [ ] Wallet Connect integration (no private key exposure)
- [ ] Hardware wallet support (Ledger/Trezor)
- [ ] Privacy-preserving audit trails

## FAQ

**Q: Can anyone see my transaction amounts?**
A: No. Transaction amounts are encrypted with Arcium MXE. Only the invoicer and invoicee (parties in `arciumAllowedParties`) can decrypt them.

**Q: Are wallet addresses visible on the blockchain?**
A: Yes, blockchain transactions are public. However, our API never exposes wallet addresses without authentication, and you can use fresh wallets for each transaction.

**Q: What if I lose my private key?**
A: If you lose your private key, you cannot decrypt Arcium-encrypted transactions. Back up your keys securely.

**Q: Can I grant access to my accountant?**
A: Yes! Use the `grantAccess` API to add your accountant's wallet to the allowed parties list.

**Q: How do I revoke access?**
A: Use the `revokeAccess` API with the wallet address you want to remove from allowed parties.

**Q: Is this GDPR compliant?**
A: Yes. We implement data minimization, encryption, access control, and right to erasure.

**Q: What data is stored on-chain vs off-chain?**
A: On-chain: Token burns, x402 payments, BAM bundles (public). Off-chain: Transaction amounts, wallet mappings (encrypted in database).

---

**Last Updated:** 2025-12-05
**Version:** 1.0.0
**Contact:** security@burnbot.io
