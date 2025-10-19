# BurnBot - Solana Token Buyback & Burn SaaS Platform

## Overview

BurnBot is a SaaS platform providing automated token buyback and burn functionality for Solana SPL tokens. It enables token creators to schedule and execute buyback operations that automatically purchase tokens from the market and send them to the Solana incinerator, reducing the total supply. The platform offers a no-code solution with a comprehensive dashboard for configuration, scheduling (hourly, daily, weekly, or custom cron), and transaction monitoring. Its core ambition is to offer a streamlined, automated, and verifiable burn mechanism to enhance tokenomics for Solana projects.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18+ and TypeScript, utilizing Vite for fast development and optimized builds. Wouter handles client-side routing. The UI is designed with shadcn/ui (New York variant) on Radix UI primitives, styled with Tailwind CSS for a crypto/SaaS aesthetic, primarily dark mode. TanStack Query manages server state and caching, while React Hook Form with Zod provides form validation. Key design decisions include component aliases, mobile responsiveness, and specific font choices (Inter and JetBrains Mono).

### Backend Architecture

The backend uses an Express.js server with TypeScript, employing an ESM module system. It features a RESTful API under `/api`, organized by resource, with centralized error handling and Zod schema validation. Core architectural patterns include a storage abstraction layer, repository pattern for database operations, and a dedicated scheduler service for automated buyback execution.

### Scheduling System

A dedicated scheduler service (`server/scheduler.ts`) automates buyback execution using `node-cron`. It performs hourly checks, validates payments, verifies treasury balances, integrates with Jupiter Ultra API for optimal token swaps, and claims PumpFun creator rewards. All token burns are routed through the official Solana incinerator (`1nc1nerator11111111111111111111111111111111`). The system supports both production mode with real transaction execution and a simulation mode for testing.

### Data Storage

PostgreSQL, accessed via Neon's serverless driver and Drizzle ORM, is used for data persistence. The schema includes `Projects`, `Transactions`, and `Payments` tables with defined relationships. Key database decisions involve using UUID primary keys, decimal types for token amounts, automatic timestamp fields, and boolean flags for status management.

### Authentication & Authorization

The platform utilizes wallet-based authentication, with Solana wallet adapter integration planned. Currently, a placeholder `WalletButton` component exists, and owner wallet addresses are stored for project authorization. The owner wallet address serves as the primary user identifier.

### Production Readiness & Automated Workflow

The system is production-ready with full automation enabled. This includes a secure on-chain SOL payment verification system, comprehensive project management capabilities (including PumpFun token support and automatic creator rewards claiming), and transaction monitoring. The automated workflow for buybacks involves claiming PumpFun rewards, checking combined treasury and reward balances, executing optimal SOL to token swaps via Jupiter Ultra API, and burning tokens to the Solana incinerator. Private key management is handled via environment variables (`TREASURY_KEY_<project-id>`, `PUMPFUN_CREATOR_KEY_<project-id>`).

## External Dependencies

**Blockchain Integration:**
- Solana Web3.js for blockchain interactions
- SPL Token program for token operations
- @solana/wallet-adapter-react for wallet connection (planned)

**Payment Processing:**
- Direct Solana wallet payments in SOL to the treasury wallet: `jawKuQ3xtcYoAuqE9jyG2H35sv2pWJSzsyjoNpsxG38`
- On-chain payment verification for SOL payments

**Third-Party Services:**
- Neon Database (PostgreSQL hosting)
- Jupiter Ultra API for optimal token swaps
- PumpFun Lightning API for claiming creator rewards

**UI Dependencies:**
- Radix UI component primitives
- Lucide React (icon library)
- date-fns
- class-variance-authority, clsx, tailwind-merge

**Development Tools:**
- Vite
- TypeScript
- ESBuild

**Installed Dependencies:**
- node-cron
- @solana/web3.js
- @solana/spl-token
- bs58