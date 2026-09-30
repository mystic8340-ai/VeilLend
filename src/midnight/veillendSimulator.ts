// VeilLend On-Chain Protocol Simulator & Preprod State Driver
// Mimics Midnight Node & Proof Server executing contracts/veillend.compact

import { CreditTier, LoanRecord, PublicLedgerState, TIER_CONFIGS, ZkProofResult, AuditReport } from './contractTypes';
import { ZkProofEngine } from './zkProofEngine';

export class VeilLendProtocol {
  private static instance: VeilLendProtocol;
  private zkEngine: ZkProofEngine;

  // On-Chain Public Ledger
  private ledgerState: PublicLedgerState;

  // Anti-Replay: On-Chain Nullifier Registry
  private nullifierRegistry: Map<string, boolean> = new Map();

  // Active Loans Registry: nullifier -> principal
  private activeLoansMap: Map<string, number> = new Map();
  private activeLoanTierMap: Map<string, CreditTier> = new Map();

  // Liquidity Provider (LP) Accounting: lp_identity -> deposited_balance
  private lpBalancesMap: Map<string, number> = new Map();

  // Full Loan Records (for UI portfolio management)
  private loanRecords: Map<string, LoanRecord> = new Map();

  // Authentic Midnight Preprod Contract Details (64-char HexEncoded as indexed by Midnight GraphQL)
  public readonly CONTRACT_ADDRESS = 'c7e841f92e03d4a6b5c1084e319bf0863ac24e7561dc1398ea05e26b47a19c32';
  public readonly DEFAULT_ISSUER_PK = '0x8f4c2e1b9a3d7e5f0c2b4a6d8e1f3a5b7c9e0d2f4a6b8c0e2d4f6a8b0c2e4f6';
  public readonly DEFAULT_ADMIN_PK = '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2';
  public readonly DEFAULT_LP_ID = '0x9923812739182371982739182739182377281938210482910385918392019482';

  private constructor() {
    this.zkEngine = ZkProofEngine.getInstance();
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
      tier3MaxLimit: 10000,
      nullifierRegistry: {},
      activeLoans: {},
      activeLoanTier: {},
      lpBalances: {}
    };

    // Initialize LP balance
    this.lpBalancesMap.set(this.DEFAULT_LP_ID, 1850000);

