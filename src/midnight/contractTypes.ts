// VeilLend Contract Types & Midnight Interfaces

export enum CreditTier {
  TIER_1_PRIME = 1,     // Prime: >=$100k, Score >=750, Repaid >=5, DTI <=20% -> 0% Collateral, 3.8% APR, Max 50,000 tDUST
  TIER_2_STANDARD = 2,  // Standard: >=$60k, Score >=680, Repaid >=2, DTI <=35% -> 25% Collateral, 6.5% APR, Max 25,000 tDUST
  TIER_3_ENTRY = 3      // Entry: >=$30k, Score >=600, Repaid >=0, DTI <=50% -> 60% Collateral, 10.2% APR, Max 10,000 tDUST
}

export interface TierConfig {
  tier: CreditTier;
  name: string;
  badge: string;
  minIncome: number;
  minCreditScore: number;
  minRepaidLoans: number;
  maxDtiPct: number;
  maxBorrowLimit: number;
  collateralRatioPct: number; // 0 = uncollateralized, 25 = 25% collateral, etc.
  baseAprPct: number;
  description: string;
}

export const TIER_CONFIGS: Record<CreditTier, TierConfig> = {
  [CreditTier.TIER_1_PRIME]: {
    tier: CreditTier.TIER_1_PRIME,
    name: "Tier 1: Prime Tier",
    badge: "Undercollateralized (0% Collateral)",
    minIncome: 100000,
    minCreditScore: 750,
    minRepaidLoans: 5,
    maxDtiPct: 20,
    maxBorrowLimit: 50000,
    collateralRatioPct: 0,
    baseAprPct: 3.8,
    description: "Full privacy-preserving zero-collateral loan for verified prime borrowers."
  },
  [CreditTier.TIER_2_STANDARD]: {
    tier: CreditTier.TIER_2_STANDARD,
    name: "Tier 2: Standard Tier",
    badge: "Low Collateral (25% Collateral)",
    minIncome: 60000,
    minCreditScore: 680,
    minRepaidLoans: 2,
    maxDtiPct: 35,
    maxBorrowLimit: 25000,
    collateralRatioPct: 25,
    baseAprPct: 6.5,
    description: "Capital-efficient low collateral borrowing with proven credit track record."
  },
  [CreditTier.TIER_3_ENTRY]: {
    tier: CreditTier.TIER_3_ENTRY,
    name: "Tier 3: Entry Tier",
    badge: "Reduced Collateral (60% Collateral)",
    minIncome: 30000,
    minCreditScore: 600,
    minRepaidLoans: 0,
    maxDtiPct: 50,
    maxBorrowLimit: 10000,
    collateralRatioPct: 60,
    baseAprPct: 10.2,
    description: "Accessible on-chain credit with significantly lower collateral than conventional DeFi."
  }
};

export interface FinancialAttributes {
  annualIncomeUSD: number;
  creditScore: number;
  repaidLoansCount: number;
  debtToIncomeRatioPct: number;
  subjectIdentityHash: string; // Anonymous hash of borrower identity
  attestationSalt: string;     // Cryptographic blinding salt
  issuedTimestamp: number;
}

export interface SignedCredential {
  id: string;
  issuerName: string;
  issuerPublicKey: string;
  attributes: FinancialAttributes;
  signature: string;
  commitmentHash: string;
}

export interface LoanRecord {
  id: string;
  nullifier: string;
  borrowerAddress: string;
  tier: CreditTier;
  principalAmount: number;
  collateralDeposited: number;
  interestApr: number;
  originationTimestamp: number;
  dueDateTimestamp: number;
  isRepaid: boolean;
  repaymentTimestamp?: number;
  totalRepaidAmount?: number;
  txHash: string;
}

export interface PublicLedgerState {
  poolAdminPk: string;
  authorizedIssuerPk: string;
  totalLiquidity: number;
  totalBorrowed: number;
  totalRepaid: number;
  totalReserveInterest: number;
  loanCount: number;
  repaidLoanCount: number;
  activeBorrowersCount: number;
  isPaused: boolean;
  tier1MaxLimit: number;
  tier2MaxLimit: number;
  tier3MaxLimit: number;
  nullifierRegistry: Record<string, boolean>;
  activeLoans: Record<string, number>;
  activeLoanTier: Record<string, number>;
  lpBalances: Record<string, number>;
}

export interface ZkProofResult {
  circuitName: string;
  proofHash: string;
  nullifier: string;
  publicInputs: {
    tier: CreditTier;
    requestedAmount: number;
    collateralDeposited: number;
    authorizedIssuer: string;
    thresholdSatisfied: boolean;
    inCircuitVerified: boolean;
  };
  proofGenerationTimeMs: number;
  status: 'proven' | 'verified' | 'failed';
  timestamp: number;
}

export interface AuditReport {
  timestamp: number;
  isSolvent: boolean;
  totalLiquidity: number;
  totalBorrowed: number;
  totalRepaid: number;
  activeLoanCount: number;
  proofHash: string;
  privacyPreserved: boolean;
}