/**
 * pNFT Service for B2B Invoicing System
 * 
 * Implements programmable NFTs for:
 * 1. Invoice NFTs - Each invoice as a tradeable NFT
 * 2. Payment Receipt NFTs - Proof of payment for tax/audit
 * 3. Business Identity NFTs - Verified business credentials
 * 
 * Using Metaplex Bubblegum for compressed NFTs (95% cost savings)
 * Cost: ~$0.001 per NFT vs $0.02 for standard NFTs
 */

import {
  createTree,
  mintV1,
  transferV1,
  burnV1,
  updateMetadata,
  CreateTreeArgs,
  MintV1Args,
  TransferV1Args,
  BurnV1Args,
} from "@metaplex-foundation/mpl-bubblegum";
import {
  createNft,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createGenericFile,
  generateSigner,
  percentAmount,
  publicKey as toPublicKey,
  some,
  none,
  Umi,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { PublicKey, Keypair } from "@solana/web3.js";
import type {
  SelectInvoice,
  SelectPayment,
  SelectBusinessProfile,
} from "@shared/invoice-schema";

/**
 * NFT Metadata for Invoice
 */
interface InvoiceNFTMetadata {
  name: string;
  symbol: string;
  uri: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
    display_type?: string;
  }>;
  properties: {
    category: string;
    creators: Array<{
      address: string;
      share: number;
      verified?: boolean;
    }>;
  };
}

/**
 * Configuration for NFT minting
 */
interface NFTMintConfig {
  autoMint: boolean; // Auto-mint invoices on creation
  merkleTreeAddress?: string; // Existing tree or create new
  maxDepth: number; // Tree depth (affects max NFTs)
  maxBufferSize: number; // Buffer size
  canopyDepth: number; // Canopy depth for cheaper transfers
}

/**
 * Default NFT configuration
 */
const DEFAULT_CONFIG: NFTMintConfig = {
  autoMint: true,
  maxDepth: 14, // Supports 16,384 NFTs
  maxBufferSize: 64,
  canopyDepth: 11, // Cheaper transfers
};

/**
 * Invoice NFT Service
 * Handles all NFT operations for the invoicing system
 */
export class InvoiceNFTService {
  private umi: Umi;
  private config: NFTMintConfig;
  private merkleTree: string | null = null;
  private initialized: boolean = false;

