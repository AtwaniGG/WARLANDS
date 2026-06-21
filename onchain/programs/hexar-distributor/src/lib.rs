//! WARLANDS — $HEXAR Merkle reward distributor.
//!
//! Trustless on-chain settlement of the reward roots produced by `scripts/build-merkle.mjs`.
//! The leaf/parent scheme is IDENTICAL to `scripts/merkle.mjs` so the same `merkle-distribution.json`
//! proofs verify here:
//!
//!   leaf   = keccak256( claimant_pubkey(32) ++ amount(u64 little-endian, base units) )
//!   parent = keccak256( sort(left, right) )            // lexicographic, direction-less proofs
//!
//! Model: one published `root` = one claimable set; each wallet claims its leaf exactly once
//! (a per-(distribution, claimant) PDA enforces single-claim). Funds live in a program-owned
//! vault (ATA of a PDA); the authority funds it and can reclaim the unclaimed remainder.
//!
//! ⚠️ UNAUDITED. This handles funds — get a security audit before mainnet use. The off-chain
//! `payout-war.mjs --merkle` path is the interim settlement until this is audited + deployed.

use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

declare_id!("88F6sG17xGQS1DqhXvNeppAdmnJtNFpjf9wF7hf7giew");

/// leaf = keccak256( claimant_pubkey(32) ++ amount(u64 little-endian) ). Matches scripts/merkle.mjs.
fn leaf_hash(claimant: &Pubkey, amount: u64) -> [u8; 32] {
    let mut input = Vec::with_capacity(40);
    input.extend_from_slice(claimant.as_ref());
    input.extend_from_slice(&amount.to_le_bytes());
    keccak::hash(&input).0
}

/// Fold a Merkle proof into a root with sorted-pair (direction-less) keccak. Matches merkle.mjs.
fn compute_root(leaf: [u8; 32], proof: &[[u8; 32]]) -> [u8; 32] {
    let mut node = leaf;
    for sib in proof.iter() {
        node = if node <= *sib {
            keccak::hashv(&[&node, sib]).0
        } else {
            keccak::hashv(&[sib, &node]).0
        };
    }
    node
}

#[program]
pub mod hexar_distributor {
    use super::*;

    /// Create a distribution committed to `root`, plus a program-owned vault for its tokens.
    /// Fund the returned vault ATA with enough $HEXAR to cover every committed leaf, then claims open.
    pub fn initialize(ctx: Context<Initialize>, root: [u8; 32]) -> Result<()> {
        let d = &mut ctx.accounts.distribution;
        d.authority = ctx.accounts.authority.key();
        d.mint = ctx.accounts.mint.key();
        d.vault = ctx.accounts.vault.key();
        d.root = root;
        d.bump = ctx.bumps.distribution;
        d.vault_bump = ctx.bumps.vault_authority;
        Ok(())
    }

