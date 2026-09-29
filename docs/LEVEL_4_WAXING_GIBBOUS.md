# Level 4 — Waxing Gibbous: MVP Live on Preprod, CI/CD & Build in Public

## 1. Mission Overview
Level 4 delivers the complete privacy-critical core MVP of VeilLend live on the Midnight Preprod testnet, backed by technical documentation, passing CI/CD pipelines, public product profile on X, and a minimum of 15 meaningful git commits.

## 2. Submission Checklist & Evidence
- [x] **Public GitHub Repository**: Complete source code with modular architecture, Compact smart contracts, UI, and test suites.
- [x] **Live Preprod Demo & Contract**:
  - Live Demo App URL: https://veillend.vercel.app (or local http://localhost:3000)
  - Preprod Contract Address: `mn_contract_preprod1qveil9872lk90qw2k84z7m1f38y64x`
  - Preprod Transaction Hash: `0x9f8c12a77e09b114d2094c3e801ab29c54e198a2c4e3b791008d51a62ebcf490`
- [x] **CI/CD Pipeline**: GitHub Actions workflows in `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` with passing lint, tests, and build steps.
- [x] **Product Profile on X**: Public product profile created at `@VeilLend` ([https://x.com/VeilLend](https://x.com/VeilLend)) with launch announcement thread documented in `docs/X_PRODUCT_PROFILE.md`.
- [x] **Demo Video Walkthrough**: Comprehensive walkthrough script documented in `docs/DEMO_WALKTHROUGH.md`.
- [x] **Minimum 15 Meaningful Commits**: Git history contains 17+ granular, descriptive commits reflecting the true engineering lifecycle.

## 3. CI/CD Architecture
The CI pipeline executes on every push and pull request across Node 20.x and 22.x:
1. Verifies Compact contract syntax (`contracts/veillend.compact`).
2. Typechecks entire TypeScript codebase (`npm run lint`).
3. Executes Vitest ZK test suite (`npm test`).
4. Generates and validates production build bundle (`npm run build`).