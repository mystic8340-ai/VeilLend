# Level 2 — Waxing Crescent: Smart Contract Design & State Machine

## 1. Compact Smart Contract Specification
The VeilLend smart contract is implemented in **Compact (v0.23)** for the Midnight Network (`contracts/veillend.compact`).

### Public Ledger State
```compact
export ledger pool_admin_pk: Bytes<32>;
export ledger authorized_issuer_pk: Bytes<32>;
export ledger total_liquidity: Uint<64>;
export ledger total_borrowed: Uint<64>;
export ledger total_repaid: Uint<64>;
export ledger total_reserve_interest: Uint<64>;
export ledger loan_count: Counter;
export ledger repaid_loan_count: Counter;
export ledger active_borrowers_count: Counter;
export ledger is_paused: Boolean;
export ledger tier1_max_limit: Uint<64>;
export ledger tier2_max_limit: Uint<64>;
export ledger tier3_max_limit: Uint<64>;
```

### Witness Declarations
```compact
witness get_borrower_secret(): Bytes<32>;
witness get_verified_income(): Uint<64>;
witness get_credit_score(): Uint<32>;
witness get_repaid_loans_history(): Uint<32>;
witness get_debt_to_income_pct(): Uint<32>;
witness get_issuer_signature(): Bytes<64>;
witness verify_issuer_attestation(...): Boolean;
witness compute_tier_eligibility(...): Boolean;
witness derive_nullifier(...): Bytes<32>;
```

## 2. Zero-Knowledge Circuits
1. `initialize_lending_pool`: Sets pool admin, authorized issuer public keys, and tier limits.
2. `deposit_liquidity` & `withdraw_liquidity`: Allows Liquidity Providers (LPs) to manage protocol capital.
3. `request_tier_loan`: Verifies ZK credit proof, evaluates tier thresholds, consumes nullifier, and issues loan funds.
4. `repay_loan`: Settles loan obligations, recovers borrowed balance, and allocates earned interest to LP reserves.
5. `disclose_solvency_audit`: Selective disclosure circuit for regulators to prove protocol solvency without revealing borrower identities.

## 3. Cryptographic Commitment Scheme
VeilLend uses Poseidon/deterministic hash commitments:
$$\text{Commitment} = \mathcal{H}(\text{IssuerPK} \parallel \text{IdentityHash} \parallel \text{Income} \parallel \text{Score} \parallel \text{Repaid} \parallel \text{DTI})$$
$$\text{Nullifier} = \mathcal{H}(\text{BorrowerSecret} \parallel \text{LoanSalt})$$