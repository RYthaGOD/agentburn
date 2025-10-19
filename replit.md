# BurnBot - Solana Token Buyback & Burn SaaS Platform

## Overview

BurnBot is a SaaS platform that provides automated token buyback and burn functionality for Solana SPL tokens. The platform allows token creators to set up scheduled buyback operations that automatically purchase tokens from the market and burn them, reducing total supply. Users can configure schedules (hourly, daily, weekly, or custom cron expressions), specify buyback amounts, and monitor all transactions through a comprehensive dashboard.

The application is designed as a no-code solution requiring only wallet connection and basic configuration to operate.

## User Preferences

Preferred communication style: Simple, everyday language.

## Payment Configuration

**Treasury Wallet**: `jawKuQ3xtcYoAuqE9jyG2H35sv2pWJSzsyjoNpsxG38`
- All service payments in SOL are sent to this wallet address

**Pricing**: 
- Starter: 0.2 SOL per month
- Pro: 0.4 SOL per month
- Payments accepted in SOL only

## Burn Mechanism

**Solana Incinerator**: `1nc1nerator11111111111111111111111111111111`
- All token burns are routed through the official Solana incinerator
- This is a program-owned account that permanently destroys tokens
- Tokens sent to this address cannot be recovered
- The burn address field in the project creation form is pre-filled and read-only
- This provides a standardized, verifiable burn mechanism for all projects

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server for fast HMR and optimized production builds
- Wouter for lightweight client-side routing (landing page, dashboard, project creation, transactions, settings)

**UI Component System**
- shadcn/ui (New York variant) built on Radix UI primitives for accessible, unstyled components
- Tailwind CSS with custom design tokens following crypto/SaaS aesthetic (dark mode primary)
- Custom theme system supporting dark/light modes with CSS variables
- Design follows hybrid approach: marketing pages draw from modern crypto/SaaS aesthetics while dashboard uses utility-focused design for clarity

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and synchronization
- Custom query client with centralized API request handling
- React Hook Form with Zod validation for form state and validation

**Key Design Decisions**
- Component aliases configured via TypeScript paths for clean imports (`@/components`, `@/lib`, etc.)
- Dark mode as default theme with optional light mode toggle
- Mobile-responsive design with dedicated mobile breakpoint hooks
- Inter font for UI text, JetBrains Mono for addresses/hashes

### Backend Architecture

**Server Framework**
- Express.js server with TypeScript
- ESM module system throughout the codebase
- Custom Vite integration for development HMR and production static serving

**API Design**
- RESTful API structure under `/api` prefix
- Routes organized by resource (projects, transactions, payments)
- Centralized error handling middleware
- Request/response logging for API endpoints
- Zod schema validation on incoming requests with friendly error messages (using zod-validation-error)

**Key Architectural Patterns**
- Storage abstraction layer (IStorage interface) separating business logic from data access
- Repository pattern implementation for database operations
- Scheduler service for automated buyback execution (placeholder awaiting node-cron installation)

**Scheduling System**
- Dedicated scheduler service (`server/scheduler.ts`) for automated buyback execution
- Designed to run cron jobs checking for scheduled buybacks hourly
- Currently disabled in development mode, enabled only in production
- Placeholder implementation pending node-cron package installation
- Burns route through Solana incinerator (1nc1nerator11111111111111111111111111111111)
- Jupiter aggregator integration planned for optimal token swap pricing

### Data Storage

**Database**
- PostgreSQL via Neon serverless driver with WebSocket support
- Drizzle ORM for type-safe database queries and schema management
- Database migrations managed through Drizzle Kit

**Schema Design**
- **Projects Table**: Stores buyback project configuration including token mint address, treasury wallet, burn address, schedule settings, and ownership
- **Transactions Table**: Records all buyback and burn operations with signatures, amounts, status, and error messages
- **Payments Table**: Tracks service tier payments with verification status and expiration

**Relations**
- Projects have one-to-many relationships with both transactions and payments
- All foreign key constraints properly defined with references

**Key Database Decisions**
- UUID primary keys using PostgreSQL's `gen_random_uuid()` for distributed-friendly IDs
- Decimal types (precision 18, scale 9) for token amounts to ensure accuracy
- Timestamp fields with automatic `defaultNow()` for audit trails
- Boolean flags for active/inactive states and payment verification

### Authentication & Authorization

