# VeilLend — Zero-Knowledge Private Lending Protocol on Midnight

[![CI/CD Pipeline](https://github.com/mystic8340-ai/VeilLend/actions/workflows/ci.yml/badge.svg)](https://github.com/mystic8340-ai/VeilLend/actions)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod_Live-6366F1?logo=cardano)](https://midnight.network)
[![1AM Wallet](https://img.shields.io/badge/1AM_Wallet-Preprod_Ready-06B6D4)](https://1am.xyz)
[![Smart Contract](https://img.shields.io/badge/Compact-v0.23-10B981)](contracts/veillend.compact)
[![License](https://img.shields.io/badge/License-Apache_2.0-8B5CF6)](LICENSE)
[![X Profile](https://img.shields.io/badge/X-@VeilLend-black?logo=x)](https://x.com/VeilLend)

**VeilLend** is a confidential, risk-adjusted lending protocol built on the **Midnight Network** that allows borrowers to prove their creditworthiness (income thresholds, clean repayment history, credit tiers) using zero-knowledge proofs without exposing their raw financial data or wallet identity to the public ledger.

- 🌐 **Live Preprod Demo**: [https://veillend.vercel.app](https://veillend.vercel.app)
- 🚀 **Browser Contract Deploy Route**: [https://veillend.vercel.app/deploy](https://veillend.vercel.app/deploy) (or local `http://localhost:3000/deploy`)
- 📜 **Preprod Contract Address**: `c7e841f92e03d4a6b5c1084e319bf0863ac24e7561dc1398ea05e26b47a19c32`
- 🐦 **Product Profile on X**: [@VeilLend](https://x.com/VeilLend)
- 📹 **Demo Walkthrough Video Script**: [docs/DEMO_WALKTHROUGH.md](docs/DEMO_WALKTHROUGH.md)

---

## 🚀 1AM Preprod Browser Extension Deployment Flow (`/deploy`)

VeilLend strictly implements the **1AM on Midnight Preprod** browser extension deployment flow (mirrored from the reference `midnight-skills-counter-dapp` architecture):

1. **Browser Extension Only**: Deployments execute entirely client-side via the [1AM browser extension](https://1am.xyz).
2. **Zero Server Wallets**: No funded server-side deployer wallets or seed phrases are used. 1AM balances unsealed transactions and sponsors fees.
3. **No Local Proof Server Required**: Proving is executed directly by the 1AM extension's built-in proving provider (`api.getProvingProvider`), eliminating local `localhost:6300` proof server requirements.
4. **Explicit Network ID**: The Midnight Network ID is set explicitly (`preprod`) prior to any contract or wallet operations.
5. **Dedicated `/deploy` Route**: Access `http://localhost:3000/deploy` to trigger the browser deployment flow, monitor indexer confirmation, and immediately view the deployed contract address.

### How to Deploy via Browser:
1. Open the DApp and navigate to the **Deploy (/deploy)** tab or URL `/deploy`.
2. Connect your **1AM Wallet** set to **Midnight Preprod**.
3. Click **"Deploy VeilLend Contract via 1AM Extension"**.
4. The 1AM extension automatically proves the deploy circuit and balances the transaction.
5. Upon confirmation by the Midnight indexer, your newly deployed contract address is displayed on screen with instant one-click integration into the Lending Market!

---

## The Problem
DeFi lending today is trapped in a dilemma:
1. **Capital-Inefficient Over-Collateralization**: Requiring 130%–170% collateral in crypto assets, locking out prime borrowers and everyday capital seekers.
2. **Transparent Wallet Doxxing**: Undercollateralized lending on public blockchains forces users to expose their salary, identity, and full transaction history on-chain.

## The Solution: Selective Disclosure on Midnight
VeilLend uses Midnight's dual-state architecture (Public Ledger + Local Private State) and zero-knowledge circuit execution:
1. **Cryptographic Attestation**: Accredited institutions issue signed financial credentials stored strictly in the borrower's local browser enclave.
2. **Client-Side ZK Proving**: The borrower proves satisfaction of a credit tier threshold in ZK (`income >= min`, `score >= min`, `repaid >= min`) and derives a single-use nullifier.
3. **On-Chain Verification & Funding**: The `veillend.compact` smart contract verifies the proof, burns the nullifier, and disburses liquidity according to risk-adjusted terms.

---

## Risk Tiers & Loan Terms

| Tier | Tier Name | Required Thresholds | Max Loan Limit | Required Collateral | Base APR |
|:---:|:---:|:---:|:---:|:---:|:---:|
| **Tier 1** | **Prime** | Income $\ge \$100\text{k}$, Score $\ge 750$, Repaid $\ge 5$ | **50,000 tDUST** | **0% (Uncollateralized)** | 3.8% |
| **Tier 2** | **Standard** | Income $\ge \$60\text{k}$, Score $\ge 680$, Repaid $\ge 2$ | **25,000 tDUST** | **25% (Low Collateral)** | 6.5% |
| **Tier 3** | **Entry** | Income $\ge \$30\text{k}$, Score $\ge 600$, Repaid $\ge 0$ | **10,000 tDUST** | **60% (Reduced Collateral)** | 10.2% |

---

## 🏆 Hackathon Idea Track Alignment: Credentials & Eligibility
VeilLend directly fulfills the **"Credentials"** and **"Eligibility"** categories from the official Rise In / Midnight challenge idea list:
1. **Credentials**: Institutional issuers sign private user credentials (`SignedCredential`) verifying financial attributes (income, credit score, defaults, DTI) with cryptographic signatures.
2. **Eligibility**: Borrowers execute client-side zero-knowledge proofs demonstrating that their private attributes satisfy risk tier thresholds without disclosing values or wallet identity.
3. **Allowlist / Protocol Gating**: The Compact smart contract validates proofs and nullifiers on-chain, granting borrowing eligibility exclusively to verified zero-knowledge credentials.

---

## Technical Stack
- **Smart Contract Language**: Midnight Compact (Minokawa) v0.23 (`contracts/veillend.compact`)
- **DApp Connector & Deployer**: 1AM Wallet Extension & `@midnight-ntwrk/dapp-connector-api` on Midnight Preprod
- **Proving Provider**: 1AM Extension ProofStation (Zero local proof server required)
- **ZK Circuit Engine**: In-circuit mathematical constraints, Pedersen commitments, and Poseidon nullifiers (`src/midnight/zkProofEngine.ts`)
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons
- **Testing**: Vitest suite with **15 passing tests across 4 test suites** (`tests/`):
  - `CompactContract.test.ts` (4 unit tests): Ledger state, LP accounting, withdrawals & solvency
  - `ZkCreditProver.test.ts` (5 unit tests): In-circuit constraints, forged signatures & nullifiers
  - `LendingPool.test.ts` (3 unit tests): Undercollateralized loans, double-spending prevention & repayment
  - `MidnightDAppIntegration.test.ts` (3 integration tests): DApp connector authentication & contract AST specification
- **CI/CD**: GitHub Actions workflows for continuous integration (`ci.yml`), Compact AST verification (`compact:verify`), and preprod release packaging (`deploy.yml`)

---

## Quickstart & Local Development

### 1. Clone & Install
```bash
git clone https://github.com/mystic8340-ai/VeilLend.git
cd veillend
npm install
```

### 2. Verify Compact Smart Contract
```bash
npm run compact:verify
```

### 3. Run Test Suite (15 Passing Tests)
```bash
npm test
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to interact with the VeilLend application, or `http://localhost:3000/deploy` for the browser extension contract deployment UI.

### 5. Build for Production
```bash
npm run build
```

---

## Hackathon Documentation Index
- [Level 1 — New Moon Specification](docs/LEVEL_1_NEW_MOON.md)
- [Level 2 — Waxing Crescent Contract Design](docs/LEVEL_2_WAXING_CRESCENT.md)
- [Level 3 — First Quarter Standalone Testing](docs/LEVEL_3_FIRST_QUARTER.md)
- [Level 4 — Waxing Gibbous MVP Live Preprod & CI/CD](docs/LEVEL_4_WAXING_GIBBOUS.md)
- [Level 5 — Full Moon Lending Pool Logic](docs/LEVEL_5_FULL_MOON.md)
- [Level 6 — Supermoon Polished UI & Compliance](docs/LEVEL_6_SUPERMOON.md)
- [Demo Video Walkthrough Script](docs/DEMO_WALKTHROUGH.md)
- [Product X Profile Kit](docs/X_PRODUCT_PROFILE.md)
- [Rise In Form Submission Answers](docs/SUBMISSION_ANSWERS.md)

---

## License
Licensed under the [Apache License 2.0](LICENSE).