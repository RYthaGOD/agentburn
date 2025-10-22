# Technical Notes

## Known Limitations

### Vite HMR WebSocket Warning (Non-Critical)

**Symptom:** Browser console shows error:
```
Failed to construct 'WebSocket': The URL 'wss://localhost:undefined/?token=...' is invalid.
```

**Impact:** Cosmetic only - does not affect application functionality

**Root Cause:**
- Vite's Hot Module Replacement (HMR) system attempts to connect via WebSocket for live updates
- In Replit's cloud environment, the port detection fails, resulting in `undefined` port
- Proper fix requires editing protected configuration files:
  - `vite.config.ts` - Cannot be edited (protected)
  - `.replit` - Cannot be edited (protected)
  - `server/vite.ts` - Cannot be edited (protected)

**Workaround:**
- Vite automatically falls back to full page reloads instead of hot updates
- Application's own WebSocket connection (for real-time price monitoring) **works perfectly**
- Development experience remains functional, just without instant hot updates

**Status:** Accepted limitation - No security or functionality impact

---

## API Migrations

### Jupiter Price API v3 Migration (October 2025)

**Date:** October 22, 2025

**Issue:** Old `price.jup.ag/v4` endpoint was deprecated (August 2025), causing DNS resolution failures.

**Migration:**
- **Old Endpoint:** `https://price.jup.ag/v4/price?ids={token}&vsToken={SOL}`
- **New Endpoint:** `https://lite-api.jup.ag/price/v3?ids={token},{SOL_MINT}`

**Key Changes:**
1. **Response Format:**
   - V4: `data.data[tokenMint].price` (nested structure)
   - V3: `data[tokenMint].usdPrice` (direct access)

2. **Price Denomination:**
   - V4: Direct SOL-denominated prices via `vsToken` parameter
   - V3: USD prices only - calculate SOL price via: `tokenPriceUSD / solPriceUSD`

3. **Implementation:**
   ```typescript
   // Fetch both token and SOL prices in one request
   const response = await fetch(
     `https://lite-api.jup.ag/price/v3?ids=${tokenMintAddress},${SOL_MINT}`
   );
   const data = await response.json();
   
   // Calculate SOL-denominated price
   const tokenPriceInSOL = data[tokenMintAddress].usdPrice / data[SOL_MINT].usdPrice;
   ```

**Status:** ✅ Completed and verified - No errors in production

**Testing:** Architect-reviewed and approved

---

## Future Monitoring

1. **Jupiter API**: Monitor [Jupiter Developer Docs](https://dev.jup.ag/docs/price-api/v3) for future API changes
2. **Vite HMR**: If Vite WebSocket becomes critical, request configuration file edit permissions
3. **Price Calculation**: Log computed SOL prices periodically to verify accuracy

---

*Last Updated: October 22, 2025*
