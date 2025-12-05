/**
 * B2B Invoicing System Schema
 * 
 * Defines database tables for a privacy-first invoicing system on Solana
 * with Arcium v0.5 encryption for confidential transactions
 */

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, integer, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ============================================
// CORE INVOICING TABLES
// ============================================

/**
 * Invoices - Main invoice records
 * Stores invoice metadata and encrypted details using Arcium
 */
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(), // Human-readable invoice #
  
  // Parties (invoicer and invoicee)
  invoicerWalletAddress: text("invoicer_wallet_address").notNull(), // Business sending invoice
  invoiceeWalletAddress: text("invoicee_wallet_address").notNull(), // Customer receiving invoice
  
  // Invoice Details
  invoiceDate: timestamp("invoice_date").notNull().defaultNow(),
  dueDate: timestamp("due_date").notNull(),
  description: text("description"), // Brief description
  notes: text("notes"), // Internal notes
  
  // Currency and Amounts
  currency: text("currency").notNull().default("USDC"), // USDC, SOL, EURC, etc.
  tokenMintAddress: text("token_mint_address").notNull(), // SPL token mint for payment
  tokenDecimals: integer("token_decimals").notNull().default(6), // Usually 6 for USDC, 9 for SOL
  
  subtotal: decimal("subtotal", { precision: 18, scale: 9 }).notNull(), // Sum of line items
  taxAmount: decimal("tax_amount", { precision: 18, scale: 9 }).notNull().default("0"),
  discountAmount: decimal("discount_amount", { precision: 18, scale: 9 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 18, scale: 9 }).notNull(), // Final amount due
  
  // Payment Status
  status: text("status").notNull().default("draft"), // draft, sent, viewed, partial, paid, overdue, cancelled
  paidAmount: decimal("paid_amount", { precision: 18, scale: 9 }).notNull().default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 18, scale: 9 }).notNull(),
  
  // Payment Details
  paymentTerms: text("payment_terms"), // e.g., "Net 30", "Due on receipt"
  paymentInstructions: text("payment_instructions"), // Instructions for customer
  
  // Privacy Settings (leveraging our privacy implementation)
  isPrivate: boolean("is_private").notNull().default(true),
  hideAmounts: boolean("hide_amounts").notNull().default(true), // Hide amounts from public view
  hideParties: boolean("hide_parties").notNull().default(true), // Hide wallet addresses
  
  // Arcium v0.5 Confidential Computing
  isArciumEncrypted: boolean("is_arcium_encrypted").notNull().default(false),
  arciumEncryptedData: text("arcium_encrypted_data"), // Encrypted invoice details
  arciumEncryptionKey: text("arcium_encryption_key"),
  arciumComputationId: text("arcium_computation_id"),
  arciumAllowedParties: text("arcium_allowed_parties").array(), // Can include auditors
  
  // x402 Micropayment Fee (for using invoice service)
  x402ServiceFeeUSD: decimal("x402_service_fee_usd", { precision: 18, scale: 6 }).notNull().default("0.01"), // $0.01 per invoice
  x402FeePaid: boolean("x402_fee_paid").notNull().default(false),
  x402PaymentSignature: text("x402_payment_signature"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  sentAt: timestamp("sent_at"), // When invoice was sent to customer
  viewedAt: timestamp("viewed_at"), // When customer first viewed
  paidAt: timestamp("paid_at"), // When fully paid
  cancelledAt: timestamp("cancelled_at"),
});

