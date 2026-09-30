# Level 3 — First Quarter: Standalone Testing, DApp Connector & Idea Alignment

## 1. Challenge Idea Track Alignment: Credentials & Eligibility
VeilLend directly implements the **"Credentials"** and **"Eligibility"** tracks from the Rise In / Midnight approved challenge idea list:
- **Credentials Track**: Institutional or trusted attestation providers cryptographically sign user financial credentials (`SignedCredential`) using asymmetric private keys.
- **Eligibility Track**: Borrowers generate client-side Zero-Knowledge proofs demonstrating that their private financial attributes meet the mathematical criteria for Tier 1, 2, or 3 creditworthiness without disclosing the raw values or their wallet identity.
- **Protocol Gating**: The Compact smart contract functions as a privacy-preserving gatekeeper, permitting liquidity pool borrowing only for valid zero-knowledge eligibility proofs verified on-chain.

---

## 2. Test Suite Architecture & Separation
VeilLend maintains a comprehensive **Vitest** test suite organized into unit models and genuine integration tests:

### Unit Tests (State Machine & Cryptographic Models)
1. `tests/CompactContract.test.ts` (4 tests): Compact Contract Behavior & Public Ledger State Model
   - Ledger state initialization (`initialize_lending_pool`)
   - Per-LP accounting and liquidity deposits
   - LP authorization and deposit balance checks on withdrawal
   - Solvency audit circuit execution without exposing borrower data
2. `tests/ZkCreditProver.test.ts` (5 tests): Zero-Knowledge Credit Prover & Mathematical Constraint Model
   - In-circuit prover success with mathematical threshold satisfaction
   - In-circuit rejection of sub-threshold credentials (income, credit score, defaults, DTI)
   - In-circuit rejection of forged or unauthorized issuer signatures
   - Collateral requirement validation by credit tier
   - Cryptographic nullifier derivation uniqueness
3. `tests/LendingPool.test.ts` (3 tests): Confidential Lending State Machine & Double-Spending Prevention
   - Prime undercollateralized loan origination with 0% collateral
   - Double-spending rejection when reusing a consumed nullifier
   - Loan repayment, interest calculation, and active debt ledger settlement

### Integration Tests (Midnight Toolchain & DApp Connector)
4. `tests/MidnightDAppIntegration.test.ts` (3 tests): Midnight DApp Connector & Contract Specification
   - Genuine wallet detection and explicit "Wallet not connected" error enforcement (no silent fake fallbacks)
   - Preprod network ID configuration and session validation
   - Compact contract source AST and ledger schema verification against `contracts/compiler-spec.json`

---

## 3. Test Execution Results (16 Passing Tests)
```bash
 ✓ tests/MidnightDAppIntegration.test.ts (4 tests)
 ✓ tests/CompactContract.test.ts (4 tests)
 ✓ tests/LendingPool.test.ts (3 tests)
 ✓ tests/ZkCreditProver.test.ts (5 tests)

 Test Files  4 passed (4)
      Tests  16 passed (16)
```

---

## 4. Midnight DApp Connector & 1AM Integration
VeilLend implements `@midnight-ntwrk/dapp-connector-api` (`src/midnight/dappConnector.ts` & `src/midnight/midnight1am.ts`):
- Connects to **1AM** and **Midnight Lace** browser extensions (`window.midnight['1am']` / `window.midnight.mnLace`).
- Detects account balance and Bech32m formatted addresses (`mn_addr_preprod1q...`).
- Strictly enforces `"Wallet not connected"` error handling when extensions are not detected, eliminating simulated wallet fallbacks.
- Sets Midnight Network ID (`preprod`) explicitly before any wallet or contract operation.