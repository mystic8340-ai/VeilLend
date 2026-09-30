# Rise In Challenge — Submission Form Answers

### Task: Idea Submission
**Question 1 (Essay): What is your idea?**
```
VeilLend is a private lending protocol built on the Midnight Network that enables borrowers to prove their creditworthiness and access capital-efficient, undercollateralized loans without exposing their financial data or wallet identity to the public blockchain.

Problem: Today, DeFi lending protocols (such as Aave or Compound) require 130%–170% over-collateralization because they cannot verify borrower risk on-chain without doxxing the user. Conversely, undercollateralized lending solutions require publishing bank records, identity documents, and complete transaction histories on public ledgers, making users targets for phishing, espionage, and extortion.

Solution: VeilLend introduces a three-step selective disclosure workflow powered by Midnight's dual-state Compact smart contracts:
1. An accredited institution (bank, employer, or credit bureau) issues a cryptographically signed financial attestation that remains strictly in the user's local browser enclave.
2. The user executes a client-side Zero-Knowledge circuit that proves their financial attributes satisfy a specific credit tier threshold (e.g., "annual income >= $100k", "credit score >= 750", "repaid loans >= 5") and derives a single-use nullifier.
3. The VeilLend lending pool smart contract verifies the ZK proof on-chain, ensures the nullifier is unspent to prevent replay attacks, and disburses funds with risk-adjusted terms (Tier 1 Prime borrowers unlock 0% collateral loans up to 50,000 tDUST).

Why Midnight: Selective disclosure is the core requirement of confidential credit. With Midnight's Compact language, VeilLend keeps sensitive financial data private while allowing authorized compliance auditors to verify protocol reserve solvency.
```

**Question 2 (Single select): Choose a category**
```
Credentials & Eligibility / Confidential DeFi
```

---

### Task: Level 4 Submission Checklist
- **Public GitHub Repository**: [https://github.com/mystic8340-ai/VeilLend](https://github.com/mystic8340-ai/VeilLend)
- **Live Preprod Demo Link**: [https://veil-lend-chi.vercel.app](https://veil-lend-chi.vercel.app)
- **Deployed Preprod Contract Address**: [`22f0dbac3eae847cc0fdcf59c09b40d2a09955646e3a63e424b01a6d95d94f22`](https://explorer.1am.xyz/contract/22f0dbac3eae847cc0fdcf59c09b40d2a09955646e3a63e424b01a6d95d94f22?network=preprod)
- **On-Chain Preprod Deploy Tx Hash**: [`8060a14a00c59c33181905b47bf1f4240ca633bf3f364b7ab367328d6d1db8af`](https://explorer.1am.xyz/tx/8060a14a00c59c33181905b47bf1f4240ca633bf3f364b7ab367328d6d1db8af?network=preprod) (Block #2781045)
- **CI/CD Badge / Workflow**: `.github/workflows/ci.yml` (Passing automated lint, test, and build runs across Node 20.x and 22.x)
- **Demo Video Walkthrough**: `docs/DEMO_WALKTHROUGH.md`
- **Meaningful Commits**: 24+ granular, descriptive commits in git history strictly authored by `mystic8340-ai`.