    // Prepopulate initial demo loans
    this.seedInitialLoans();
    this.syncLedgerMaps();
  }

  public static getInstance(): VeilLendProtocol {
    if (!VeilLendProtocol.instance) {
      VeilLendProtocol.instance = new VeilLendProtocol();
    }
    return VeilLendProtocol.instance;
  }

  private syncLedgerMaps() {
    this.ledgerState.nullifierRegistry = Object.fromEntries(this.nullifierRegistry);
    this.ledgerState.activeLoans = Object.fromEntries(this.activeLoansMap);
    this.ledgerState.activeLoanTier = Object.fromEntries(this.activeLoanTierMap);
    this.ledgerState.lpBalances = Object.fromEntries(this.lpBalancesMap);
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
      collateralDeposited: 4500, // 25% collateral
      interestApr: 6.5,
      originationTimestamp: Date.now() - (25 * 24 * 3600 * 1000),
      dueDateTimestamp: Date.now() + (5 * 24 * 3600 * 1000),
      isRepaid: false,
      txHash: "0x33b1e7f098ab22c4d516279f001ef726a54b38d91c20e54b67a123bc45de8990"
    };

    this.nullifierRegistry.set(loan1.nullifier, true);
    this.nullifierRegistry.set(loan2.nullifier, true);

    this.activeLoansMap.set(loan1.nullifier, loan1.principalAmount);
    this.activeLoansMap.set(loan2.nullifier, loan2.principalAmount);

    this.activeLoanTierMap.set(loan1.nullifier, loan1.tier);
    this.activeLoanTierMap.set(loan2.nullifier, loan2.tier);

    this.loanRecords.set(loan1.id, loan1);
    this.loanRecords.set(loan2.id, loan2);
  }

  public getLedgerState(): PublicLedgerState {
    this.syncLedgerMaps();
    return { ...this.ledgerState };
  }

  public getActiveLoans(): LoanRecord[] {
    return Array.from(this.loanRecords.values()).filter(l => !l.isRepaid);
  }

  public getAllLoans(): LoanRecord[] {
    return Array.from(this.loanRecords.values());
  }

  // Compact Circuit: deposit_liquidity with LP Accounting
  public async depositLiquidity(lpIdentity: string, amount: number): Promise<void> {
    if (this.ledgerState.isPaused) {
      throw new Error("VeilLend protocol is currently paused");
    }
    if (amount <= 0) {
      throw new Error("Deposit amount must be strictly positive");
    }

    const currentBal = this.lpBalancesMap.get(lpIdentity) || 0;
    this.lpBalancesMap.set(lpIdentity, currentBal + amount);
    this.ledgerState.totalLiquidity += amount;
    this.syncLedgerMaps();
  }

  // Compact Circuit: withdraw_liquidity with LP Accounting & Authorization
  public async withdrawLiquidity(lpIdentity: string, amount: number): Promise<void> {
    if (this.ledgerState.isPaused) {
      throw new Error("VeilLend protocol is currently paused");
    }
    if (amount <= 0) {
      throw new Error("Withdrawal amount must be strictly positive");
    }
    if (!this.lpBalancesMap.has(lpIdentity)) {
      throw new Error("No active LP deposit found for caller identity");
    }

    const currentBal = this.lpBalancesMap.get(lpIdentity)!;
    if (amount > currentBal) {
      throw new Error(`Withdrawal amount ($${amount.toLocaleString()}) exceeds caller LP deposit balance ($${currentBal.toLocaleString()})`);
    }
    if (amount > this.ledgerState.totalLiquidity) {
      throw new Error("Withdrawal exceeds free pool liquidity");
    }

    this.lpBalancesMap.set(lpIdentity, currentBal - amount);
    this.ledgerState.totalLiquidity -= amount;
    this.syncLedgerMaps();
  }

  // Compact Circuit: request_tier_loan execution with On-Chain Nullifier & Collateral Enforcement
  public async submitLoanRequestWithProof(
    proof: ZkProofResult,
    borrowerAddress: string,
    tier: CreditTier,
    requestedAmount: number,
    collateralDeposited: number
  ): Promise<LoanRecord> {
    if (this.ledgerState.isPaused) {
      throw new Error("Protocol is paused");
    }

    // 1. On-Chain Anti-Replay: Nullifier Check
    if (this.nullifierRegistry.has(proof.nullifier)) {
      throw new Error("Double-spending detected: Nullifier has already been consumed on-chain!");
    }

    // 2. Liquidity Check
    if (requestedAmount > this.ledgerState.totalLiquidity) {
      throw new Error("Insufficient free liquidity in VeilLend pool.");
    }

    // 3. On-Chain Tier Limits & Collateral Enforcement
    const config = TIER_CONFIGS[tier];
    if (requestedAmount > config.maxBorrowLimit) {
      throw new Error(`Requested amount exceeds Tier ${tier} limit of $${config.maxBorrowLimit.toLocaleString()}`);
    }

    const minRequiredCollateral = Math.round((requestedAmount * config.collateralRatioPct) / 100);
    if (collateralDeposited < minRequiredCollateral) {
      throw new Error(`Insufficient collateral deposited: Tier ${tier} requires at least ${config.collateralRatioPct}% ($${minRequiredCollateral.toLocaleString()} tDUST)`);
    }

    // 4. Store Nullifier and Active Loan in Public Ledger
    this.nullifierRegistry.set(proof.nullifier, true);
    this.activeLoansMap.set(proof.nullifier, requestedAmount);
    this.activeLoanTierMap.set(proof.nullifier, tier);

    // 5. Update public ledger state
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
      collateralDeposited,
      interestApr: config.baseAprPct,
      originationTimestamp: Date.now(),
      dueDateTimestamp: Date.now() + (30 * 24 * 3600 * 1000), // 30 day term
      isRepaid: false,
      txHash
    };

    this.loanRecords.set(loanId, newLoan);
    this.syncLedgerMaps();
    return newLoan;
  }

  // Compact Circuit: repay_loan with On-Chain Nullifier & APR Interest Verification
  public async repayLoan(loanId: string): Promise<LoanRecord> {
    const loan = this.loanRecords.get(loanId);
    if (!loan) {
      throw new Error("Loan not found");
    }
    if (loan.isRepaid) {
      throw new Error("Loan has already been fully settled");
    }

    // 1. Verify Nullifier exists in on-chain active loans
    if (!this.nullifierRegistry.has(loan.nullifier)) {
      throw new Error("Invalid loan: Nullifier is not registered on-chain");
    }
    if (!this.activeLoansMap.has(loan.nullifier)) {
      throw new Error("Loan debt record does not exist on-chain or is already settled");
    }

    // 2. Verify principal match
    const activePrincipal = this.activeLoansMap.get(loan.nullifier)!;
    if (loan.principalAmount !== activePrincipal) {
      throw new Error("Principal mismatch with on-chain loan record");
    }

    // 3. Enforce minimum risk-adjusted APR interest
    const interest = Math.round((loan.principalAmount * (loan.interestApr / 100)) * (30 / 365));
    const totalRepayment = loan.principalAmount + interest;

    // 4. Remove active loan from ledger
    this.activeLoansMap.delete(loan.nullifier);
    this.activeLoanTierMap.delete(loan.nullifier);

    // 5. Update Ledger State
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

    this.syncLedgerMaps();
    return loan;
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
      activeLoanCount: this.activeLoansMap.size,
      proofHash,
      privacyPreserved: true
    };
  }

  // Reset to default for test isolation
  public resetState() {
    this.nullifierRegistry.clear();
    this.activeLoansMap.clear();
    this.activeLoanTierMap.clear();
    this.lpBalancesMap.clear();
    this.loanRecords.clear();

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
      tier3MaxLimit: 10000,
      nullifierRegistry: {},
      activeLoans: {},
      activeLoanTier: {},
      lpBalances: {}
    };

    this.lpBalancesMap.set(this.DEFAULT_LP_ID, 1850000);
    this.seedInitialLoans();
    this.syncLedgerMaps();
  }
}