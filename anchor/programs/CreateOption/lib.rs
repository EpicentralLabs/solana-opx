use anchor_lang::prelude::*;

// This is your program's public key and it will update automatically when you build the project.
declare_id!("72aSKuF2JuBFbLMtkSZGb7qtAYWbgSKXEMz7zrBWHE9M");

#[program]
mod create_option {
    use super::*;

    /// Logs a simple message indicating the initiation of the program.
    /// This function doesn't perform any operations other than logging the message.
    ///
    /// # Arguments
    ///
    /// * `ctx` - Context for this instruction. It includes all the necessary accounts.
    ///
    /// # Returns
    ///
    /// * `Ok(())` - The function completes successfully.
    pub fn create_option(ctx: Context<CreateOption>) -> Result<()> {
        msg!("📢 Epicentral Labs - Smart Options on Solana");
        Ok(())
    }

    /// Initializes an option contract by storing the strike price, option type, expiration date, and owner.
    /// The function also sets the initial status of the option to Active.
    ///
    /// # Arguments
    ///
    /// * `ctx` - Context for this instruction. Includes the accounts involved.
    /// * `strike_price` - The price at which the asset can be bought or sold.
    /// * `option_type` - The type of the option (either Call or Put).
    /// * `expiration` - The expiration date of the option in Unix timestamp format.
    ///
    /// # Returns
    ///
    /// * `Ok(())` - If the option contract is successfully initialized.
    ///
    /// # Errors
    ///
    /// * The option contract will not be initialized if there are any issues with the provided accounts.
    pub fn initialize_option(ctx: Context<InitializeOption>, strike_price: u64, option_type: OptionType, expiration: i64) -> Result<()> {
        let option_account = &mut ctx.accounts.option_account;

        // Log the state before initialization
        msg!("Initializing option account with strike price: {}, option type: {:?}, expiration: {}", strike_price, option_type, expiration);

        // Initialize the account's data
        option_account.strike_price = strike_price;
        option_account.option_type = option_type;
        option_account.owner = *ctx.accounts.owner.key;
        option_account.expiration = expiration;
        option_account.status = OptionStatus::Active;

        // Confirm initialization
        msg!("Option account initialized successfully with strike price: {} and expiration: {}", strike_price, expiration);
        msg!("Account created with strike price: {}, option type: {:?}", strike_price, option_type);

        Ok(())
    }

    /// Exercises an option. This action ensures the caller is the owner and that the option is valid.
    /// The option can be exercised if it is still active and has not expired.
    ///
    /// # Arguments
    ///
    /// * `ctx` - Context for this instruction. Includes the accounts involved.
    ///
    /// # Returns
    ///
    /// * `Ok(())` - If the option is successfully exercised.
    ///
    /// # Errors
    ///
    /// * `OptionAlreadyExercised` - If the option has already been exercised.
    /// * `OptionExpired` - If the option has expired.
    pub fn exercise_option(ctx: Context<ExerciseOption>) -> Result<()> {
        let option_account = &mut ctx.accounts.option_account;

        // Ensure the option is active
        if option_account.status != OptionStatus::Active {
            return Err(ErrorCode::OptionAlreadyExercised.into());
        }

        // Check if the option has expired
        if option_account.expiration < Clock::get().unwrap().unix_timestamp {
            option_account.status = OptionStatus::Expired;
            return Err(ErrorCode::OptionExpired.into());
        }

        // Exercise logic (could involve transferring tokens, etc.)
        msg!("⚡ Option exercised!");
        option_account.status = OptionStatus::Exercised;
        msg!("🔹 Exercised by: {}", ctx.accounts.owner.key());
        msg!("🔹 Strike Price: {} SOL", option_account.strike_price);

        Ok(())
    }

    /// Closes an option contract and clears the option account's data.
    /// The option can only be closed if it has either been exercised or has expired.
    ///
    /// # Arguments
    ///
    /// * `ctx` - Context for this instruction. Includes the accounts involved.
    ///
    /// # Returns
    ///
    /// * `Ok(())` - If the option is successfully closed and the data is cleared.
    ///
    /// # Errors
    ///
    /// * `OptionAlreadyClosed` - If the option has already been closed.
    pub fn close_option(ctx: Context<CloseOption>) -> Result<()> {
        let option_account = &mut ctx.accounts.option_account;

        // Ensure the option is closed only if it was active or exercised
        if option_account.status == OptionStatus::Exercised || option_account.status == OptionStatus::Expired {
            return Err(ErrorCode::OptionAlreadyClosed.into());
        }

        // Option closing logic (could involve transferring ownership or assets)
        msg!("🛑 Closing option contract...");
        option_account.status = OptionStatus::Expired;
        msg!("🔹 Closed by: {}", ctx.accounts.owner.key());
        msg!("🔹 Option data cleared from storage.");

        Ok(())
    }
}

/// **Accounts Structs**
/// Defines the accounts required for each instruction.

#[derive(Accounts)]
pub struct CreateOption {}

#[derive(Accounts)]
pub struct InitializeOption<'info> {
    #[account(init, payer = owner, space = 58)]  // Corrected space calculation
    pub option_account: Account<'info, OptionState>,  // Account that stores the OptionState
    #[account(mut)]
    pub owner: Signer<'info>,  // Ensures that the owner signs the transaction
    pub system_program: Program<'info, System>,  // Reference to the System program
}

#[derive(Accounts)]
pub struct ExerciseOption<'info> {
    #[account(mut, has_one = owner)]
    pub option_account: Account<'info, OptionState>,
    #[account(signer)]
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct CloseOption<'info> {
    #[account(mut, close = owner, has_one = owner)]
    pub option_account: Account<'info, OptionState>,
    #[account(signer)]  // Ensure the owner signs the transaction
    pub owner: Account<'info, OptionState>,
}

/// **Option State**
/// Defines how the option data is stored on-chain.
#[account]
pub struct OptionState {
    pub strike_price: u64,   // 8 bytes
    pub owner: Pubkey,       // 32 bytes
    pub option_type: OptionType, // 1 byte (since OptionType is an enum with 2 variants)
    pub expiration: i64,     // 8 bytes
    pub status: OptionStatus, // 1 byte (enum)
}

/// **Enums**
/// Defines the different types of options and their statuses.

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum OptionType {
    Call,
    Put,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum OptionStatus {
    Active,
    Exercised,
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
