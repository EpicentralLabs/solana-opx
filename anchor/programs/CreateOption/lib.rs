use anchor_lang::prelude::*;

/// Program's public key. It will update automatically when you build the project.
declare_id!("72aSKuF2JuBFbLMtkSZGb7qtAYWbgSKXEMz7zrBWHE9M");

#[program]
mod create_option {
    use super::*;

    /// Initializes a new option contract, setting the strike price, option type,
    /// expiration date, and owner in the `OptionState` account.
    ///
    /// # Arguments
    /// - `ctx`: The context, containing the `owner` and the `option_account`.
    /// - `strike_price`: The price at which the option can be exercised.
    /// - `option_type`: The type of the option, either `Call` or `Put`.
    /// - `expiration`: The expiration timestamp of the option.
    pub fn initialize_option(ctx: Context<InitializeOption>, strike_price: u64, option_type: OptionType, expiration: i64) -> Result<()> {
        let option_account = &mut ctx.accounts.option_account;
        option_account.strike_price = strike_price;
        option_account.option_type = option_type;
        option_account.owner = *ctx.accounts.owner.key;
        option_account.expiration = expiration;
        option_account.status = OptionStatus::Active;

        msg!("✅ Option contract initialized!");
        msg!("🔹 Owner: {}", ctx.accounts.owner.key());
        msg!("🔹 Strike Price: {} SOL", strike_price);
        msg!("🔹 Option Type: {:?}", option_type);
        msg!("🔹 Expiration: {}", expiration);

        Ok(())
    }

    /// Exercises an option if it is active and not expired.
    ///
    /// This function checks whether the option is still active and whether it has
    /// expired. If the option is valid, it marks the option as exercised.
    ///
    /// # Arguments
    /// - `ctx`: The context, which includes the `option_account` and `owner`.
    pub fn exercise_option(ctx: Context<ExerciseOption>) -> Result<()> {
        let option_account = &mut ctx.accounts.option_account;
        let current_time = Clock::get()?.unix_timestamp;

        msg!("🔎 Exercising option...");
        msg!("📅 Current Time: {}", current_time);
        msg!("🔹 Option Status: {:?}", option_account.status);
        msg!("🔹 Option Expiration: {}", option_account.expiration);
        msg!("🔹 Owner Public Key: {}", ctx.accounts.owner.key());

        // Ensure the option is active
        if option_account.status != OptionStatus::Active {
            msg!("❌ Option is not active, status is: {:?}", option_account.status);
            return Err(ErrorCode::OptionAlreadyExercised.into());
        }

        // Check if the option has expired
        if option_account.expiration < current_time {
            option_account.status = OptionStatus::Expired;
            msg!("❌ Option expired!");
            return Err(ErrorCode::OptionExpired.into());
        }

        // Exercise logic (could involve transferring tokens, etc.)
        msg!("⚡ Option exercised successfully!");
        option_account.status = OptionStatus::Exercised;
        msg!("🔹 Exercised by: {}", ctx.accounts.owner.key());
        msg!("🔹 Strike Price: {} SOL", option_account.strike_price);

        Ok(())
    }

    /// Closes an option contract by marking it as expired.
    ///
    /// This function ensures that the option can only be closed if it was active
    /// or exercised. If the option is already closed or exercised, it returns an error.
    ///
    /// # Arguments
    /// - `ctx`: The context, which includes the `option_account` and `owner`.
    pub fn close_option(ctx: Context<CloseOption>) -> Result<()> {
        let option_account = &mut ctx.accounts.option_account;

        msg!("🔎 Closing option...");
        msg!("🔹 Option Status: {:?}", option_account.status);
        msg!("🔹 Owner Public Key: {}", ctx.accounts.owner.key());

        // Ensure the option is closed only if it was active or exercised
        if option_account.status == OptionStatus::Exercised || option_account.status == OptionStatus::Expired {
            msg!("❌ Option has already been closed or exercised.");
            return Err(ErrorCode::OptionAlreadyClosed.into());
        }

        // Option closing logic (could involve transferring ownership or assets)
        msg!("🛑 Closing option contract...");
        option_account.status = OptionStatus::Expired;
        msg!("🔹 Option closed by: {}", ctx.accounts.owner.key());
        msg!("🔹 Option data cleared from storage.");

        Ok(())
    }
}

/// **Accounts Structs**
/// Defines the accounts required for each instruction.
#[derive(Accounts)]
pub struct CreateOption<'info> {
    /// The account of the owner, who is the signer of the transaction.
    #[account(signer)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeOption<'info> {
    /// The account to store the option data.
    #[account(init, payer = owner, space = 8 + 8 + 32 + 1 + 8 + 1)]  // Space calculation for OptionState
    pub option_account: Account<'info, OptionState>,

    /// The account of the owner, who pays for the transaction.
    #[account(mut)]
    pub owner: Signer<'info>,

    /// The system program used for account initialization.
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ExerciseOption<'info> {
    /// The option account that is being exercised.
    #[account(mut, has_one = owner)]
    pub option_account: Account<'info, OptionState>,

    /// The owner of the option account, who must sign the transaction.
    #[account(signer)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseOption<'info> {
    /// The option account that is being closed.
    #[account(mut, close = owner, has_one = owner)]
    pub option_account: Account<'info, OptionState>,

    /// The owner of the option account, who must sign the transaction.
    #[account(signer)]
    pub owner: Signer<'info>,
}

/// **Option State**
/// Defines how the option data is stored on-chain.
#[account]
pub struct OptionState {
    /// The strike price at which the option can be exercised.
    pub strike_price: u64,

    /// The public key of the option owner.
    pub owner: Pubkey,

    /// The type of the option (e.g., Call or Put).
    pub option_type: OptionType,

    /// The expiration timestamp of the option.
    pub expiration: i64,

    /// The current status of the option (e.g., Active, Exercised, Expired).
    pub status: OptionStatus,
}

/// **Enums**
/// Defines the different types of options and their statuses.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum OptionType {
    /// A call option.
    Call,

    /// A put option.
    Put,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]  // Add Debug here
pub enum OptionStatus {
    /// The option is active and can be exercised.
    Active,

    /// The option has been exercised.
    Exercised,

    /// The option has expired and is no longer valid.
    Expired,
}

/// **Error Codes**
/// Defines custom error codes for the program.
#[error_code]
pub enum ErrorCode {
    #[msg("The option has already been exercised.")]
    OptionAlreadyExercised,

    #[msg("The option has expired.")]
    OptionExpired,

    #[msg("The option contract has already been closed.")]
    OptionAlreadyClosed,
}
