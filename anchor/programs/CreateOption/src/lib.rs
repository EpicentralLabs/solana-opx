use anchor_lang::prelude::*;

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("HnX2DaLiYakrugEev7oE3r7vugDUCZBV7zSntnDYBZoN");

#[program]
mod create_option {
    use super::*;

    pub fn initialize_option(
    ctx: Context<InitializeOption>,
    strike_price: u64,
    option_type: OptionType,
    option_status: OptionStatus, // This is the status passed at initialization
    expiration: i64,
) -> Result<()> {
    let current_time = Clock::get()?.unix_timestamp as u64;

    // Set the initial status from the argument
    let option_account = &mut ctx.accounts.option_account;
    option_account.status = option_status as u8; // Assign the provided status

    // Ensure the expiration is in the future
    if expiration as u64 <= current_time {
        return Err(ErrorCode::InvalidExpiration.into());
    }

    option_account.strike_price = strike_price;
    option_account.option_type = option_type as u8;
    option_account.owner = *ctx.accounts.owner.key;
    option_account.expiration = expiration as u64;
    option_account.timestamp = current_time;

    msg!("✅ Option contract initialized!");
    msg!("🔹 Owner: {}", ctx.accounts.owner.key());
    msg!("🔹 Strike Price: {} SOL", strike_price);
    msg!("🔹 Option Type: {:?}", option_type);
    msg!("🔹 Expiration: {}", expiration);

    Ok(())
}


    // Exercise an option: Owner can exercise an active option if conditions met
    pub fn exercise_option(ctx: Context<ExerciseOption>) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64; // Get current time
        let option_account = &mut ctx.accounts.option_account;

        // Ensure the option is active and hasn't expired
        if option_account.status != OptionStatus::Active as u8 {
            return Err(ErrorCode::OptionNotActive.into());
        }

        // Ensure the option is not expired
        if option_account.expiration < current_time {
            return Err(ErrorCode::OptionExpired.into());
        }

        // Ensure the option has not already been exercised
        if option_account.status == OptionStatus::Exercised as u8 {
            return Err(ErrorCode::OptionAlreadyExercised.into());
        }

        // Check if the owner is exercising the option
        if *ctx.accounts.owner.key != option_account.owner {
            return Err(ErrorCode::UnauthorizedExercise.into());
        }

        // Mark option as exercised
        option_account.status = OptionStatus::Exercised as u8;

        msg!("✅ Option exercised successfully!");
        msg!("🔹 Option exercised by: {}", ctx.accounts.owner.key());

        Ok(())
    }

    pub fn expire_option(ctx: Context<ExpireOption>) -> Result<()> {
        let current_time = Clock::get()?.unix_timestamp as u64; // Get current time
        let option_account = &mut ctx.accounts.option_account;

        // Log current status and expiration for debugging
        msg!("Current Time: {}", current_time);
        msg!("Option Expiration: {}", option_account.expiration);
        msg!("Option Status: {:?}", option_account.status);

        // Ensure the option is still active
        if option_account.status != OptionStatus::Active as u8 {
            msg!(
                "❌ Option is not active. Status: {:?}",
                option_account.status
            );
            return Err(ErrorCode::OptionNotActive.into());
        }

        // Ensure the option has expired
        if option_account.expiration > current_time {
            msg!("❌ Option expiration check failed: Expiration time is in the future.");
            return Err(ErrorCode::OptionNotExpired.into());
        }

        // Ensure the option hasn't already been exercised (it cannot be expired if exercised)
        if option_account.status == OptionStatus::Exercised as u8 {
            msg!("❌ Option has already been exercised, cannot expire.");
            return Err(ErrorCode::OptionAlreadyExercised.into());
        }

        // Mark option as expired
        option_account.status = OptionStatus::Expired as u8;

        msg!("✅ Option expired successfully!");
        msg!("🔹 Option expired by: {}", ctx.accounts.owner.key());
        msg!("🔹 Option expiration: {}", option_account.expiration);
        msg!("🔹 Current time: {}", current_time);

        Ok(())
    }

}

#[derive(Accounts)]
pub struct InitializeOption<'info> {
    #[account(init, payer = owner, space = 8 + 8 + 32 + 1 + 8 + 1 + 8)]
    // Add 8 for the discriminator
    pub option_account: Account<'info, OptionState>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExerciseOption<'info> {
    #[account(mut, has_one = owner)]
    pub option_account: Account<'info, OptionState>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct ExpireOption<'info> {
    #[account(mut, has_one = owner)]
    pub option_account: Account<'info, OptionState>,
    #[account(mut)]
    pub owner: Signer<'info>,
}

#[account]
pub struct OptionState {
    pub strike_price: u64, // 8 bytes
    pub expiration: u64,   // 8 bytes
    pub owner: Pubkey,     // 32 bytes
    pub option_type: u8,   // 1 byte (could be an enum variant)
    pub timestamp: u64,    // 8 bytes (added timestamp)
    pub status: u8,        // 1 byte (could be active/inactive)
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)] // Ensure correct serialization
pub enum OptionType {
    Call = 0,
    Put = 1,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq, Eq)]
#[repr(u8)] // Ensure correct serialization
pub enum OptionStatus {
    Active = 0,
    Exercised = 1,
    Expired = 2,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The expiration time is invalid. The option cannot expire in the past.")]
    InvalidExpiration,

    #[msg("Option is not active.")]
    OptionNotActive,

    #[msg("Option has expired.")]
    OptionExpired,

    #[msg("Unauthorized attempt to exercise option.")]
    UnauthorizedExercise,

    #[msg("Option has not yet expired.")]
    OptionNotExpired,

    #[msg("Option has already been exercised.")]
    OptionAlreadyExercised,
}