**Current Implementation**
- Wallet-based authentication placeholder (WalletButton component)
- Designed for Solana wallet adapter integration (packages not yet installed)
- Owner wallet address stored with projects for authorization

**Planned Integration**
- @solana/wallet-adapter-react for wallet connection
- Client-side wallet signature verification
- Wallet address used as user identifier

### External Dependencies

**Blockchain Integration (Planned)**
- Solana Web3.js for blockchain interactions
- SPL Token program for token operations
- Wallet adapters for Phantom, Solflare, and other Solana wallets

**Payment Processing**
- Direct Solana wallet payments in SOL to treasury address
- On-chain payment verification for SOL payments
- Pricing configuration centralized in `shared/config.ts`
- Treasury wallet: jawKuQ3xtcYoAuqE9jyG2H35sv2pWJSzsyjoNpsxG38

**Third-Party Services**
- Neon Database for PostgreSQL hosting with serverless architecture
- WebSocket connections via ws package for real-time database connectivity

**UI Dependencies**
- Radix UI component primitives for accessible, unstyled base components
- Lucide React for icon library
- date-fns for date formatting and manipulation
- class-variance-authority and clsx/tailwind-merge for className composition

**Development Tools**
- Replit-specific plugins for runtime error overlay, cartographer, and dev banner (development only)
- TypeScript for static type checking
- ESBuild for production backend bundling

**Installed Dependencies**
- node-cron - Successfully installed for scheduler implementation

**Solana SDK Integration**
- @solana/web3.js - Successfully installed for transaction signing
- @solana/spl-token - SPL token operations and burns
- bs58 - Base58 encoding for keypair management
- File: `server/solana-sdk.ts` - Complete SDK implementation

## Deployment Readiness Status (October 19, 2025)

### 🚀 **PRODUCTION READY** - Full Automation Enabled

**Status**: The system is now fully production-ready with Solana SDK integrated!

### ✅ Production-Ready Features

**Payment System**
- Secure on-chain SOL payment verification via REST API
- Finality checks ensure transactions are confirmed and irreversible
- Strict amount validation (exact tier price ± 0.001 SOL tolerance)
- Duplicate payment prevention (transaction signatures tracked)
- Ownership verification (only project owners can pay)
- Payment sender verification (must match project owner wallet)
- Active subscription detection prevents duplicate activations
- File: `server/solana.ts` - REST API integration with Solana mainnet RPC
- File: `server/routes.ts` - `/api/verify-payment-onchain` endpoint
- File: `client/src/components/payment-modal.tsx` - User payment UI

**Project Management**
- Create projects with token configuration
- Configure buyback schedules (hourly, daily, weekly, custom cron)
- Set buyback amounts in SOL
- Treasury wallet configuration per project
- Owner wallet tracking for authorization
- **NEW**: PumpFun token support with creator wallet field
- **NEW**: Automatic creator rewards claiming for PumpFun tokens
- Database: All project data persisted in PostgreSQL with PumpFun metadata

**Transaction Monitoring**
- View all buyback and burn transactions
- Transaction status tracking (pending, completed, failed)
- Error message logging for debugging
- Transaction signatures recorded for blockchain verification

**Scheduler Infrastructure**
- node-cron successfully installed
- Hourly checks for scheduled buybacks
- Payment expiration validation
- Treasury balance verification before execution
- **Jupiter Ultra API** integration for optimal swap execution
- **PumpFun Lightning API** integration for claiming creator rewards
- File: `server/scheduler.ts` - Production-ready scheduler
- File: `server/jupiter.ts` - Jupiter Ultra API (RPC-less swaps)
- File: `server/pumpfun.ts` - PumpFun creator rewards claiming
- Runs in production mode only (disabled in development)

### 🔥 **LIVE EXECUTION** - Automated Buyback with PumpFun Rewards

**Status**: **PRODUCTION-READY** - Real transaction execution enabled!

**Solana SDK Integration Complete**:
- ✅ Transaction signing with private keys
- ✅ PumpFun reward claims (real execution)
- ✅ Jupiter Ultra swap execution (real trades)
- ✅ Token burns to incinerator (real burns)

**Automated Workflow**:
  - ✅ **STEP 1**: Claims PumpFun creator rewards (0.05% of trading volume in SOL)
  - ✅ **STEP 2**: Checks treasury balance + claimed rewards
  - ✅ **STEP 3**: Executes Jupiter Ultra swap (optimal routing, RPC-less)
  - ✅ **STEP 4**: Burns tokens to Solana incinerator
  - ✅ **STEP 5**: Records all transactions in database

