/**
 * Invoice API Routes
 * 
 * Complete REST API for B2B invoicing system
 */

import type { Express } from "express";
import { invoiceStorage } from "./invoice-storage";
import { 
  insertInvoiceSchema, 
  insertLineItemSchema, 
  insertPaymentSchema,
  insertBusinessProfileSchema,
  insertCustomerProfileSchema,
  type Invoice 
} from "@shared/invoice-schema";
import { fromZodError } from "zod-validation-error";
import { requireWalletOwnership, strictRateLimit } from "./security";
import { getArciumService, loadKeypairFromPrivateKey } from "./arcium-service";

/**
 * Register invoice-related API routes
 */
export function registerInvoiceRoutes(app: Express): void {
  
  // ============================================
  // INVOICE ROUTES
  // ============================================
  
  /**
   * Create a new invoice
   * POST /api/invoices
   */
  app.post("/api/invoices", strictRateLimit, async (req, res) => {
    try {
      const validatedData = insertInvoiceSchema.parse(req.body);
      
      // Auto-calculate remaining amount
      const totalAmount = parseFloat(validatedData.totalAmount);
      const paidAmount = parseFloat(validatedData.paidAmount || "0");
      const remainingAmount = totalAmount - paidAmount;
      
      // Create invoice
      const invoice = await invoiceStorage.createInvoice({
        ...validatedData,
        remainingAmount: remainingAmount.toString(),
      });
      
      // If Arcium encryption is requested, encrypt sensitive data
      if (req.body.encryptWithArcium && req.body.allowedParties) {
        const arciumService = getArciumService();
        if (arciumService.isAvailable()) {
          const encryptedResult = await arciumService.encryptTransaction(
            {
              amount: invoice.totalAmount,
              tokenAmount: invoice.totalAmount,
              fromAddress: invoice.invoicerWalletAddress,
              toAddress: invoice.invoiceeWalletAddress,
              txSignature: invoice.invoiceNumber,
              timestamp: Date.now(),
            },
            req.body.allowedParties
          );
          
          if (encryptedResult.success) {
            await invoiceStorage.updateInvoice(invoice.id, {
              isArciumEncrypted: true,
              arciumEncryptedData: encryptedResult.encryptedData,
              arciumEncryptionKey: encryptedResult.encryptionKey,
              arciumComputationId: encryptedResult.mxeComputationId,
              arciumAllowedParties: req.body.allowedParties,
            });
          }
        }
      }
      
      res.status(201).json({
        success: true,
        invoice,
        message: "Invoice created successfully",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get invoices for authenticated wallet
   * GET /api/invoices?wallet=xxx&status=xxx&limit=xxx
   */
  app.get("/api/invoices", requireWalletOwnership, async (req, res) => {
    try {
      const walletAddress = req.query.wallet as string;
      const filters = {
        status: req.query.status as string | undefined,
        currency: req.query.currency as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      
      // Get invoices where user is invoicer OR invoicee
      const sentInvoices = await invoiceStorage.getInvoices(walletAddress, filters);
      const receivedInvoices = await invoiceStorage.getInvoicesForCustomer(walletAddress, filters);
      
      // Combine and deduplicate
      const allInvoices = [...sentInvoices, ...receivedInvoices];
      const uniqueInvoices = Array.from(
        new Map(allInvoices.map(inv => [inv.id, inv])).values()
      );
      
      res.json({
        success: true,
        invoices: uniqueInvoices,
        count: uniqueInvoices.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get single invoice by ID
   * GET /api/invoices/:id?wallet=xxx
   */
  app.get("/api/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const walletAddress = req.query.wallet as string;
      
      const invoice = await invoiceStorage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verify wallet has access (either invoicer or invoicee)
      if (walletAddress) {
        const hasAccess = 
          invoice.invoicerWalletAddress === walletAddress ||
          invoice.invoiceeWalletAddress === walletAddress;
        
        if (!hasAccess) {
          return res.status(403).json({ 
            message: "Unauthorized: You don't have access to this invoice" 
          });
        }
      } else if (invoice.isPrivate) {
        // If private and no wallet provided, hide sensitive data
        return res.status(403).json({ 
          message: "Authentication required: This invoice is private" 
        });
      }
      
      // Get line items
      const lineItems = await invoiceStorage.getLineItems(id);
      
      res.json({
        success: true,
        invoice: {
          ...invoice,
          lineItems,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get invoice by invoice number
   * GET /api/invoices/number/:invoiceNumber?wallet=xxx
   */
  app.get("/api/invoices/number/:invoiceNumber", async (req, res) => {
    try {
      const { invoiceNumber } = req.params;
      const walletAddress = req.query.wallet as string;
      
      const invoice = await invoiceStorage.getInvoiceByNumber(invoiceNumber);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verify access
      if (walletAddress) {
        const hasAccess = 
          invoice.invoicerWalletAddress === walletAddress ||
          invoice.invoiceeWalletAddress === walletAddress;
        
        if (!hasAccess) {
          return res.status(403).json({ 
            message: "Unauthorized: You don't have access to this invoice" 
          });
        }
      } else if (invoice.isPrivate) {
        return res.status(403).json({ 
          message: "Authentication required: This invoice is private" 
        });
      }
      
      const lineItems = await invoiceStorage.getLineItems(invoice.id);
      
      res.json({
        success: true,
        invoice: {
          ...invoice,
          lineItems,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Update invoice
   * PATCH /api/invoices/:id?wallet=xxx
   */
  app.patch("/api/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const walletAddress = req.query.wallet as string;
      
      const invoice = await invoiceStorage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Only invoicer can update
      if (invoice.invoicerWalletAddress !== walletAddress) {
        return res.status(403).json({ 
          message: "Unauthorized: Only the invoicer can update this invoice" 
        });
      }
      
      // Don't allow updating paid invoices
      if (invoice.status === "paid") {
        return res.status(400).json({ 
          message: "Cannot update a paid invoice" 
        });
      }
      
      const updated = await invoiceStorage.updateInvoice(id, req.body);
      
      res.json({
        success: true,
        invoice: updated,
        message: "Invoice updated successfully",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Delete/Cancel invoice
   * DELETE /api/invoices/:id?wallet=xxx
   */
  app.delete("/api/invoices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const walletAddress = req.query.wallet as string;
      
      const invoice = await invoiceStorage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Only invoicer can delete
      if (invoice.invoicerWalletAddress !== walletAddress) {
        return res.status(403).json({ 
          message: "Unauthorized: Only the invoicer can delete this invoice" 
        });
      }
      
      // Can only delete draft invoices
      if (invoice.status !== "draft") {
        // Instead of deleting, mark as cancelled
        await invoiceStorage.updateInvoice(id, {
          status: "cancelled",
          cancelledAt: new Date(),
        });
        
        return res.json({
          success: true,
          message: "Invoice cancelled successfully",
        });
      }
      
      const success = await invoiceStorage.deleteInvoice(id);
      
      res.json({
        success,
        message: success ? "Invoice deleted successfully" : "Failed to delete invoice",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get invoice statistics for a wallet
   * GET /api/invoices/stats?wallet=xxx
   */
  app.get("/api/invoices/stats", requireWalletOwnership, async (req, res) => {
    try {
      const walletAddress = req.query.wallet as string;
      const stats = await invoiceStorage.getInvoiceStats(walletAddress);
      
      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // LINE ITEM ROUTES
  // ============================================
  
  /**
   * Add line item to invoice
   * POST /api/invoices/:id/line-items
   */
  app.post("/api/invoices/:id/line-items", async (req, res) => {
    try {
      const { id } = req.params;
      const walletAddress = req.query.wallet as string;
      
      const invoice = await invoiceStorage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Only invoicer can add line items
      if (invoice.invoicerWalletAddress !== walletAddress) {
        return res.status(403).json({ 
          message: "Unauthorized: Only the invoicer can add line items" 
        });
      }
      
      const validatedData = insertLineItemSchema.parse({
        ...req.body,
        invoiceId: id,
      });
      
      const lineItem = await invoiceStorage.createLineItem(validatedData);
      
      res.status(201).json({
        success: true,
        lineItem,
        message: "Line item added successfully",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Update line item
   * PATCH /api/line-items/:id
   */
  app.patch("/api/line-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await invoiceStorage.updateLineItem(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Line item not found" });
      }
      
      res.json({
        success: true,
        lineItem: updated,
        message: "Line item updated successfully",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Delete line item
   * DELETE /api/line-items/:id
   */
  app.delete("/api/line-items/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await invoiceStorage.deleteLineItem(id);
      
      res.json({
        success,
        message: success ? "Line item deleted successfully" : "Failed to delete line item",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // PAYMENT ROUTES
  // ============================================
  
  /**
   * Record a payment for an invoice
   * POST /api/payments
   */
  app.post("/api/payments", strictRateLimit, async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      
      // Verify invoice exists
      const invoice = await invoiceStorage.getInvoice(validatedData.invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verify payment currency matches invoice
      if (validatedData.currency !== invoice.currency) {
        return res.status(400).json({ 
          message: `Payment currency (${validatedData.currency}) must match invoice currency (${invoice.currency})` 
        });
      }
      
      // Create payment (this auto-updates invoice status)
      const payment = await invoiceStorage.createPayment(validatedData);
      
      // Get updated invoice
      const updatedInvoice = await invoiceStorage.getInvoice(validatedData.invoiceId);
      
      res.status(201).json({
        success: true,
        payment,
        invoice: updatedInvoice,
        message: "Payment recorded successfully",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get payments for an invoice
   * GET /api/invoices/:id/payments?wallet=xxx
   */
  app.get("/api/invoices/:id/payments", async (req, res) => {
    try {
      const { id } = req.params;
      const walletAddress = req.query.wallet as string;
      
      const invoice = await invoiceStorage.getInvoice(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verify access
      const hasAccess = 
        invoice.invoicerWalletAddress === walletAddress ||
        invoice.invoiceeWalletAddress === walletAddress;
      
      if (!hasAccess) {
        return res.status(403).json({ 
          message: "Unauthorized: You don't have access to this invoice's payments" 
        });
      }
      
      const payments = await invoiceStorage.getPaymentsByInvoice(id);
      
      res.json({
        success: true,
        payments,
        count: payments.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get payments for a wallet
   * GET /api/payments?wallet=xxx
   */
  app.get("/api/payments", requireWalletOwnership, async (req, res) => {
    try {
      const walletAddress = req.query.wallet as string;
      const payments = await invoiceStorage.getPaymentsByWallet(walletAddress);
      
      res.json({
        success: true,
        payments,
        count: payments.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // BUSINESS PROFILE ROUTES
  // ============================================
  
  /**
   * Create or update business profile
   * POST /api/business/profile
   */
  app.post("/api/business/profile", async (req, res) => {
    try {
      const validatedData = insertBusinessProfileSchema.parse(req.body);
      
      // Check if profile exists
      const existing = await invoiceStorage.getBusinessProfile(validatedData.ownerWalletAddress);
      
      if (existing) {
        // Update existing
        const updated = await invoiceStorage.updateBusinessProfile(
          validatedData.ownerWalletAddress,
          validatedData
        );
        
        return res.json({
          success: true,
          profile: updated,
          message: "Business profile updated successfully",
        });
      }
      
      // Create new
      const profile = await invoiceStorage.createBusinessProfile(validatedData);
      
      res.status(201).json({
        success: true,
        profile,
        message: "Business profile created successfully",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get business profile
   * GET /api/business/profile?wallet=xxx
   */
  app.get("/api/business/profile", requireWalletOwnership, async (req, res) => {
    try {
      const walletAddress = req.query.wallet as string;
      const profile = await invoiceStorage.getBusinessProfile(walletAddress);
      
      if (!profile) {
        return res.status(404).json({ message: "Business profile not found" });
      }
      
      res.json({
        success: true,
        profile,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // CUSTOMER PROFILE ROUTES
  // ============================================
  
  /**
   * Create customer profile
   * POST /api/customers
   */
  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerProfileSchema.parse(req.body);
      
      // Check if customer already exists
      const existing = await invoiceStorage.getCustomerProfile(
        validatedData.businessWalletAddress,
        validatedData.customerWalletAddress
      );
      
      if (existing) {
        return res.status(400).json({ 
          message: "Customer already exists for this business" 
        });
      }
      
      const customer = await invoiceStorage.createCustomerProfile(validatedData);
      
      res.status(201).json({
        success: true,
        customer,
        message: "Customer profile created successfully",
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get all customers for a business
   * GET /api/customers?wallet=xxx
   */
  app.get("/api/customers", requireWalletOwnership, async (req, res) => {
    try {
      const businessWallet = req.query.wallet as string;
      const customers = await invoiceStorage.getCustomerProfiles(businessWallet);
      
      res.json({
        success: true,
        customers,
        count: customers.length,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Get customer statistics
   * GET /api/customers/:customerWallet/stats?wallet=xxx
   */
  app.get("/api/customers/:customerWallet/stats", requireWalletOwnership, async (req, res) => {
    try {
      const { customerWallet } = req.params;
      const businessWallet = req.query.wallet as string;
      
      const stats = await invoiceStorage.getCustomerStats(businessWallet, customerWallet);
      
      res.json({
        success: true,
        stats,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Update customer profile
   * PATCH /api/customers/:id
   */
  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await invoiceStorage.updateCustomerProfile(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json({
        success: true,
        customer: updated,
        message: "Customer profile updated successfully",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  /**
   * Delete customer profile
   * DELETE /api/customers/:id
   */
  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await invoiceStorage.deleteCustomerProfile(id);
      
      res.json({
        success,
        message: success ? "Customer deleted successfully" : "Failed to delete customer",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================
  // PUBLIC STATS (ANONYMIZED)
  // ============================================
  
  /**
   * Get public invoice statistics
   * GET /api/public/invoice-stats
   */
  app.get("/api/public/invoice-stats", async (req, res) => {
    try {
      // Return only aggregated, anonymized stats
      // This would need to be implemented in storage layer
      res.json({
        success: true,
        stats: {
          message: "Public stats endpoint - to be implemented",
          // totalPublicInvoices: 0,
          // totalPaymentsProcessed: 0,
          // averagePaymentTime: 0,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}
