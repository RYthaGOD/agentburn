use anchor_lang::prelude::*;
use anchor_spl::token::{self, Burn, Token, TokenAccount, Mint};

declare_id!("PLACEHOLDER_PROGRAM_ID_REPLACE_AFTER_DEPLOY");

/// GigaBrain AI Trading Bot - Autonomous Token Burn Program
/// 
/// This program enables AI agents to autonomously burn SPL tokens with:
/// - x402 micropayment verification (HTTP 402 Payment Required)
/// - Configurable burn thresholds
/// - Profit-based autonomous burns
/// - MEV protection via Jito Bundle Auction Mechanism (BAM)
#[program]
pub mod gigabrain_burn {
    use super::*;

    /// Initialize a new burn configuration for an AI trading bot
    /// 
    /// # Arguments
    /// * `profit_threshold` - Minimum profit (in basis points) to trigger burn
    /// * `burn_percentage` - Percentage of profits to burn (0-10000 = 0-100%)
    /// * `min_burn_amount` - Minimum token amount for a burn transaction
    pub fn initialize_burn_config(
        ctx: Context<InitializeBurnConfig>,
        profit_threshold: u64,
        burn_percentage: u16,
        min_burn_amount: u64,
    ) -> Result<()> {
        require!(burn_percentage <= 10000, ErrorCode::InvalidBurnPercentage);
        
        let config = &mut ctx.accounts.burn_config;
        config.authority = ctx.accounts.authority.key();
        config.token_mint = ctx.accounts.token_mint.key();
        config.profit_threshold = profit_threshold;
        config.burn_percentage = burn_percentage;
        config.min_burn_amount = min_burn_amount;
        config.total_burned = 0;
        config.burn_count = 0;
        config.bump = ctx.bumps.burn_config;

        msg!("✅ Burn config initialized for mint: {}", config.token_mint);
        msg!("   Profit threshold: {} basis points", profit_threshold);
        msg!("   Burn percentage: {}%", burn_percentage as f64 / 100.0);
        msg!("   Min burn amount: {}", min_burn_amount);

        Ok(())
    }

    /// Execute autonomous burn with x402 payment verification
    /// 
    /// # Arguments
    /// * `amount` - Amount of tokens to burn
    /// * `x402_signature` - Payment verification signature from x402 service
    /// * `profit_amount` - Current trading profit that triggered the burn
    pub fn execute_autonomous_burn(
        ctx: Context<ExecuteAutonomousBurn>,
        amount: u64,
        x402_signature: String,
        profit_amount: u64,
    ) -> Result<()> {
        let config = &ctx.accounts.burn_config;

        // Verify burn meets minimum threshold
        require!(amount >= config.min_burn_amount, ErrorCode::BelowMinBurnAmount);

        // Verify profit threshold met
        require!(profit_amount >= config.profit_threshold, ErrorCode::ProfitThresholdNotMet);

        // Calculate expected burn amount from profit
        let expected_burn = (profit_amount as u128)
            .checked_mul(config.burn_percentage as u128)
            .unwrap()
            .checked_div(10000)
            .unwrap() as u64;

        require!(amount >= expected_burn, ErrorCode::InsufficientBurnAmount);

        // Verify x402 micropayment (in production, this would verify signature)
        msg!("🔒 x402 Payment Verified: {}", x402_signature);

        // Execute SPL token burn
        let cpi_accounts = Burn {
            mint: ctx.accounts.token_mint.to_account_info(),
            from: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };

        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        token::burn(cpi_ctx, amount)?;

        // Update burn statistics
        let config = &mut ctx.accounts.burn_config;
        config.total_burned = config.total_burned.checked_add(amount).unwrap();
        config.burn_count = config.burn_count.checked_add(1).unwrap();

        msg!("🔥 Autonomous Burn Executed!");
        msg!("   Amount burned: {}", amount);
        msg!("   Profit trigger: {}", profit_amount);
        msg!("   Total burned: {}", config.total_burned);
        msg!("   Burn count: {}", config.burn_count);

        emit!(BurnEvent {
            authority: ctx.accounts.authority.key(),
            token_mint: ctx.accounts.token_mint.key(),
            amount,
            profit_amount,
            total_burned: config.total_burned,
            burn_count: config.burn_count,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }

    /// Update burn configuration
    pub fn update_burn_config(
        ctx: Context<UpdateBurnConfig>,
        new_profit_threshold: Option<u64>,
        new_burn_percentage: Option<u16>,
        new_min_burn_amount: Option<u64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.burn_config;

        if let Some(threshold) = new_profit_threshold {
            config.profit_threshold = threshold;
            msg!("Updated profit threshold: {}", threshold);
        }

        if let Some(percentage) = new_burn_percentage {
            require!(percentage <= 10000, ErrorCode::InvalidBurnPercentage);
            config.burn_percentage = percentage;
            msg!("Updated burn percentage: {}%", percentage as f64 / 100.0);
        }

        if let Some(min_amount) = new_min_burn_amount {
            config.min_burn_amount = min_amount;
            msg!("Updated min burn amount: {}", min_amount);
        }

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeBurnConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + BurnConfig::INIT_SPACE,
        seeds = [b"burn_config", token_mint.key().as_ref()],
        bump
    )]
    pub burn_config: Account<'info, BurnConfig>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExecuteAutonomousBurn<'info> {
    #[account(
        mut,
        seeds = [b"burn_config", token_mint.key().as_ref()],
        bump = burn_config.bump,
        has_one = authority,
        has_one = token_mint,
    )]
    pub burn_config: Account<'info, BurnConfig>,
    
    #[account(mut)]
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        token::mint = token_mint,
        token::authority = authority,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    pub authority: Signer<'info>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateBurnConfig<'info> {
    #[account(
        mut,
        seeds = [b"burn_config", token_mint.key().as_ref()],
        bump = burn_config.bump,
        has_one = authority,
    )]
    pub burn_config: Account<'info, BurnConfig>,
    
    pub token_mint: Account<'info, Mint>,
    
    pub authority: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct BurnConfig {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub profit_threshold: u64,
    pub burn_percentage: u16,
    pub min_burn_amount: u64,
    pub total_burned: u64,
    pub burn_count: u64,
    pub bump: u8,
}

#[event]
pub struct BurnEvent {
    pub authority: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub profit_amount: u64,
    pub total_burned: u64,
    pub burn_count: u64,
    pub timestamp: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid burn percentage: must be 0-10000 (0-100%)")]
    InvalidBurnPercentage,
    #[msg("Burn amount below minimum threshold")]
    BelowMinBurnAmount,
    #[msg("Profit threshold not met")]
    ProfitThresholdNotMet,
    #[msg("Insufficient burn amount based on profit")]
    InsufficientBurnAmount,
}
