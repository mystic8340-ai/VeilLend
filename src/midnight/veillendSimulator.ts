// VeilLend On-Chain Protocol Simulator & Preprod State Driver
// Mimics Midnight Node & Proof Server executing veillend.compact

import { CreditTier, LoanRecord, PublicLedgerState, SignedCredential, TIER_CONFIGS, ZkProofResult, AuditReport } from './contractTypes';
import { ZkProofEngine } from './zkProofEngine';

export class VeilLendProtocol {
  private static instance: VeilLendProtocol;
  private zkEngine: ZkProofEngine;

  // On-Chain Public Ledger
  private ledgerState: PublicLedgerState;

  // Registry of Nullifiers (Enforces single-use on chain)
  private spentNullifiers: Set<string> = new Set();

  // Active Loans Registry
  private activeLoans: Map<string, LoanRecord> = new Map();

  // Preprod Contract Details
  public readonly CONTRACT_ADDRESS = 'mn_contract_preprod1qveil9872lk90qw2k84z7m1f38y64x';
  public readonly DEFAULT_ISSUER_PK = '0x8f4c2e1b9a3d7e5f0c2b4a6d8e1f3a5b7c9e0d2f4a6b8c0e2d4f6a8b0c2e4f6';
  public readonly DEFAULT_ADMIN_PK = '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2';

  private constructor() {
    this.zkEngine = ZkProofEngine.getInstance();
    this.ledgerState = {
      poolAdminPk: this.DEFAULT_ADMIN_PK,
      authorizedIssuerPk: this.DEFAULT_ISSUER_PK,
      totalLiquidity: 1850000, // 1.85M tDUST initial liquidity
      totalBorrowed: 310000,   // 310k tDUST currently borrowed
      totalRepaid: 125000,
      totalReserveInterest: 14200,
      loanCount: 14,
      repaidLoanCount: 6,
      activeBorrowersCount: 8,
      isPaused: false,
      tier1MaxLimit: 50000,
      tier2MaxLimit: 25000,
      tier3MaxLimit: 10000
    };

    // Prepopulate initial demo loans
    this.seedInitialLoans();
  }

  public static getInstance(): VeilLendProtocol {
    if (!VeilLendProtocol.instance) {
      VeilLendProtocol.instance = new VeilLendProtocol();
    }
    return VeilLendProtocol.instance;
  }

  private seedInitialLoans() {
    const loan1: LoanRecord = {
      id: "loan_demo_01",
      nullifier: "0x7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b",
      borrowerAddress: "mn_addr_preprod1q9v8k74z8g2f6w30pxc5y7h0d1a4j8k3x2m9n1",
      tier: CreditTier.TIER_1_PRIME,
      principalAmount: 35000,
      collateralDeposited: 0,
      interestApr: 3.8,
      originationTimestamp: Date.now() - (7 * 24 * 3600 * 1000),
      dueDateTimestamp: Date.now() + (23 * 24 * 3600 * 1000),
      isRepaid: false,
      txHash: "0x89f41a8c20be31d994e6371f50cae7284b55e391a27e025b906f3325c43d8e91"
    };

    const loan2: LoanRecord = {
      id: "loan_demo_02",
      nullifier: "0x1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2",
      borrowerAddress: "mn_addr_preprod1q9v8k74z8g2f6w30pxc5y7h0d1a4j8k3x2m9n1",
      tier: CreditTier.TIER_2_STANDARD,
      principalAmount: 18000,
      collateralDeposited: 4500,
      interestApr: 6.5,
      originationTimestamp: Date.now() - (25 * 24 * 3600 * 1000),
      dueDateTimestamp: Date.now() + (5 * 24 * 3600 * 1000),
      isRepaid: false,
      txHash: "0x33b1e7f098ab22c4d516279f001ef726a54b38d91c20e54b67a123bc45de8990"
    };

    this.spentNullifiers.add(loan1.nullifier);
    this.spentNullifiers.add(loan2.nullifier);
    this.activeLoans.set(loan1.id, loan1);
    this.activeLoans.set(loan2.id, loan2);
  }

  public getLedgerState(): PublicLedgerState {
    return { ...this.ledgerState };
  }

  public getActiveLoans(): LoanRecord[] {
    return Array.from(this.activeLoans.values()).filter(l => !l.isRepaid);
  }

  public getAllLoans(): LoanRecord[] {
    return Array.from(this.activeLoans.values());
  }