/**
 * Invoice Line Items - Individual products/services on an invoice
 */
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  
  // Line Item Details
  lineNumber: integer("line_number").notNull(), // Order of items (1, 2, 3...)
  description: text("description").notNull(), // Product or service description
  
  // Quantity and Pricing
  quantity: decimal("quantity", { precision: 18, scale: 4 }).notNull().default("1"),
  unitPrice: decimal("unit_price", { precision: 18, scale: 9 }).notNull(),
  lineTotal: decimal("line_total", { precision: 18, scale: 9 }).notNull(), // quantity * unitPrice
  
  // Optional Tax/Discount per line
  taxRate: decimal("tax_rate", { precision: 5, scale: 2 }), // e.g., 8.5 for 8.5%
  discountRate: decimal("discount_rate", { precision: 5, scale: 2 }), // e.g., 10 for 10% off
  
  // Product/Service Metadata
  sku: text("sku"), // Product SKU if applicable
  category: text("category"), // e.g., "Consulting", "Software", "Hardware"
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * Payments - Payment records for invoices
 * Tracks individual payment transactions on Solana
 */
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id),
  
  // Payment Details
  paymentNumber: text("payment_number").notNull(), // Human-readable payment reference
  paymentMethod: text("payment_method").notNull().default("solana"), // solana, bank_transfer, etc.
  
  amount: decimal("amount", { precision: 18, scale: 9 }).notNull(),
  currency: text("currency").notNull(), // Should match invoice currency
  
  // Solana Transaction
  txSignature: text("tx_signature").notNull().unique(), // On-chain signature
  fromAddress: text("from_address").notNull(), // Payer wallet
  toAddress: text("to_address").notNull(), // Recipient wallet (invoicer)
  blockTime: timestamp("block_time"), // When tx was confirmed on-chain
  slot: integer("slot"), // Solana slot number
  
  // Payment Status
  status: text("status").notNull().default("pending"), // pending, confirmed, failed
  confirmations: integer("confirmations").notNull().default(0),
  
  // Arcium Encryption (optional - for sensitive payment notes)
  isArciumEncrypted: boolean("is_arcium_encrypted").notNull().default(false),
  arciumEncryptedData: text("arcium_encrypted_data"),
  arciumEncryptionKey: text("arcium_encryption_key"),
  
  // Metadata
  paymentNotes: text("payment_notes"), // Optional notes from payer
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

/**
 * Invoice Templates - Reusable invoice templates for businesses
 */
