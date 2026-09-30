import { describe, it, expect } from 'vitest';
import { ZkProofEngine } from '../src/midnight/zkProofEngine';
import { CreditTier, FinancialAttributes } from '../src/midnight/contractTypes';

describe('VeilLend Unit Tests: Zero-Knowledge Credit Prover & Mathematical Constraint Model', () => {
  const engine = ZkProofEngine.getInstance();
  const issuerPk = '0x8f4c2e1b9a3d7e5f0c2b4a6d8e1f3a5b7c9e0d2f4a6b8c0e2d4f6a8b0c2e4f6';

  const primeBorrower: FinancialAttributes = {
    annualIncomeUSD: 145000,
    creditScore: 785,
    repaidLoansCount: 7,
    debtToIncomeRatioPct: 14,
    subjectIdentityHash: '0x99238127391823719827391827391823',
    attestationSalt: '0xaabbccddeeff00112233445566778899',
    issuedTimestamp: Date.now()
  };

  it('Test 1: In-circuit prover succeeds when all mathematical constraints are met', async () => {
    const credential = engine.createAttestation(issuerPk, 'First National Bank & Trust', primeBorrower);
    expect(credential.signature).toBeDefined();

    const proof = await engine.generateCreditTierProof(
      credential,
      CreditTier.TIER_1_PRIME,
      40000,
      0, // Tier 1: 0% collateral
      'borrower_secret_key_999',
      'salt_loan_request_1',
      issuerPk
    );

    expect(proof.status).toBe('proven');
    expect(proof.circuitName).toBe('request_tier_loan');
    expect(proof.nullifier).toContain('0x');
    expect(proof.publicInputs.tier).toBe(CreditTier.TIER_1_PRIME);
    expect(proof.publicInputs.thresholdSatisfied).toBe(true);
    expect(proof.publicInputs.inCircuitVerified).toBe(true);
  });

  it('Test 2: In-circuit mathematical constraints reject sub-threshold credentials directly in circuit', async () => {
    // Sub-threshold income ($85k < $100k requirement)
    const lowIncomeBorrower: FinancialAttributes = {
      ...primeBorrower,
      annualIncomeUSD: 85000
    };
    const credLowIncome = engine.createAttestation(issuerPk, 'Bank', lowIncomeBorrower);

    await expect(
      engine.generateCreditTierProof(credLowIncome, CreditTier.TIER_1_PRIME, 30000, 0, 'sec1', 'salt1', issuerPk)
    ).rejects.toThrow(/verified income >= \$100,000/);

    // Sub-threshold credit score (720 < 750 requirement)
    const lowScoreBorrower: FinancialAttributes = {
      ...primeBorrower,
      creditScore: 720
    };
    const credLowScore = engine.createAttestation(issuerPk, 'Bank', lowScoreBorrower);

    await expect(
      engine.generateCreditTierProof(credLowScore, CreditTier.TIER_1_PRIME, 30000, 0, 'sec2', 'salt2', issuerPk)
    ).rejects.toThrow(/credit score >= 750/);

    // Sub-threshold repaid loans (3 < 5 requirement)
    const lowRepaidBorrower: FinancialAttributes = {
      ...primeBorrower,
      repaidLoansCount: 3
    };
    const credLowRepaid = engine.createAttestation(issuerPk, 'Bank', lowRepaidBorrower);

    await expect(
      engine.generateCreditTierProof(credLowRepaid, CreditTier.TIER_1_PRIME, 30000, 0, 'sec3', 'salt3', issuerPk)
    ).rejects.toThrow(/requires at least 5 repaid loans/);

    // Excessive DTI (25% > 20% limit)
    const highDtiBorrower: FinancialAttributes = {
      ...primeBorrower,
      debtToIncomeRatioPct: 25
    };
    const credHighDti = engine.createAttestation(issuerPk, 'Bank', highDtiBorrower);

    await expect(
      engine.generateCreditTierProof(credHighDti, CreditTier.TIER_1_PRIME, 30000, 0, 'sec4', 'salt4', issuerPk)
    ).rejects.toThrow(/debt-to-income ratio <= 20%/);
  });

  it('Test 3: In-circuit verification rejects forged or unverified issuer signature commitment', async () => {
    const credential = engine.createAttestation(issuerPk, 'First National Bank', primeBorrower);
    const unauthorizedIssuerPk = '0x1111111111111111111111111111111111111111111111111111111111111111';

    await expect(
      engine.generateCreditTierProof(
        credential,
        CreditTier.TIER_1_PRIME,
        25000,
        0,
        'borrower_secret_key_999',
        'salt_loan_request_3',
        unauthorizedIssuerPk
      )
    ).rejects.toThrow(/Issuer signature is invalid or unauthorized/);
  });

  it('Test 4: On-chain collateral check enforces required minimum collateral for Tier 2 and Tier 3', async () => {
    const standardBorrower: FinancialAttributes = {
      annualIncomeUSD: 75000,
      creditScore: 710,
      repaidLoansCount: 3,
      debtToIncomeRatioPct: 28,
      subjectIdentityHash: '0xstd123',
      attestationSalt: '0xsaltstd',
      issuedTimestamp: Date.now()
    };

    const credStandard = engine.createAttestation(issuerPk, 'Credit Agency', standardBorrower);

    // Tier 2 requires 25% collateral: for 20,000 tDUST, min collateral is 5,000 tDUST
    // Providing only 2,000 tDUST must fail in-circuit check
    await expect(
      engine.generateCreditTierProof(
        credStandard,
        CreditTier.TIER_2_STANDARD,
        20000,
        2000, // Insufficient: only 10%
        'sec_std',
        'salt_std_1',
        issuerPk
      )
    ).rejects.toThrow(/requires at least 25%/);

    // Providing 5,000 tDUST (25%) succeeds
    const validProof = await engine.generateCreditTierProof(
      credStandard,
      CreditTier.TIER_2_STANDARD,
      20000,
      5000,
      'sec_std',
      'salt_std_2',
      issuerPk
    );
    expect(validProof.status).toBe('proven');
  });

  it('Test 5: Nullifiers are uniquely derived per loan salt to prevent linkability', () => {
    const secret = 'user_private_enclave_key_42';
    const nullifier1 = engine.deriveNullifier(secret, 'loan_nonce_01');
    const nullifier2 = engine.deriveNullifier(secret, 'loan_nonce_02');

    expect(nullifier1).not.toBe(nullifier2);
  });
});