# Level 5 — Full Moon: Lending Pool Logic & Risk-Adjusted Terms

## 1. Risk Tier Framework & Economic Modeling
VeilLend pioneers risk-adjusted undercollateralized lending through zero-knowledge proofs:

| Tier | Tier Name | Min Income | Min Credit Score | Min Repaid Loans | Max Borrow Cap | Required Collateral | Base APR |
|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | **Prime** | $100,000 | 750 | 5 | 50,000 tDUST | **0% (Uncollateralized)** | 3.8% |
| **2** | **Standard** | $60,000 | 680 | 2 | 25,000 tDUST | **25% (Low Collateral)** | 6.5% |
| **3** | **Entry** | $30,000 | 600 | 0 | 10,000 tDUST | **60% (Reduced Collateral)**| 10.2% |

## 2. Capital Liquidity & Yield Engine
- **Liquidity Providers (LPs)** deposit tDUST into the VeilLend pool.
- Borrowers pay risk-adjusted interest upon repayment.
- 85% of accrued interest is distributed pro-rata to LPs as passive yield (~5.4% APY).
- 15% of interest accumulates in the protocol reserve fund to protect against default risk.

## 3. Settlement & Nullifier Consumption
When a loan is originated, the Compact circuit atomically burns the borrower's single-use nullifier on-chain. When settled, `repay_loan` restores liquidity to the public ledger and increments `repaid_loan_count`.