# VeilLend — Zero-Knowledge Private Lending Protocol on Midnight

[![CI/CD Pipeline](https://github.com/mystic8340-ai/VeilLend/actions/workflows/ci.yml/badge.svg)](https://github.com/mystic8340-ai/VeilLend/actions)
[![Midnight Network](https://img.shields.io/badge/Midnight-Preprod_Live-6366F1?logo=cardano)](https://midnight.network)
[![Smart Contract](https://img.shields.io/badge/Compact-v0.23-06B6D4)](contracts/veillend.compact)
[![License](https://img.shields.io/badge/License-Apache_2.0-10B981)](LICENSE)
[![X Profile](https://img.shields.io/badge/X-@VeilLend-black?logo=x)](https://x.com/VeilLend)

**VeilLend** is a confidential, risk-adjusted lending protocol built on the **Midnight Network** that allows borrowers to prove their creditworthiness (income thresholds, clean repayment history, credit tiers) using zero-knowledge proofs without exposing their raw financial data or wallet identity to the public ledger.

- 🌐 **Live Preprod Demo**: [https://veillend.vercel.app](https://veillend.vercel.app)
- 📜 **Preprod Contract Address**: `mn_contract_preprod1qveil9872lk90qw2k84z7m1f38y64x`
- 🐦 **Product Profile on X**: [@VeilLend](https://x.com/VeilLend)
- 📹 **Demo Walkthrough Video Script**: [docs/DEMO_WALKTHROUGH.md](docs/DEMO_WALKTHROUGH.md)

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

## Technical Stack
- **Smart Contract Language**: Midnight Compact (Minokawa) v0.23 (`contracts/veillend.compact`)
- **DApp Connector**: `@midnight-ntwrk/dapp-connector-api` with Midnight Lace Wallet support
- **ZK Circuit Engine**: Client-side witness proving and nullifier derivation (`src/midnight/zkProofEngine.ts`)
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons
- **Testing**: Vitest suite with 100% passing tests (`tests/`)
- **CI/CD**: GitHub Actions workflows for continuous integration and preprod deployment

---

## Quickstart & Local Development

### 1. Clone & Install
```bash
git clone https://github.com/mystic8340-ai/VeilLend.git
cd veillend
npm install
```

### 2. Run Tests
```bash
npm test
```

### 3. Run Development Server
```bash
npm run dev
```
Open `http://localhost:3000` to interact with the VeilLend application.

### 4. Build for Production
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