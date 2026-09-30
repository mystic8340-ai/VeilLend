# How to Use VeilLend

## What You Need
- A modern desktop web browser (Google Chrome, Brave, Edge)
- The **1AM Wallet Extension** installed and unlocked
- Active network set to **Midnight Preprod**
- Testnet DUST (tDUST) tokens for borrowing collateral and fees (available via 1AM faucet)

## Step-by-Step Guide

### 1. Connect Your 1AM Wallet
1. Open the VeilLend application at [https://veil-lend-chi.vercel.app](https://veil-lend-chi.vercel.app).
2. Click **"Connect 1AM"** in the top-right navigation bar.
3. In the 1AM extension popup, approve the connection. Confirm the network indicator displays **Preprod**.

### 2. Deploy or Connect to the VeilLend Lending Pool
1. Navigate to the **Deploy (/deploy)** tab.
2. Confirm the network displays **Midnight Preprod**.
3. Click **"Deploy VeilLend Contract via 1AM Extension"**.
4. The 1AM extension will automatically prove the deployment circuit and sponsor gas fees.
5. Once confirmed by the Midnight indexer, your newly deployed contract address will be displayed on screen. Click **"Open Lending Market with this Contract"**.

### 3. Issue and Sign Financial Credentials (Demo Enclave)
1. Navigate to the **Credential Issuer** tab.
2. Enter financial data (Annual Income, Credit Score, Defaults, and DTI ratio).
3. Click **"Sign Financial Credential"** to create a cryptographically signed attestation.
4. This attestation remains strictly in your local browser storage; it is never uploaded to any server or ledger.

### 4. Generate Zero-Knowledge Credit Proof
1. Navigate to the **ZK Credit Prover** tab.
2. Select your desired borrowing tier (e.g. **Tier 1 Prime** for uncollateralized borrowing).
3. Click **"Generate ZK Proof"**.
4. VeilLend evaluates the circuit locally: proving that your income and credit score meet the tier thresholds and deriving a single-use nullifier.
5. Your exact financial values remain 100% confidential.

### 5. Borrow from the Lending Pool
1. Navigate to the **Lending Market** tab.
2. Select your approved credit tier and enter the desired loan amount.
3. Submit the transaction. The smart contract validates the zero-knowledge proof, checks that the nullifier is unspent, and disburses funds to your shielded address.

### 6. Repay Your Loan
1. Navigate to the **My Loans** tab to view your active debts and interest accrued.
2. Click **"Repay Loan"** to settle the debt and replenish pool liquidity.

---

## What Gets Proved (and What Stays Private)

| Data Point | Visibility | Explanation |
| :--- | :--- | :--- |
| **Exact Income & Salary** | 🔒 Private | Remains strictly in local client memory; never sent to the network. |
| **Exact Credit Score** | 🔒 Private | Never revealed to lenders, auditors, or the public ledger. |
| **Past Banking Records** | 🔒 Private | Kept in local cryptographic enclave. |
| **Credit Tier Threshold** | 🔍 Proved | Mathematical proof that attributes satisfy tier requirements (e.g. Income >= $100k). |
| **Attestation Validity** | 🔍 Proved | Proof that the credential was signed by an authorized issuer. |
| **Nullifier** | 🌐 Public | Single-use cryptographic hash recorded on-chain to prevent double-borrowing. |
| **Loan Balance & Reserves** | 🌐 Public | Ledger balance updated for protocol solvency and liquidity accounting. |

---

## Troubleshooting

### 1. "Wallet not connected"
Ensure your 1AM extension is installed and unlocked, and that you have clicked "Connect 1AM" in the navigation bar.

### 2. "Transaction not found" on 1AM Explorer
- **Network Setting**: Check the top-right header of 1AM Explorer. If it shows **Mainnet**, switch it to **Preprod** (amber dot).
- **Route Format**: Use `/contract/<address>` for contracts and `/tx/<hash>` for transactions. Do not paste a contract address into `/tx/`.
- **Block Time**: Midnight Preprod produces blocks every ~10-20 seconds. Please allow a few moments for indexing.
