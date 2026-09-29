# VeilLend MVP Demo Walkthrough & Video Script

## 🎥 Video Recording Guide (3-5 Minutes)

### Scene 1: Introduction & The DeFi Lending Dilemma (0:00 - 0:45)
- **Visual**: Show VeilLend Landing Page with Midnight Preprod badge.
- **Narrator**: "Welcome to VeilLend, the zero-knowledge private lending protocol built on Midnight Network. Today in Web3, DeFi lending is either grossly over-collateralized—forcing you to lock up 150% in crypto just to borrow—or requires total public transparency of your wallet and identity history. VeilLend changes this using zero-knowledge proofs and Midnight's programmable privacy."

### Scene 2: Authorized Credential Issuance (0:45 - 1:30)
- **Visual**: Navigate to "Credential Issuer" tab. Click "Tier 1: Prime ($145k / 790 Score)" preset. Click "Issue & Store in Local Enclave".
- **Narrator**: "Here, an authorized financial entity (like a bank or payroll verifier) signs an attestation of the user's financial attributes. Notice: this attestation is stored strictly in the borrower's local browser enclave. It never touches the blockchain ledger."

### Scene 3: Generating the ZK Credit Tier Proof (1:30 - 2:30)
- **Visual**: Navigate to "ZK Credit Prover" tab. Select "Tier 1: Prime Tier (0% Collateral)". Set loan amount to $35,000 tDUST. Click "Generate Zero-Knowledge Proof".
- **Narrator**: "Now, as a borrower, I generate a zero-knowledge proof locally. The Compact circuit verifies that my income exceeds $100k, my credit score is above 750, and I have repaid at least 5 loans. In just 180 milliseconds, a cryptographic proof and a single-use nullifier are synthesized. Notice: my income and credit score remain completely hidden."

### Scene 4: Originating Undercollateralized Loan on Midnight (2:30 - 3:30)
- **Visual**: Click "Submit Proof to Lending Market". Click "Disburse Loan on Midnight Preprod". Show transaction confirmation.
- **Narrator**: "We submit the proof to the Midnight smart contract. The contract verifies the proof, burns the nullifier to prevent double-borrowing, and disburses $35,000 tDUST with 0% collateral. This is true capital-efficient, privacy-preserving undercollateralized lending."

### Scene 5: Loan Repayment & Selective Disclosure Audit (3:30 - 4:30)
- **Visual**: Show "My Loans" tab. Click "Repay $35,110". Next, navigate to "Audit & Compliance" tab and click "Verify Solvency via Compact Circuit".
- **Narrator**: "When the loan is repaid, liquidity is restored to the pool. And for regulators, VeilLend enables selective disclosure: compliance officers can verify that the lending pool is 100% solvent without deanonymizing any borrower."