  constructor(
    rpcEndpoint?: string,
    config: Partial<NFTMintConfig> = {}
  ) {
    const endpoint = rpcEndpoint || process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
    this.umi = createUmi(endpoint);
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the NFT service
   * Creates merkle tree if needed
   */
  async initialize(payerKeypair?: Keypair): Promise<boolean> {
    try {
      // Set up UMI with payer if provided
      if (payerKeypair) {
        // Convert Solana Keypair to Umi format
        const umiKeypair = this.umi.eddsa.createKeypairFromSecretKey(
          payerKeypair.secretKey
        );
        this.umi.use({ install: (umi) => { umi.payer = umiKeypair; } });
      }

      // Create or use existing merkle tree
      if (this.config.merkleTreeAddress) {
        this.merkleTree = this.config.merkleTreeAddress;
      } else {
        await this.createMerkleTree();
      }

      this.initialized = true;
      console.log("✅ Invoice NFT service initialized");
      console.log(`   Merkle Tree: ${this.merkleTree}`);
      console.log(`   Auto-mint: ${this.config.autoMint}`);
      
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize NFT service:", error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.initialized && this.merkleTree !== null;
  }

  /**
   * Create a new merkle tree for compressed NFTs
   */
  private async createMerkleTree(): Promise<string> {
    try {
      const merkleTreeSigner = generateSigner(this.umi);
      
      const createTreeIx = createTree(this.umi, {
        merkleTree: merkleTreeSigner,
        maxDepth: this.config.maxDepth,
        maxBufferSize: this.config.maxBufferSize,
        canopyDepth: this.config.canopyDepth,
      });

      await createTreeIx.sendAndConfirm(this.umi);
      
      this.merkleTree = merkleTreeSigner.publicKey.toString();
      console.log(`✅ Created merkle tree: ${this.merkleTree}`);
      
      return this.merkleTree;
    } catch (error) {
      console.error("❌ Failed to create merkle tree:", error);
      throw error;
    }
  }

  /**
   * Mint Invoice NFT
   * Creates a compressed NFT for an invoice
   */
  async mintInvoiceNFT(
    invoice: SelectInvoice,
    ownerAddress: string
  ): Promise<{
    mint: string;
    merkleTree: string;
    leafIndex: number;
    signature: string;
  }> {
    if (!this.isReady()) {
      throw new Error("NFT service not initialized");
    }

    try {
      // Generate metadata
      const metadata = this.generateInvoiceMetadata(invoice);
      
      // Upload metadata (in production, use Arweave or IPFS)
      const metadataUri = await this.uploadMetadata(metadata, `invoice-${invoice.id}`);

      // Mint compressed NFT
      const leafOwner = toPublicKey(ownerAddress);
      const merkleTreePubkey = toPublicKey(this.merkleTree!);
      
      const mintIx = mintV1(this.umi, {
        leafOwner,
        merkleTree: merkleTreePubkey,
        metadata: {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadataUri,
          sellerFeeBasisPoints: 0,
          collection: none(),
          creators: [
            {
              address: toPublicKey(invoice.invoicerWalletAddress),
              verified: true,
              share: 100,
            },
          ],
        },
      });

      const result = await mintIx.sendAndConfirm(this.umi);
      
      // Extract leaf index from transaction (simplified - actual implementation needs parsing)
      const leafIndex = 0; // Would parse from transaction logs
      
      console.log(`✅ Minted invoice NFT for invoice ${invoice.invoiceNumber}`);
      
      return {
        mint: result.signature.toString(),
        merkleTree: this.merkleTree!,
        leafIndex,
        signature: result.signature.toString(),
      };
    } catch (error) {
      console.error(`❌ Failed to mint invoice NFT:`, error);
      throw error;
    }
  }

  /**
   * Mint Payment Receipt NFT
   * Creates NFT proof of payment for tax/audit purposes
   */
  async mintPaymentReceiptNFT(
    payment: SelectPayment,
    invoice: SelectInvoice,
    recipientAddress: string
  ): Promise<{
    mint: string;
    signature: string;
  }> {
    if (!this.isReady()) {
      throw new Error("NFT service not initialized");
    }

    try {
      // Generate payment receipt metadata
      const metadata = this.generatePaymentReceiptMetadata(payment, invoice);
      
      // Upload metadata
      const metadataUri = await this.uploadMetadata(
        metadata,
        `payment-${payment.id}`
      );

      // Mint as standard NFT (receipts should be permanent, not compressed)
      const mint = generateSigner(this.umi);
      
      const createNftIx = createNft(this.umi, {
        mint,
        name: metadata.name,
        symbol: metadata.symbol,
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0),
        tokenStandard: TokenStandard.NonFungible,
        creators: [
          {
            address: toPublicKey(payment.fromAddress),
            verified: true,
            share: 100,
          },
        ],
      });

      const result = await createNftIx.sendAndConfirm(this.umi);
      
      console.log(`✅ Minted payment receipt NFT for payment ${payment.id}`);
      
      return {
        mint: mint.publicKey.toString(),
        signature: result.signature.toString(),
      };
    } catch (error) {
      console.error(`❌ Failed to mint payment receipt NFT:`, error);
      throw error;
    }
  }

  /**
   * Mint Business Identity NFT
   * Creates verified business credential NFT
   */
  async mintBusinessIdentityNFT(
    businessProfile: SelectBusinessProfile,
    verificationLevel: "basic" | "verified" | "premium" = "basic"
  ): Promise<{
    mint: string;
    signature: string;
  }> {
    if (!this.isReady()) {
      throw new Error("NFT service not initialized");
    }

    try {
      // Generate business identity metadata
      const metadata = this.generateBusinessIdentityMetadata(
        businessProfile,
        verificationLevel
      );
      
      // Upload metadata
      const metadataUri = await this.uploadMetadata(
        metadata,
        `business-${businessProfile.id}`
      );

      // Mint as standard NFT (identity should be permanent)
      const mint = generateSigner(this.umi);
      
      const createNftIx = createNft(this.umi, {
        mint,
        name: metadata.name,
        symbol: "BIZ",
        uri: metadataUri,
        sellerFeeBasisPoints: percentAmount(0),
        tokenStandard: TokenStandard.NonFungible,
        creators: [
          {
            address: toPublicKey(businessProfile.walletAddress),
            verified: true,
            share: 100,
          },
        ],
      });

      const result = await createNftIx.sendAndConfirm(this.umi);
      
      console.log(`✅ Minted business identity NFT for ${businessProfile.businessName}`);
      
      return {
        mint: mint.publicKey.toString(),
        signature: result.signature.toString(),
      };
    } catch (error) {
      console.error(`❌ Failed to mint business identity NFT:`, error);
      throw error;
    }
  }

  /**
   * Transfer invoice NFT (for invoice financing)
   */
  async transferInvoiceNFT(
    nftMint: string,
    merkleTree: string,
    leafIndex: number,
    fromAddress: string,
    toAddress: string
  ): Promise<{ signature: string }> {
    if (!this.isReady()) {
      throw new Error("NFT service not initialized");
    }

    try {
      const transferIx = transferV1(this.umi, {
        merkleTree: toPublicKey(merkleTree),
        leafOwner: toPublicKey(fromAddress),
        newLeafOwner: toPublicKey(toAddress),
        leafIndex,
      });

      const result = await transferIx.sendAndConfirm(this.umi);
      
      console.log(`✅ Transferred invoice NFT from ${fromAddress} to ${toAddress}`);
      
      return {
        signature: result.signature.toString(),
      };
    } catch (error) {
      console.error(`❌ Failed to transfer invoice NFT:`, error);
      throw error;
    }
  }

  /**
   * Burn invoice NFT (when invoice is paid/cancelled)
   */
  async burnInvoiceNFT(
    nftMint: string,
    merkleTree: string,
    leafIndex: number,
    ownerAddress: string
  ): Promise<{ signature: string }> {
    if (!this.isReady()) {
      throw new Error("NFT service not initialized");
    }

    try {
      const burnIx = burnV1(this.umi, {
        merkleTree: toPublicKey(merkleTree),
        leafOwner: toPublicKey(ownerAddress),
        leafIndex,
      });

      const result = await burnIx.sendAndConfirm(this.umi);
      
      console.log(`✅ Burned invoice NFT`);
      
      return {
        signature: result.signature.toString(),
      };
    } catch (error) {
      console.error(`❌ Failed to burn invoice NFT:`, error);
      throw error;
    }
  }

  /**
   * Generate invoice NFT metadata
   */
  private generateInvoiceMetadata(invoice: SelectInvoice): InvoiceNFTMetadata {
    const apiUrl = process.env.API_URL || "https://api.solanainvoice.com";
    
    return {
      name: `Invoice ${invoice.invoiceNumber}`,
      symbol: "INV",
      uri: `${apiUrl}/nft-metadata/invoice/${invoice.id}`,
      description: `B2B Invoice from ${invoice.invoicerWalletAddress} to ${invoice.invoiceeWalletAddress}`,
      image: `${apiUrl}/images/invoice-nft.png`,
      attributes: [
        {
          trait_type: "Invoice Number",
          value: invoice.invoiceNumber,
        },
        {
          trait_type: "Status",
          value: invoice.status,
        },
        {
          trait_type: "Currency",
          value: invoice.currency,
        },
        {
          trait_type: "Amount",
          value: invoice.isArciumEncrypted ? "Encrypted" : invoice.totalAmount,
          display_type: invoice.isArciumEncrypted ? undefined : "number",
        },
        {
          trait_type: "Due Date",
          value: invoice.dueDate.toISOString(),
          display_type: "date",
        },
        {
          trait_type: "Privacy",
          value: invoice.isPrivate ? "Private" : "Public",
        },
        {
          trait_type: "Encrypted",
          value: invoice.isArciumEncrypted ? "Yes" : "No",
        },
      ],
      properties: {
        category: "invoice",
        creators: [
          {
            address: invoice.invoicerWalletAddress,
            share: 100,
            verified: true,
          },
        ],
      },
    };
  }

  /**
   * Generate payment receipt NFT metadata
   */
  private generatePaymentReceiptMetadata(
    payment: SelectPayment,
    invoice: SelectInvoice
  ): InvoiceNFTMetadata {
    const apiUrl = process.env.API_URL || "https://api.solanainvoice.com";
    
    return {
      name: `Payment Receipt #${payment.id.slice(0, 8)}`,
      symbol: "RCPT",
      uri: `${apiUrl}/nft-metadata/payment/${payment.id}`,
      description: `Payment receipt for Invoice ${invoice.invoiceNumber}`,
      image: `${apiUrl}/images/receipt-nft.png`,
      attributes: [
        {
          trait_type: "Invoice Number",
          value: invoice.invoiceNumber,
        },
        {
          trait_type: "Amount",
          value: payment.amount,
          display_type: "number",
        },
        {
          trait_type: "Currency",
          value: payment.currency,
        },
        {
          trait_type: "Paid By",
          value: payment.fromAddress,
        },
        {
          trait_type: "Paid To",
          value: payment.toAddress,
        },
        {
          trait_type: "Transaction",
          value: payment.txSignature,
        },
        {
          trait_type: "Payment Date",
          value: payment.paidAt.toISOString(),
          display_type: "date",
        },
        {
          trait_type: "Tax Year",
          value: payment.paidAt.getFullYear(),
          display_type: "number",
        },
      ],
      properties: {
        category: "payment_receipt",
        creators: [
          {
            address: payment.fromAddress,
            share: 100,
            verified: true,
          },
        ],
      },
    };
  }

  /**
   * Generate business identity NFT metadata
   */
  private generateBusinessIdentityMetadata(
    businessProfile: SelectBusinessProfile,
    verificationLevel: string
  ): InvoiceNFTMetadata {
    const apiUrl = process.env.API_URL || "https://api.solanainvoice.com";
    
    return {
      name: `${businessProfile.businessName} - Verified Business`,
      symbol: "BIZ",
      uri: `${apiUrl}/nft-metadata/business/${businessProfile.id}`,
      description: `Verified business credentials for ${businessProfile.businessName}`,
      image: `${apiUrl}/images/business-${verificationLevel}-nft.png`,
      attributes: [
        {
          trait_type: "Business Name",
          value: businessProfile.businessName,
        },
        {
          trait_type: "Verification Level",
          value: verificationLevel,
        },
        {
          trait_type: "Industry",
          value: businessProfile.industry || "Not specified",
        },
        {
          trait_type: "Wallet",
          value: businessProfile.walletAddress,
        },
        {
          trait_type: "Registration Date",
          value: businessProfile.createdAt.toISOString(),
          display_type: "date",
        },
      ],
      properties: {
        category: "business_identity",
        creators: [
          {
            address: businessProfile.walletAddress,
            share: 100,
            verified: true,
          },
        ],
      },
    };
  }

  /**
   * Upload metadata to decentralized storage
   * In production, use Arweave, IPFS, or Shadow Drive
   */
  private async uploadMetadata(
    metadata: InvoiceNFTMetadata,
    identifier: string
  ): Promise<string> {
    // For now, return API endpoint
    // In production, upload to Arweave/IPFS and return permanent URL
    const apiUrl = process.env.API_URL || "https://api.solanainvoice.com";
    return `${apiUrl}/nft-metadata/${identifier}`;
  }

  /**
   * Get estimated cost for NFT operations
   */
  static getEstimatedCosts(): {
    treeCreation: number;
    compressedNFT: number;
    standardNFT: number;
    transfer: number;
    burn: number;
  } {
    return {
      treeCreation: 0.5, // ~$0.50 in SOL (one-time, supports 16K+ NFTs)
      compressedNFT: 0.001, // ~$0.001 per compressed NFT
      standardNFT: 0.02, // ~$0.02 per standard NFT
      transfer: 0.0005, // ~$0.0005 per transfer
      burn: 0.0001, // ~$0.0001 per burn
    };
  }
}

/**
 * Export singleton instance
 */
let nftServiceInstance: InvoiceNFTService | null = null;

export function getInvoiceNFTService(): InvoiceNFTService {
  if (!nftServiceInstance) {
    nftServiceInstance = new InvoiceNFTService();
  }
  return nftServiceInstance;
}

export async function initializeNFTService(
  payerKeypair?: Keypair
): Promise<boolean> {
  const service = getInvoiceNFTService();
  return await service.initialize(payerKeypair);
}