    /// Claim `amount` (base units) for the signing wallet by proving its leaf is in `root`.
    /// The single-use `claim_status` PDA (init here) makes a second claim fail.
    pub fn claim(ctx: Context<Claim>, amount: u64, proof: Vec<[u8; 32]>) -> Result<()> {
        let root = ctx.accounts.distribution.root;
        let vault_bump = ctx.accounts.distribution.vault_bump;
        let dist_key = ctx.accounts.distribution.key();
        let decimals = ctx.accounts.mint.decimals;
        let claimant = ctx.accounts.claimant.key();

        // Recompute the leaf and fold the proof — identical scheme to scripts/merkle.mjs.
        let node = compute_root(leaf_hash(&claimant, amount), &proof);
        require!(node == root, DistributorError::InvalidProof);

        let cs = &mut ctx.accounts.claim_status;
        cs.amount = amount;
        cs.claimed = true;

        let seeds: &[&[u8]] = &[b"vault", dist_key.as_ref(), &[vault_bump]];
        let signer: &[&[&[u8]]] = &[seeds];
        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.claimant_ata.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            signer,
        );
        transfer_checked(cpi, amount, decimals)?;
        Ok(())
    }

    /// Authority reclaims unclaimed tokens from the vault (e.g. after an epoch closes).
    pub fn authority_withdraw(ctx: Context<AuthorityWithdraw>, amount: u64) -> Result<()> {
        let vault_bump = ctx.accounts.distribution.vault_bump;
        let dist_key = ctx.accounts.distribution.key();
        let decimals = ctx.accounts.mint.decimals;

        let seeds: &[&[u8]] = &[b"vault", dist_key.as_ref(), &[vault_bump]];
        let signer: &[&[&[u8]]] = &[seeds];
        let cpi = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            TransferChecked {
                from: ctx.accounts.vault.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.authority_ata.to_account_info(),
                authority: ctx.accounts.vault_authority.to_account_info(),
            },
            signer,
        );
        transfer_checked(cpi, amount, decimals)?;
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + Distribution::SIZE,
        seeds = [b"distribution", mint.key().as_ref(), authority.key().as_ref()],
        bump
    )]
    pub distribution: Account<'info, Distribution>,
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: PDA that owns the vault token account; never read/written directly.
    #[account(seeds = [b"vault", distribution.key().as_ref()], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(
        init,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = vault_authority,
        associated_token::token_program = token_program
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Claim<'info> {
    #[account(
        seeds = [b"distribution", distribution.mint.as_ref(), distribution.authority.as_ref()],
        bump = distribution.bump
    )]
    pub distribution: Account<'info, Distribution>,
    #[account(address = distribution.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: PDA, vault owner; signs the transfer via seeds.
    #[account(seeds = [b"vault", distribution.key().as_ref()], bump = distribution.vault_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(mut, address = distribution.vault)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer = claimant,
        space = 8 + ClaimStatus::SIZE,
        seeds = [b"claim", distribution.key().as_ref(), claimant.key().as_ref()],
        bump
    )]
    pub claim_status: Account<'info, ClaimStatus>,
    #[account(mut)]
    pub claimant: Signer<'info>,
    #[account(
        init_if_needed,
        payer = claimant,
        associated_token::mint = mint,
        associated_token::authority = claimant,
        associated_token::token_program = token_program
    )]
    pub claimant_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AuthorityWithdraw<'info> {
    #[account(
        seeds = [b"distribution", distribution.mint.as_ref(), distribution.authority.as_ref()],
        bump = distribution.bump,
        has_one = authority,
        has_one = mint,
        has_one = vault
    )]
    pub distribution: Account<'info, Distribution>,
    #[account(address = distribution.mint)]
    pub mint: InterfaceAccount<'info, Mint>,
    /// CHECK: PDA, vault owner; signs the transfer via seeds.
    #[account(seeds = [b"vault", distribution.key().as_ref()], bump = distribution.vault_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(mut, address = distribution.vault)]
    pub vault: InterfaceAccount<'info, TokenAccount>,
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = authority,
        associated_token::token_program = token_program
    )]
    pub authority_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Distribution {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub root: [u8; 32],
    pub bump: u8,
    pub vault_bump: u8,
}
impl Distribution {
    pub const SIZE: usize = 32 + 32 + 32 + 32 + 1 + 1;
}

#[account]
pub struct ClaimStatus {
    pub amount: u64,
    pub claimed: bool,
}
impl ClaimStatus {
    pub const SIZE: usize = 8 + 1;
}

#[error_code]
pub enum DistributorError {
    #[msg("Merkle proof is invalid for this claimant/amount.")]
    InvalidProof,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hx(s: &str) -> [u8; 32] {
        let mut o = [0u8; 32];
        for i in 0..32 {
            o[i] = u8::from_str_radix(&s[i * 2..i * 2 + 2], 16).unwrap();
        }
        o
    }

    /// Cross-language proof: the on-chain hashing must equal scripts/merkle.mjs byte-for-byte, so
    /// the proofs build-merkle.mjs emits verify here. Golden values are from merkle.mjs for
    /// pubkey [1;32]/amount 1000 and pubkey [2;32]/amount 2000.
    #[test]
    fn matches_offchain_merkle_mjs() {
        let a = Pubkey::new_from_array([1u8; 32]);
        let b = Pubkey::new_from_array([2u8; 32]);
        let l0 = leaf_hash(&a, 1000);
        let l1 = leaf_hash(&b, 2000);
        assert_eq!(l0, hx("67c30a213ead9e5612537c91af2bf76e0055e0184aa80b039ff1aa203cd11cb4"));
        assert_eq!(l1, hx("629ea2a3531a6458c71306a81bfaf189eba4a038983232adf212e00d84320034"));

        let root = hx("1be550433270a14585a37548e6d57139b968d485ef0f873b2ab29fadbf4ef406");
        assert_eq!(compute_root(l0, &[l1]), root); // proof for leaf0 is [leaf1]
        assert_eq!(compute_root(l1, &[l0]), root); // sorted-pair ⇒ direction-less
        assert_ne!(compute_root(leaf_hash(&a, 999), &[l1]), root); // tampered amount fails
    }
}