export const invoiceTemplates = pgTable("invoice_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Template Metadata
  name: text("name").notNull(), // e.g., "Monthly Consulting", "Hourly Services"
  description: text("description"),
  ownerWalletAddress: text("owner_wallet_address").notNull(),
  
  // Default Settings
  defaultCurrency: text("default_currency").notNull().default("USDC"),
  defaultTokenMintAddress: text("default_token_mint_address").notNull(),
  defaultPaymentTerms: text("default_payment_terms").default("Net 30"),
  defaultDueDays: integer("default_due_days").notNull().default(30), // Days until due
  
  // Default Line Items (JSON array)
  defaultLineItems: text("default_line_items"), // JSON: [{ description, quantity, unitPrice }]
  
  // Template Settings
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Business Profiles - Store business information for invoicers
 */
export const businessProfiles = pgTable("business_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerWalletAddress: text("owner_wallet_address").notNull().unique(),
  
  // Business Information
  businessName: text("business_name").notNull(),
  businessEmail: text("business_email"),
  businessPhone: text("business_phone"),
  businessAddress: text("business_address"),
  businessWebsite: text("business_website"),
  
  // Tax Information
  taxId: text("tax_id"), // EIN, VAT number, etc.
  taxRegistrationNumber: text("tax_registration_number"),
  
  // Branding
  logoUrl: text("logo_url"),
  brandColor: text("brand_color").default("#3b82f6"), // Hex color
  
  // Invoice Settings
  defaultInvoicePrefix: text("default_invoice_prefix").default("INV"), // e.g., "INV-2025-001"
  nextInvoiceNumber: integer("next_invoice_number").notNull().default(1),
  defaultPaymentTerms: text("default_payment_terms").default("Net 30"),
  
  // Privacy Preferences
  defaultPrivacySettings: boolean("default_privacy_settings").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Customer Profiles - Store customer information for invoicees
 */
export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessWalletAddress: text("business_wallet_address").notNull(), // Invoicer who owns this customer
  customerWalletAddress: text("customer_wallet_address").notNull(), // Customer's wallet
  
  // Customer Information
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email"),
  customerPhone: text("customer_phone"),
  customerAddress: text("customer_address"),
  
  // Business Relationship
  customerNotes: text("customer_notes"),
  paymentTerms: text("payment_terms").default("Net 30"), // Custom terms for this customer
  
  // Stats
  totalInvoicesSent: integer("total_invoices_sent").notNull().default(0),
  totalAmountInvoiced: decimal("total_amount_invoiced", { precision: 18, scale: 9 }).notNull().default("0"),
  totalAmountPaid: decimal("total_amount_paid", { precision: 18, scale: 9 }).notNull().default("0"),
  averagePaymentDays: integer("average_payment_days"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============================================
// EXISTING TABLES (Adapted from legacy)
// ============================================

/**
 * x402 Micropayments - For invoice service fees
 * Repurposed from trading bot to invoice service payments
 */
export const x402Micropayments = pgTable("x402_micropayments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerWalletAddress: text("owner_wallet_address").notNull(),
  
  // Payment details
  paymentType: text("payment_type").notNull(), // "invoice_creation", "invoice_send", "payment_processing"
  resourceUrl: text("resource_url").notNull(),
  amountUSDC: decimal("amount_usdc", { precision: 18, scale: 6 }).notNull(),
  amountMicroUSDC: text("amount_micro_usdc").notNull(),
  
  // Transaction details
  txSignature: text("tx_signature").notNull(),
  network: text("network").notNull().default("solana-mainnet"),
  status: text("status").notNull().default("pending"),
  
  // x402 protocol metadata
  x402Version: integer("x402_version").notNull().default(1),
  paymentScheme: text("payment_scheme").notNull().default("exact"),
  facilitatorUrl: text("facilitator_url"),
  description: text("description"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

// ============================================
// RELATIONS
// ============================================

export const invoicesRelations = relations(invoices, ({ many, one }) => ({
  lineItems: many(invoiceLineItems),
  payments: many(payments),
}));

export const invoiceLineItemsRelations = relations(invoiceLineItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceLineItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
}));

// ============================================
// ZOD VALIDATION SCHEMAS
// ============================================

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  invoicerWalletAddress: z.string().min(32, "Invalid Solana wallet address"),
  invoiceeWalletAddress: z.string().min(32, "Invalid Solana wallet address"),
  tokenMintAddress: z.string().min(32, "Invalid token mint address"),
  totalAmount: z.string().refine(val => parseFloat(val) > 0, "Total amount must be positive"),
  dueDate: z.date().or(z.string()),
});

export const insertLineItemSchema = createInsertSchema(invoiceLineItems).omit({
  id: true,
  createdAt: true,
}).extend({
  invoiceId: z.string().uuid(),
  quantity: z.string().refine(val => parseFloat(val) > 0, "Quantity must be positive"),
  unitPrice: z.string().refine(val => parseFloat(val) >= 0, "Unit price cannot be negative"),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
}).extend({
  invoiceId: z.string().uuid(),
  txSignature: z.string().min(87, "Invalid Solana transaction signature"),
  amount: z.string().refine(val => parseFloat(val) > 0, "Payment amount must be positive"),
});

export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  ownerWalletAddress: z.string().min(32, "Invalid Solana wallet address"),
  businessName: z.string().min(1, "Business name required"),
});

export const insertCustomerProfileSchema = createInsertSchema(customerProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  businessWalletAddress: z.string().min(32, "Invalid Solana wallet address"),
  customerWalletAddress: z.string().min(32, "Invalid Solana wallet address"),
  customerName: z.string().min(1, "Customer name required"),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertLineItem = z.infer<typeof insertLineItemSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;

export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = z.infer<typeof insertCustomerProfileSchema>;

export type X402Micropayment = typeof x402Micropayments.$inferSelect;
