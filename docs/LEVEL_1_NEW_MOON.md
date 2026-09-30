# Level 1 — New Moon: VeilLend Architecture & Privacy Specification

## 1. Problem Statement
In traditional Decentralized Finance (DeFi) lending markets (e.g., Aave, Compound), protocols operate exclusively on either:
1. **Gross Over-Collateralization**: Requiring borrowers to post 130%–170% collateral in crypto assets. This is deeply capital-inefficient and blocks everyday users, small businesses, and prime borrowers who don't already hold excess crypto capital.
2. **Transparent Wallet Doxxing**: Undercollateralized credit solutions on public blockchains demand linking real-world identity and exposing entire financial histories, transaction flows, and payroll data on an immutable public ledger. This exposes users to targeted phishing, competitor intelligence exploitation, and physical extortion.

## 2. The VeilLend Solution on Midnight
**VeilLend** solves the capital-efficiency dilemma through **programmable privacy and selective disclosure** powered by the **Midnight Network**. Borrowers prove their creditworthiness (credit tier thresholds, income bounds, past clean loan repayment track records) using zero-knowledge proofs computed locally in their browser.

No credit scores, tax returns, bank balances, or personal identity numbers are ever published on-chain. Only the mathematical proof of threshold satisfaction and single-use nullifiers touch the Midnight ledger.

## 3. Official Hackathon Challenge Alignment: Credentials & Eligibility
VeilLend directly fulfills the **"Credentials"** and **"Eligibility"** tracks from the official Rise In / Midnight challenge idea list:
1. **Credentials**: Institutional issuers issue cryptographically signed credentials (`SignedCredential`) verifying financial attributes (income, credit score, defaults, DTI) with cryptographic signatures.
2. **Eligibility**: Borrowers execute client-side zero-knowledge proofs demonstrating that their private attributes satisfy risk tier thresholds without disclosing values or wallet identity.
3. **Allowlist / Protocol Gating**: The Compact smart contract validates proofs and nullifiers on-chain, granting borrowing eligibility exclusively to verified zero-knowledge credentials.

## 4. Midnight Privacy Model & Dual-State Design
Midnight’s unique dual-state architecture divides state into two realms:
- **Public Ledger State (`veillend.compact`)**:
  - Global pool liquidity and reserves.
  - Active and repaid loan counts.
  - Nullifier registry to prevent proof replay and double-borrowing.
  - Authorized Issuer public keys and risk tier configuration caps.
- **Private State & Witnesses (`witness`)**:
  - Raw financial credentials (annual income, FICO credit score, repayment count, debt-to-income).
  - Cryptographic attestation signatures issued by accredited financial verifiers.
  - Borrower secret salt and nullifier key.

## 4. Threat Model & Privacy Guarantees
- **Front-Running / Miner Snooping Protection**: Zero-knowledge circuits generate non-interactive proofs (ZKP). Node validators only verify the SNARK validity without access to private inputs.
- **Unlinkability**: Every loan request incorporates a unique blinding factor (`loan_salt`), ensuring that distinct loans originated by the same borrower cannot be correlated by external observers.
- **Sybil & Replay Resistance**: Single-use deterministic nullifiers derived from the borrower's private witness key prevent using the same credential for concurrent unauthorized loans.