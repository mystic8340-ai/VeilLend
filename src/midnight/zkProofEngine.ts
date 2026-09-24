// VeilLend Client-Side Zero-Knowledge Proof Engine
// Runs locally in borrower's browser / enclave; secrets never touch the network!

import { CreditTier, FinancialAttributes, SignedCredential, TIER_CONFIGS, ZkProofResult } from './contractTypes';

export class ZkProofEngine {
  private static instance: ZkProofEngine;

  private constructor() {}

  public static getInstance(): ZkProofEngine {
    if (!ZkProofEngine.instance) {
      ZkProofEngine.instance = new ZkProofEngine();
    }
    return ZkProofEngine.instance;
  }

  // Simple deterministic cryptographic hash representation for demo/testing
  public hash(data: string): string {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return '0x' + hex.repeat(8).slice(0, 64);
  }

  // Generate cryptographic attestation signed by Issuer
  public createAttestation(
    issuerPk: string,
    issuerName: string,
    attributes: FinancialAttributes
  ): SignedCredential {
    const rawPayload = `${issuerPk}_${attributes.subjectIdentityHash}_${attributes.annualIncomeUSD}_${attributes.creditScore}_${attributes.repaidLoansCount}_${attributes.debtToIncomeRatioPct}`;
    const commitmentHash = this.hash(rawPayload);
    const signature = this.hash(`SIG_${commitmentHash}_${issuerPk}`);

    return {
      id: `cred_${Date.now()}`.slice(0, 18),
      issuerName,
      issuerPublicKey: issuerPk,
      attributes,
      signature,
      commitmentHash
    };
  }

  // Derive single-use Nullifier to prevent credential replay attacks
  public deriveNullifier(borrowerSecret: string, loanSalt: string): string {
    return this.hash(`NULLIFIER_${borrowerSecret}_${loanSalt}`);
  }

  // Verify Issuer Signature inside ZK Enclave (Witness Circuit)
  public verifyIssuerSignature(credential: SignedCredential, expectedIssuerPk: string): boolean {
    if (credential.issuerPublicKey !== expectedIssuerPk) {
      return false;
    }
    const rawPayload = `${credential.issuerPublicKey}_${credential.attributes.subjectIdentityHash}_${credential.attributes.annualIncomeUSD}_${credential.attributes.creditScore}_${credential.attributes.repaidLoansCount}_${credential.attributes.debtToIncomeRatioPct}`;
    const expectedCommitment = this.hash(rawPayload);
    const expectedSig = this.hash(`SIG_${expectedCommitment}_${credential.issuerPublicKey}`);
    return credential.signature === expectedSig;
  }

  // Evaluate Tier Eligibility Threshold Circuit
  public evaluateTierThreshold(
    attributes: FinancialAttributes,
    targetTier: CreditTier
  ): { eligible: boolean; failureReasons: string[] } {
    const config = TIER_CONFIGS[targetTier];
    const failureReasons: string[] = [];

    if (attributes.annualIncomeUSD < config.minIncome) {
      failureReasons.push(`Annual income does not meet Tier ${targetTier} threshold of $${config.minIncome.toLocaleString()}`);
    }

    if (attributes.creditScore < config.minCreditScore) {
      failureReasons.push(`Credit score does not meet Tier ${targetTier} threshold of ${config.minCreditScore}`);
    }

    if (attributes.repaidLoansCount < config.minRepaidLoans) {
      failureReasons.push(`Repaid loans count (${attributes.repaidLoansCount}) is less than required ${config.minRepaidLoans}`);
    }

    if (attributes.debtToIncomeRatioPct > config.maxDtiPct) {
      failureReasons.push(`Debt-to-income ratio (${attributes.debtToIncomeRatioPct}%) exceeds maximum allowable ${config.maxDtiPct}%`);
    }

    return {
      eligible: failureReasons.length === 0,
      failureReasons
    };
  }

  // Generate Zero-Knowledge Proof for Compact circuit request_tier_loan
  public async generateCreditTierProof(
    credential: SignedCredential,
    targetTier: CreditTier,
    requestedAmount: number,
    borrowerSecret: string,
    loanSalt: string,
    authorizedIssuerPk: string
  ): Promise<ZkProofResult> {
    const startTime = performance.now();

    // 1. Verify Issuer Attestation Witness
    const isAttestationValid = this.verifyIssuerSignature(credential, authorizedIssuerPk);
    if (!isAttestationValid) {
      throw new Error("ZK Constraint Failed: Issuer signature is invalid or unauthorized.");
    }

    // 2. Evaluate Private Threshold Constraints
    const { eligible, failureReasons } = this.evaluateTierThreshold(credential.attributes, targetTier);
    if (!eligible) {
      throw new Error(`ZK Constraint Failed: ${failureReasons.join('; ')}`);
    }

    // 3. Verify requested amount is within tier maximum
    const config = TIER_CONFIGS[targetTier];
    if (requestedAmount > config.maxBorrowLimit) {
      throw new Error(`Requested amount (${requestedAmount}) exceeds Tier ${targetTier} max limit of ${config.maxBorrowLimit}`);
    }

    // 4. Derive deterministic nullifier
    const nullifier = this.deriveNullifier(borrowerSecret, loanSalt);

    // 5. Generate Proof Hash
    const proofHash = this.hash(`PROOF_${nullifier}_${targetTier}_${requestedAmount}_${startTime}`);

    // Simulated local proof computation delay (approx 180ms)
    await new Promise((resolve) => setTimeout(resolve, 180));

    const totalTimeMs = Math.round(performance.now() - startTime);

    return {
      circuitName: 'request_tier_loan',
      proofHash,
      nullifier,
      publicInputs: {
        tier: targetTier,
        requestedAmount,
        authorizedIssuer: authorizedIssuerPk,
        thresholdSatisfied: true
      },
      proofGenerationTimeMs: totalTimeMs,
      status: 'proven',
      timestamp: Date.now()
    };
  }
}