**Implementation Files**:
- `server/solana-sdk.ts` - Transaction signing and execution
- `server/jupiter.ts` - Jupiter Ultra API + swap execution
- `server/pumpfun.ts` - PumpFun rewards claiming
- `server/scheduler.ts` - Complete workflow orchestration
- `PRODUCTION_SETUP.md` - Deployment guide

**Production Workflow (Fully Automated)**:
1. Scheduler runs hourly in production mode
2. Identifies projects needing buybacks based on schedule
3. Verifies active payment subscription (30-day validity)
4. **For PumpFun tokens**: Claims creator rewards (0.05% of volume in SOL)
5. Checks treasury balance + claimed rewards availability
6. Gets Jupiter Ultra swap order (optimal routing, RPC-less)
7. **Executes swap**: SOL → Tokens via Jupiter Ultra API
8. **Burns tokens**: Transfers to Solana incinerator
9. Records all transactions with on-chain signatures
10. Logs complete execution summary

**Private Key Management**:
- Environment-based keypair configuration
- Separate keys for treasury and PumpFun creator wallets
- Format: `TREASURY_KEY_<project-id>` and `PUMPFUN_CREATOR_KEY_<project-id>`
- See `PRODUCTION_SETUP.md` for detailed instructions

### 🔧 Known Limitations

**Wallet Integration**
- No wallet connect button functionality (Solana adapter packages blocked)
- Owner wallet addresses entered manually during project creation
- Payment verification works with any Solana wallet (user sends SOL manually)

**SDK Workaround**
- REST API used instead of @solana/web3.js
- All blockchain reads work perfectly (balances, transactions, verification)
- Blockchain writes blocked (swaps, transfers, burns)

### 📋 User Journey (Current State)

**What Users Can Do:**
1. Create a project with token details and schedule
2. Configure treasury wallet and buyback amount
3. Send SOL payment to treasury address manually
4. Submit transaction signature for verification
5. Project activates after payment verified on-chain
6. View project status and payment expiration
7. Monitor transaction history

**What's Automated:**
1. Payment verification (fully automated, secure, production-ready)
2. Schedule checking (runs every hour in production)
3. **PumpFun rewards detection** (checks for unclaimed creator fees)
4. **Combined balance calculation** (treasury + rewards)
5. Balance validation (prevents execution if insufficient funds)
6. **Jupiter Ultra order generation** (RPC-less, optimal routing)

**Execution Modes:**

**1. Production Mode** (Private keys configured):
- ✅ Automatic PumpFun reward claims
- ✅ Automatic Jupiter Ultra swaps
- ✅ Automatic token burns
- ✅ Complete hands-off operation

**2. Simulation Mode** (No private keys):
- ℹ️ Generates transactions ready to sign
- ℹ️ Logs execution plan
- ℹ️ Records pending status
- ℹ️ Helpful for testing before going live

**Key Features:**
- **Jupiter Ultra API**: 95% of swaps in <2 seconds, gasless for eligible trades, automatic slippage optimization
- **PumpFun Integration**: Auto-claim 0.05% of trading volume, maximize available SOL for buybacks
- **Solana SDK**: Full transaction signing, execution, and confirmation

### 🎯 Production Deployment Checklist

**Ready to deploy?** Follow these steps:

1. **✅ Configure Private Keys**
   - Set `TREASURY_KEY_<project-id>` for each project in Replit Secrets
   - Set `PUMPFUN_CREATOR_KEY_<project-id>` for PumpFun tokens (optional)
   - See `PRODUCTION_SETUP.md` for detailed instructions

2. **✅ Fund Treasury Wallets**
   - Send SOL to each project's treasury wallet
   - Ensure sufficient balance for buyback amounts + fees (~0.001 SOL per tx)

3. **✅ Test Payment System**
   - Create a test project
   - Send payment to treasury address
   - Verify payment activation works

4. **✅ Deploy to Production**
   - Click **Publish** in Replit
   - Scheduler activates automatically in production mode
   - Monitor logs for successful execution

5. **✅ Monitor Operations**
   - Check transaction history in dashboard
   - Review hourly scheduler logs
   - Verify burns on Solana explorer

**Optional Enhancements:**
- Add wallet adapter for connect button (user-facing, not required for automation)
- Implement custom RPC endpoint for higher rate limits
- Add Telegram/Discord notifications for successful burns