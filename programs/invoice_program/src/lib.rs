use anchor_lang::prelude::*;

declare_id!("inv1pVoiCe11111111111111111111111111111111");

#[program]
pub mod invoice_program {
    use super::*;

    /// Creates a new invoice on-chain
    pub fn create_invoice(
        ctx: Context<CreateInvoice>,
        amount: u64,
        due_date: i64,
        token_mint: Pubkey,
        bump: u8,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        invoice.creator = ctx.accounts.creator.key();
        invoice.client = None; // Can be set later or left as None
        invoice.mint = ctx.accounts.invoice_mint.key();
        invoice.amount = amount;
        invoice.token_mint = token_mint;
        invoice.due_date = due_date;
        invoice.status = InvoiceStatus::Unpaid;
        invoice.created_at = clock.unix_timestamp;
        invoice.updated_at = clock.unix_timestamp;
        invoice.bump = bump;
        invoice.last_receipt_reference = None;

        msg!("Invoice created: {} lamports, due: {}", amount, due_date);
        Ok(())
    }

    /// Marks an invoice as paid and stores receipt reference
    pub fn mark_invoice_paid(
        ctx: Context<MarkInvoicePaid>,
        receipt_reference: String,
    ) -> Result<()> {
        let invoice = &mut ctx.accounts.invoice;
        let clock = Clock::get()?;

        // Validate current status allows transition to Paid
        require!(
            matches!(invoice.status, InvoiceStatus::Unpaid | InvoiceStatus::PartiallyPaid),
            InvoiceError::InvalidStatusTransition
        );

        invoice.status = InvoiceStatus::Paid;
        invoice.updated_at = clock.unix_timestamp;
        invoice.last_receipt_reference = Some(receipt_reference.clone());

        msg!("Invoice marked as paid. Receipt: {}", receipt_reference);
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, due_date: i64, token_mint: Pubkey, bump: u8)]
pub struct CreateInvoice<'info> {
    #[account(
        init,
        payer = creator,
        space = InvoiceAccount::SPACE,
        seeds = [b"invoice", invoice_mint.key().as_ref()],
        bump
    )]
    pub invoice: Account<'info, InvoiceAccount>,
    
    #[account(mut)]
    pub creator: Signer<'info>,
    
    /// The NFT mint representing this invoice
    /// CHECK: This is the mint address for the invoice NFT
    pub invoice_mint: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarkInvoicePaid<'info> {
    #[account(
        mut,
        seeds = [b"invoice", invoice.mint.as_ref()],
        bump = invoice.bump,
        has_one = creator
    )]
    pub invoice: Account<'info, InvoiceAccount>,
    
    pub creator: Signer<'info>,
}

#[account]
pub struct InvoiceAccount {
    /// Creator/issuer of the invoice
    pub creator: Pubkey,
    
    /// Optional client/payer wallet
    pub client: Option<Pubkey>,
    
    /// Invoice NFT mint address
    pub mint: Pubkey,
    
    /// Invoice amount in token's smallest unit (lamports for SOL)
    pub amount: u64,
    
    /// Token mint for payment (SOL = System Program for MVP)
    pub token_mint: Pubkey,
    
    /// Due date as Unix timestamp
    pub due_date: i64,
    
    /// Current invoice status
    pub status: InvoiceStatus,
    
    /// Creation timestamp
    pub created_at: i64,
    
    /// Last update timestamp
    pub updated_at: i64,
    
    /// PDA bump seed
    pub bump: u8,
    
    /// Last payment receipt reference (tx signature or x402 receipt ID)
    pub last_receipt_reference: Option<String>,
}

impl InvoiceAccount {
    /// Calculate space needed for InvoiceAccount
    /// 8 (discriminator) + 32 (creator) + 1 + 32 (client Option) + 32 (mint) + 
    /// 8 (amount) + 32 (token_mint) + 8 (due_date) + 1 (status enum) + 
    /// 8 (created_at) + 8 (updated_at) + 1 (bump) + 1 + 4 + 128 (receipt string Option with prefix)
    pub const SPACE: usize = 8 + 32 + 1 + 32 + 32 + 8 + 32 + 8 + 1 + 8 + 8 + 1 + 1 + 4 + 128;
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq, Debug)]
pub enum InvoiceStatus {
    Unpaid,
    PartiallyPaid,
    Paid,
    Canceled,
    Disputed,
    Expired,
}

#[error_code]
pub enum InvoiceError {
    #[msg("Invalid status transition")]
    InvalidStatusTransition,
}