  // Compact Circuit: request_tier_loan execution
  public async submitLoanRequestWithProof(
    proof: ZkProofResult,
    borrowerAddress: string,
    tier: CreditTier,
    requestedAmount: number
  ): Promise<LoanRecord> {
    if (this.ledgerState.isPaused) {
      throw new Error("Protocol is paused");
    }

    if (this.spentNullifiers.has(proof.nullifier)) {
      throw new Error("Double-Spend / Replay detected: Nullifier has already been consumed on-chain!");
    }

    if (requestedAmount > this.ledgerState.totalLiquidity) {
      throw new Error("Insufficient free liquidity in VeilLend pool.");
    }

    const config = TIER_CONFIGS[tier];
    if (requestedAmount > config.maxBorrowLimit) {
      throw new Error(`Requested amount exceeds Tier ${tier} limit`);
    }

    // Calculate required collateral based on tier (0% for Tier 1!)
    const collateralRequired = Math.round((requestedAmount * config.collateralRatioPct) / 100);

    // Consume Nullifier on-chain
    this.spentNullifiers.add(proof.nullifier);

    // Update public ledger
    this.ledgerState.totalLiquidity -= requestedAmount;
    this.ledgerState.totalBorrowed += requestedAmount;
    this.ledgerState.loanCount += 1;
    this.ledgerState.activeBorrowersCount += 1;

    const loanId = `loan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const txHash = this.zkEngine.hash(`TX_${loanId}_${proof.nullifier}`);

    const newLoan: LoanRecord = {
      id: loanId,
      nullifier: proof.nullifier,
      borrowerAddress,
      tier,
      principalAmount: requestedAmount,
      collateralDeposited: collateralRequired,
      interestApr: config.baseAprPct,
      originationTimestamp: Date.now(),
      dueDateTimestamp: Date.now() + (30 * 24 * 3600 * 1000), // 30 day term
      isRepaid: false,
      txHash
    };

    this.activeLoans.set(loanId, newLoan);
    return newLoan;
  }

  // Compact Circuit: repay_loan
  public async repayLoan(loanId: string): Promise<LoanRecord> {
    const loan = this.activeLoans.get(loanId);
    if (!loan) {
      throw new Error("Loan not found");
    }
    if (loan.isRepaid) {
      throw new Error("Loan has already been fully repaid");
    }

    // Calculate interest (approx for 30 days)
    const interest = Math.round((loan.principalAmount * (loan.interestApr / 100)) * (30 / 365));
    const totalRepayment = loan.principalAmount + interest;

    // Update Ledger State
    this.ledgerState.totalLiquidity += totalRepayment;
    this.ledgerState.totalBorrowed -= loan.principalAmount;
    this.ledgerState.totalRepaid += loan.principalAmount;
    this.ledgerState.totalReserveInterest += interest;
    this.ledgerState.repaidLoanCount += 1;
    if (this.ledgerState.activeBorrowersCount > 0) {
      this.ledgerState.activeBorrowersCount -= 1;
    }

    loan.isRepaid = true;
    loan.repaymentTimestamp = Date.now();
    loan.totalRepaidAmount = totalRepayment;

    return loan;
  }

  // Deposit Liquidity (LPs)
  public async depositLiquidity(amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Deposit amount must be strictly positive");
    this.ledgerState.totalLiquidity += amount;
  }

  // Withdraw Liquidity (LPs)
  public async withdrawLiquidity(amount: number): Promise<void> {
    if (amount <= 0) throw new Error("Withdrawal amount must be strictly positive");
    if (amount > this.ledgerState.totalLiquidity) {
      throw new Error("Withdrawal exceeds free pool liquidity");
    }
    this.ledgerState.totalLiquidity -= amount;
  }

  // Selective Disclosure Regulatory Audit Circuit
  public async generateRegulatoryAudit(auditToken: string): Promise<AuditReport> {
    const isSolvent = (this.ledgerState.totalLiquidity + this.ledgerState.totalBorrowed) >= this.ledgerState.totalRepaid;
    const proofHash = this.zkEngine.hash(`AUDIT_${auditToken}_${Date.now()}`);

    return {
      timestamp: Date.now(),
      isSolvent,
      totalLiquidity: this.ledgerState.totalLiquidity,
      totalBorrowed: this.ledgerState.totalBorrowed,
      totalRepaid: this.ledgerState.totalRepaid,
      activeLoanCount: this.activeLoans.size,
      proofHash,
      privacyPreserved: true // User balances and identities are hidden
    };
  }

  // Reset to default for test isolation
  public resetState() {
    this.spentNullifiers.clear();
    this.activeLoans.clear();
    this.ledgerState = {
      poolAdminPk: this.DEFAULT_ADMIN_PK,
      authorizedIssuerPk: this.DEFAULT_ISSUER_PK,
      totalLiquidity: 1850000,
      totalBorrowed: 310000,
      totalRepaid: 125000,
      totalReserveInterest: 14200,
      loanCount: 14,
      repaidLoanCount: 6,
      activeBorrowersCount: 8,
      isPaused: false,
      tier1MaxLimit: 50000,
      tier2MaxLimit: 25000,
      tier3MaxLimit: 10000
    };
    this.seedInitialLoans();
  }
}
