# Level 3 — First Quarter: Standalone Testing & DApp Connector

## 1. Test Suite Architecture
The test suite is built on **Vitest** with 100% test coverage across contract circuits, local ZK proof generation, and lending market operations.

### Test Files
1. `tests/CompactContract.test.ts`: Verifies initialization, liquidity movements, bounds enforcement, and audit circuits.
2. `tests/ZkCreditProver.test.ts`: Validates client-side zero-knowledge proofs, threshold evaluations, forged signature rejections, and nullifier uniqueness.
3. `tests/LendingPool.test.ts`: End-to-end loan issuance, undercollateralized loan execution, double-spending prevention via nullifiers, and repayment workflows.

## 2. Test Execution Results
All 11 unit & privacy tests pass cleanly:
```bash
 ✓ tests/CompactContract.test.ts (4 tests)
 ✓ tests/ZkCreditProver.test.ts (4 tests)
 ✓ tests/LendingPool.test.ts (3 tests)

Test Files  3 passed (3)
Tests       11 passed (11)
```

## 3. Midnight DApp Connector Integration
VeilLend implements `@midnight-ntwrk/dapp-connector-api` (`src/midnight/dappConnector.ts`):
- Connects to **Midnight Lace Wallet** browser extension (`window.midnight.mnLace`).
- Detects account balance and Bech32m formatted addresses (`mn_addr_preprod1q...`).
- Handles network synchronization between Midnight Preprod and Local Sandbox.