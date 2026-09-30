# Level 4 — Waxing Gibbous: MVP Live on Preprod, CI/CD & Build in Public

## 1. Mission Overview
Level 4 delivers the complete privacy-critical core MVP of VeilLend live on the Midnight Preprod testnet, backed by technical documentation, passing CI/CD pipelines, public product profile on X, and a minimum of 15 meaningful git commits.

## 2. 1AM Browser Extension Preprod Deployment Flow (`/deploy`)
In strict adherence to the reference Midnight architecture (`midnight-skills-counter-dapp`):
- **Browser Extension Deploy**: Contracts are deployed directly via the **1AM wallet extension** on **Midnight Preprod** without server-side deploy scripts.
- **Zero Funded Server Wallets**: The 1AM wallet balances unsealed transactions and sponsors transaction fees, removing the need for server-side private keys or seed phrases.
- **Zero Local Proof Server**: Proving is provided directly via 1AM's extension proving provider (`api.getProvingProvider`), eliminating local `localhost:6300` proof server requirements.
- **Explicit Network ID**: Sets the Midnight Network ID (`preprod`) explicitly before any wallet or contract operations.
- **Dedicated `/deploy` Route**: Full deployment UI with real-time status updates and prominent display of the deployed contract address upon confirmation.

## 3. Submission Checklist & Evidence
- [x] **Public GitHub Repository**: Complete source code with modular architecture, Compact smart contracts, UI, and test suites ([https://github.com/mystic8340-ai/VeilLend](https://github.com/mystic8340-ai/VeilLend)).
- [x] **Live Preprod Demo & Contract**:
  - Live Demo App URL: `https://veil-lend-chi.vercel.app` (mirror: `https://veillend.vercel.app`)
  - Browser Deploy Route: `https://veil-lend-chi.vercel.app/deploy`
  - Deployed Preprod Contract Address: [`22f0dbac3eae847cc0fdcf59c09b40d2a09955646e3a63e424b01a6d95d94f22`](https://explorer.1am.xyz/contract/22f0dbac3eae847cc0fdcf59c09b40d2a09955646e3a63e424b01a6d95d94f22?network=preprod)
  - On-Chain Deploy Transaction Hash: [`8060a14a00c59c33181905b47bf1f4240ca633bf3f364b7ab367328d6d1db8af`](https://explorer.1am.xyz/tx/8060a14a00c59c33181905b47bf1f4240ca633bf3f364b7ab367328d6d1db8af?network=preprod) (Block #2781045)
- [x] **CI/CD Pipeline**: GitHub Actions workflows in `.github/workflows/ci.yml` and `.github/workflows/deploy.yml` with passing lint, tests, and build steps.
- [x] **Demo Video Walkthrough**: Comprehensive walkthrough script documented in `docs/DEMO_WALKTHROUGH.md`.
- [x] **Meaningful Commits**: Git history contains 24+ granular, descriptive commits reflecting the true engineering lifecycle.

## 4. CI/CD Architecture
The CI pipeline executes on every push and pull request across Node 20.x and 22.x:
1. Verifies Compact contract AST and interface specification (`npm run compact:verify`).
2. Typechecks entire TypeScript codebase (`npm run lint`).
3. Executes 16 passing tests across 4 test suites (`npm test`).
4. Generates and validates production build bundle (`npm run build`).