/**
 * Invoice Storage Layer
 * 
 * Database operations for B2B invoicing system
 */

import {
  invoices,
  invoiceLineItems,
  payments,
  invoiceTemplates,
  businessProfiles,
  customerProfiles,
  type Invoice,
  type InsertInvoice,
  type InvoiceLineItem,
  type InsertLineItem,
  type Payment,
  type InsertPayment,
  type BusinessProfile,
  type InsertBusinessProfile,
  type CustomerProfile,
  type InsertCustomerProfile,
} from "@shared/invoice-schema";
import { db } from "./db";
import { eq, and, or, desc, asc, sql } from "drizzle-orm";

export interface IInvoiceStorage {
  // Invoice operations
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined>;
  getInvoices(invoicerWallet: string, filters?: InvoiceFilters): Promise<Invoice[]>;
  getInvoicesForCustomer(invoiceeWallet: string, filters?: InvoiceFilters): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: string): Promise<boolean>;
  
  // Line item operations
  getLineItems(invoiceId: string): Promise<InvoiceLineItem[]>;
  createLineItem(lineItem: InsertLineItem): Promise<InvoiceLineItem>;
  updateLineItem(id: string, updates: Partial<InsertLineItem>): Promise<InvoiceLineItem | undefined>;
  deleteLineItem(id: string): Promise<boolean>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  getPaymentsByWallet(walletAddress: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined>;
  
  // Business profile operations
  getBusinessProfile(walletAddress: string): Promise<BusinessProfile | undefined>;
  createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  updateBusinessProfile(walletAddress: string, updates: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined>;
  
  // Customer profile operations
  getCustomerProfile(businessWallet: string, customerWallet: string): Promise<CustomerProfile | undefined>;
  getCustomerProfiles(businessWallet: string): Promise<CustomerProfile[]>;
  createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  updateCustomerProfile(id: string, updates: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined>;
  deleteCustomerProfile(id: string): Promise<boolean>;
  
  // Stats and analytics
  getInvoiceStats(walletAddress: string): Promise<InvoiceStats>;
  getCustomerStats(businessWallet: string, customerWallet: string): Promise<CustomerStats>;
}

export interface InvoiceFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: string;
  maxAmount?: string;
  currency?: string;
  limit?: number;
  offset?: number;
}

export interface InvoiceStats {
  totalInvoices: number;
  totalAmount: string;
  paidAmount: string;
  pendingAmount: string;
  overdueCount: number;
  averagePaymentDays: number;
}

export interface CustomerStats {
  totalInvoices: number;
  totalAmount: string;
  paidAmount: string;
  averagePaymentDays: number;
  lastInvoiceDate: Date | null;
  lastPaymentDate: Date | null;
}

class InvoiceStorage implements IInvoiceStorage {
  // ===================================
  // INVOICE OPERATIONS
  // ===================================
  
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
    return invoice;
  }
  
  async getInvoiceByNumber(invoiceNumber: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, invoiceNumber))
      .limit(1);
    return invoice;
  }
  
  async getInvoices(invoicerWallet: string, filters?: InvoiceFilters): Promise<Invoice[]> {
    let query = db.select()
      .from(invoices)
      .where(eq(invoices.invoicerWalletAddress, invoicerWallet))
      .$dynamic();
    
    // Apply filters
    if (filters?.status) {
      query = query.where(eq(invoices.status, filters.status));
    }
    
    if (filters?.startDate) {
      query = query.where(sql`${invoices.invoiceDate} >= ${filters.startDate}`);
    }
    
    if (filters?.endDate) {
      query = query.where(sql`${invoices.invoiceDate} <= ${filters.endDate}`);
    }
    
    if (filters?.currency) {
      query = query.where(eq(invoices.currency, filters.currency));
    }
    
    // Sort by invoice date (newest first)
    query = query.orderBy(desc(invoices.invoiceDate));
    
    // Pagination
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }
  
  async getInvoicesForCustomer(invoiceeWallet: string, filters?: InvoiceFilters): Promise<Invoice[]> {
    let query = db.select()
      .from(invoices)
      .where(eq(invoices.invoiceeWalletAddress, invoiceeWallet))
      .$dynamic();
    
    // Apply same filters as getInvoices
    if (filters?.status) {
      query = query.where(eq(invoices.status, filters.status));
    }
    
    query = query.orderBy(desc(invoices.invoiceDate));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    return await query;
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }
  
  async updateInvoice(id: string, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updated] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }
  
  async deleteInvoice(id: string): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id)).returning();
    return result.length > 0;
  }
  
  // ===================================
  // LINE ITEM OPERATIONS
  // ===================================
  
  async getLineItems(invoiceId: string): Promise<InvoiceLineItem[]> {
    return await db.select()
      .from(invoiceLineItems)
      .where(eq(invoiceLineItems.invoiceId, invoiceId))
      .orderBy(asc(invoiceLineItems.lineNumber));
  }
  
  async createLineItem(lineItem: InsertLineItem): Promise<InvoiceLineItem> {
    const [newItem] = await db.insert(invoiceLineItems).values(lineItem).returning();
    return newItem;
  }
  
  async updateLineItem(id: string, updates: Partial<InsertLineItem>): Promise<InvoiceLineItem | undefined> {
    const [updated] = await db
      .update(invoiceLineItems)
      .set(updates)
      .where(eq(invoiceLineItems.id, id))
      .returning();
    return updated;
  }
  
  async deleteLineItem(id: string): Promise<boolean> {
    const result = await db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, id)).returning();
    return result.length > 0;
  }
  
  // ===================================
  // PAYMENT OPERATIONS
  // ===================================
  
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return payment;
  }
  
  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return await db.select()
      .from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.createdAt));
  }
  
  async getPaymentsByWallet(walletAddress: string): Promise<Payment[]> {
    return await db.select()
      .from(payments)
      .where(or(
        eq(payments.fromAddress, walletAddress),
        eq(payments.toAddress, walletAddress)
      ))
      .orderBy(desc(payments.createdAt));
  }
  
  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    
    // Update invoice paid amount and status
    const invoice = await this.getInvoice(payment.invoiceId);
    if (invoice) {
      // NOTE: Using parseFloat for financial calculations
      // For production with high-precision requirements, consider:
      // - Using decimal.js or bignumber.js library
      // - Storing amounts as integers (e.g., cents/lamports)
      // - Using database NUMERIC type with adequate precision
      const newPaidAmount = parseFloat(invoice.paidAmount) + parseFloat(payment.amount);
      const totalAmount = parseFloat(invoice.totalAmount);
      const remainingAmount = totalAmount - newPaidAmount;
      
      let newStatus = invoice.status;
      if (remainingAmount <= 0) {
        newStatus = "paid";
      } else if (newPaidAmount > 0) {
        newStatus = "partial";
      }
      
      await this.updateInvoice(payment.invoiceId, {
        paidAmount: newPaidAmount.toString(),
        remainingAmount: Math.max(0, remainingAmount).toString(),
        status: newStatus,
        paidAt: remainingAmount <= 0 ? new Date() : invoice.paidAt,
      });
    }
    
    return newPayment;
  }
  
  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, id))
      .returning();
    return updated;
  }
  
  // ===================================
  // BUSINESS PROFILE OPERATIONS
  // ===================================
  
  async getBusinessProfile(walletAddress: string): Promise<BusinessProfile | undefined> {
    const [profile] = await db.select()
      .from(businessProfiles)
      .where(eq(businessProfiles.ownerWalletAddress, walletAddress))
      .limit(1);
    return profile;
  }
  
  async createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile> {
    const [newProfile] = await db.insert(businessProfiles).values(profile).returning();
    return newProfile;
  }
  
  async updateBusinessProfile(walletAddress: string, updates: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined> {
    const [updated] = await db
      .update(businessProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businessProfiles.ownerWalletAddress, walletAddress))
      .returning();
    return updated;
  }
  
  // ===================================
  // CUSTOMER PROFILE OPERATIONS
  // ===================================
  
  async getCustomerProfile(businessWallet: string, customerWallet: string): Promise<CustomerProfile | undefined> {
    const [profile] = await db.select()
      .from(customerProfiles)
      .where(and(
        eq(customerProfiles.businessWalletAddress, businessWallet),
        eq(customerProfiles.customerWalletAddress, customerWallet)
      ))
      .limit(1);
    return profile;
  }
  
  async getCustomerProfiles(businessWallet: string): Promise<CustomerProfile[]> {
    return await db.select()
      .from(customerProfiles)
      .where(eq(customerProfiles.businessWalletAddress, businessWallet))
      .orderBy(desc(customerProfiles.createdAt));
  }
  
  async createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    const [newProfile] = await db.insert(customerProfiles).values(profile).returning();
    return newProfile;
  }
  
  async updateCustomerProfile(id: string, updates: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined> {
    const [updated] = await db
      .update(customerProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerProfiles.id, id))
      .returning();
    return updated;
  }
  
  async deleteCustomerProfile(id: string): Promise<boolean> {
    const result = await db.delete(customerProfiles).where(eq(customerProfiles.id, id)).returning();
    return result.length > 0;
  }
  
  // ===================================
  // STATS AND ANALYTICS
  // ===================================
  
  async getInvoiceStats(walletAddress: string): Promise<InvoiceStats> {
    const allInvoices = await this.getInvoices(walletAddress);
    
    const totalInvoices = allInvoices.length;
    const totalAmount = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    const paidAmount = allInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);
    const pendingAmount = totalAmount - paidAmount;
    
    // Count overdue invoices (past due date and not fully paid)
    const now = new Date();
    const overdueCount = allInvoices.filter(inv => 
      inv.status !== "paid" && 
      inv.status !== "cancelled" &&
      inv.dueDate < now
    ).length;
    
    // Calculate average payment days for paid invoices
    const paidInvoices = allInvoices.filter(inv => inv.status === "paid" && inv.paidAt);
    const averagePaymentDays = paidInvoices.length > 0
      ? paidInvoices.reduce((sum, inv) => {
          const days = Math.floor((inv.paidAt!.getTime() - inv.invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / paidInvoices.length
      : 0;
    
    return {
      totalInvoices,
      totalAmount: totalAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      pendingAmount: pendingAmount.toFixed(2),
      overdueCount,
      averagePaymentDays: Math.round(averagePaymentDays),
    };
  }
  
  async getCustomerStats(businessWallet: string, customerWallet: string): Promise<CustomerStats> {
    const customerInvoices = await db.select()
      .from(invoices)
      .where(and(
        eq(invoices.invoicerWalletAddress, businessWallet),
        eq(invoices.invoiceeWalletAddress, customerWallet)
      ));
    
    const totalInvoices = customerInvoices.length;
    const totalAmount = customerInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount), 0);
    const paidAmount = customerInvoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount), 0);
    
    // Calculate average payment days
    const paidInvoices = customerInvoices.filter(inv => inv.status === "paid" && inv.paidAt);
    const averagePaymentDays = paidInvoices.length > 0
      ? paidInvoices.reduce((sum, inv) => {
          const days = Math.floor((inv.paidAt!.getTime() - inv.invoiceDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0) / paidInvoices.length
      : 0;
    
    const lastInvoiceDate = customerInvoices.length > 0
      ? customerInvoices.reduce((latest, inv) => inv.invoiceDate > latest ? inv.invoiceDate : latest, customerInvoices[0].invoiceDate)
      : null;
    
    const lastPaymentDate = paidInvoices.length > 0
      ? paidInvoices.reduce((latest, inv) => inv.paidAt! > latest ? inv.paidAt! : latest, paidInvoices[0].paidAt!)
      : null;
    
    return {
      totalInvoices,
      totalAmount: totalAmount.toFixed(2),
      paidAmount: paidAmount.toFixed(2),
      averagePaymentDays: Math.round(averagePaymentDays),
      lastInvoiceDate,
      lastPaymentDate,
    };
  }
}

// Singleton instance
const invoiceStorage = new InvoiceStorage();
export { invoiceStorage };
