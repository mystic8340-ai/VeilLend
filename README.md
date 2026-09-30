# VeilLend

[![CI/CD Pipeline](https://github.com/mystic8340-ai/VeilLend/actions/workflows/ci.yml/badge.svg)](https://github.com/mystic8340-ai/VeilLend/actions)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod_Live-6366F1?logo=cardano)](https://midnight.network)
[![1AM Wallet](https://img.shields.io/badge/1AM_Wallet-Preprod_Ready-06B6D4)](https://1am.xyz)
[![Smart Contract](https://img.shields.io/badge/Compact-v0.23-10B981)](contracts/veillend.compact)
[![License](https://img.shields.io/badge/License-Apache_2.0-8B5CF6)](LICENSE)

> Zero-knowledge private lending protocol on Midnight enabling capital-efficient, undercollateralized loans without exposing borrower financial data or wallet identities.

## Live Demo
- **Live Preprod Application**: [https://veil-lend-chi.vercel.app](https://veil-lend-chi.vercel.app)
- **1AM Browser Extension Deploy Route**: [https://veil-lend-chi.vercel.app/deploy](https://veil-lend-chi.vercel.app/deploy)

## Contract Address
| Network | Address | Explorer Links |
| :--- | :--- | :--- |
| **Midnight Preprod** | `22f0dbac3eae847cc0fdcf59c09b40d2a09955646e3a63e424b01a6d95d94f22` | [1AM Contract Explorer](https://explorer.1am.xyz/contract/22f0dbac3eae847cc0fdcf59c09b40d2a09955646e3a63e424b01a6d95d94f22?network=preprod) · [1AM Tx Explorer](https://explorer.1am.xyz/tx/8060a14a00c59c33181905b47bf1f4240ca633bf3f364b7ab367328d6d1db8af?network=preprod) |

> **Block Height**: #2781045 | **On-Chain Deploy Tx Hash**: `8060a14a00c59c33181905b47bf1f4240ca633bf3f364b7ab367328d6d1db8af`

## What This Product Does
DeFi lending protocols today (such as Aave or Compound) require 130%–170% overcollateralization because they cannot verify borrower creditworthiness on-chain without completely doxxing user finances. Borrowers are forced to lock up more capital than they receive, making capital access inefficient and excluding everyday users.

Conversely, traditional undercollateralized credit requires publishing bank statements, tax returns, and identity documents to centralized underwriters or transparent public ledgers. On a public blockchain, this exposes users to wallet tracking, phishing, corporate espionage, and financial extortion.

**VeilLend** resolves this dilemma using the **Midnight Network's dual-state architecture** and zero-knowledge Compact smart contracts. Borrowers obtain cryptographically signed financial attestations from accredited institutions, prove in client-side zero knowledge that they satisfy specific creditworthiness thresholds (e.g. Income >= $100k, Credit Score >= 750, Zero Defaults), and borrow undercollateralized liquidity directly from the pool without revealing their exact salary, credit score, or wallet identity.

## Privacy Model
- **What is PUBLIC (on-chain, anyone can see):**
  - Protocol pool liquidity (`total_liquidity`) and aggregate reserve metrics.
  - Active borrowing counts and total loans repaid.
  - Risk tier borrowing limits (Tier 1: 50,000 tDUST, Tier 2: 25,000 tDUST, Tier 3: 10,000 tDUST).
  - Single-use nullifiers in the on-chain `nullifier_registry` to prevent replay attacks and double-spending.
  - Disbursed loan amounts and accrued interest.
- **What is PRIVATE (private witness, never on-chain):**
  - Actual borrower annual income, salary, and earnings.
  - Actual credit score and credit bureau history.
  - Banking records, past defaults, and debt-to-income (DTI) ratio.
  - Borrower real-world identity and personal identifying information (PII).
  - The secret salt used to derive the cryptographic Pedersen commitment.
- **What the user PROVES without revealing:**
  - That their private attributes satisfy the mathematical criteria for a specific risk tier (`income >= min_income`, `credit_score >= min_score`, `defaults == 0`).
  - That their credential was cryptographically signed by an accredited, authorized institutional issuer.
  - That the derived nullifier is legitimately bound to the credential commitment without revealing the commitment itself.

## Privacy Claim
An on-chain observer or adversarial liquidity provider inspecting Midnight blocks or the 1AM Explorer **can only see**:
1. A transaction interacting with the VeilLend smart contract.
2. A single-use 32-byte cryptographic nullifier added to the `nullifier_registry`.
3. The public state transition updating pool reserves and disbursing tokens to a shielded address.

The observer **cannot see**:
1. Who the borrower is or their real-world identity.
2. How much the borrower earns or their exact credit score.
3. Any linking between multiple loans taken by the same borrower across different time periods.

## Risk Tiers & Loan Terms

| Tier | Tier Name | Required Thresholds | Max Loan Limit | Required Collateral | Base APR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **Tier 1** | **Prime** | Income >= $100k, Score >= 750, Repaid >= 5 | **50,000 tDUST** | **0% (Uncollateralized)** | 3.8% |
| **Tier 2** | **Standard** | Income >= $60k, Score >= 680, Repaid >= 2 | **25,000 tDUST** | **25% (Low Collateral)** | 6.5% |
| **Tier 3** | **Entry** | Income >= $30k, Score >= 600, Repaid >= 0 | **10,000 tDUST** | **60% (Reduced Collateral)** | 10.2% |

## Tech Stack
- **Smart Contract**: Midnight Compact (Minokawa) v0.23 (`contracts/veillend.compact`)
- **DApp Connector**: 1AM Wallet Extension & `@midnight-ntwrk/dapp-connector-api` on Midnight Preprod
- **Proving Provider**: 1AM Extension ProofStation (Zero local proof server required)
- **ZK Circuit Engine**: In-circuit mathematical constraints, Pedersen commitments, and Poseidon nullifiers (`src/midnight/zkProofEngine.ts`)
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons
- **Testing**: Vitest suite with **16 passing tests across 4 test suites** (`tests/`)

## Prerequisites
- **1AM Wallet Extension** installed in a Chromium-based browser (Chrome, Brave, Edge)
- **Node.js**: v20.x or v22.x LTS
- **Git**: For version control and cloning
- Testnet DUST (tDUST) on **Midnight Preprod** (available via 1AM faucet)

## Setup & Run Locally
1. Clone the repository:
   ```bash
   git clone https://github.com/mystic8340-ai/VeilLend.git
   cd VeilLend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify Compact smart contract syntax and ledger exports:
   ```bash
   npm run compact:verify
   ```
4. Start local development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` to interact with VeilLend, or `http://localhost:3000/deploy` for the browser extension deploy route.
5. Build for production:
   ```bash
   npm run build
   ```

## Run Tests
Run the standalone automated test suite across all circuits, state machines, and integration connectors:
```bash
npm test
```
Execution results:
```text
 ✓ tests/MidnightDAppIntegration.test.ts (4 tests)
 ✓ tests/CompactContract.test.ts (4 tests)
 ✓ tests/LendingPool.test.ts (3 tests)
 ✓ tests/ZkCreditProver.test.ts (5 tests)

 Test Files  4 passed (4)
      Tests  16 passed (16)
```

## CI/CD
VeilLend implements an automated GitHub Actions CI/CD pipeline (`.github/workflows/ci.yml`) that executes on every push to `main` and on pull requests across Node 20.x and 22.x:
1. **Source Checkout**: Retrieves repository code.
2. **Environment Setup**: Configures Node.js and installs locked dependencies.
3. **Compact AST Verification**: Verifies Compact contract syntax, circuits, and public ledger exports against `compiler-spec.json`.
4. **Static Typecheck**: Enforces strict TypeScript verification (`npm run lint`).
5. **Automated Testing**: Runs all 16 Vitest tests covering circuit constraints, state transitions, double-spending prevention, and 1AM transaction balancing.
6. **Production Compilation**: Executes `npm run build` validating all WASM modules, rollup chunks, and CSS assets.

## Usage Guide
See [docs/USAGE.md](docs/USAGE.md) for a comprehensive, non-technical walkthrough on connecting wallets, deploying instances, generating proofs, and borrowing funds.

## Product Proposal
See [PROPOSAL.md](PROPOSAL.md) for the Level 3 / Level 4 product proposal specification.

---

## License
Licensed under the [Apache License 2.0](LICENSE).
