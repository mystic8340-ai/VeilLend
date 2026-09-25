import { describe, it, expect } from 'vitest';
import { ZkProofEngine } from '../src/midnight/zkProofEngine';
import { CreditTier, FinancialAttributes } from '../src/midnight/contractTypes';

describe('VeilLend Zero-Knowledge Credit Tier Prover Suite', () => {
  const engine = ZkProofEngine.getInstance();
  const issuerPk = '0x8f4c2e1b9a3d7e5f0c2b4a6d8e1f3a5b7c9e0d2f4a6b8c0e2d4f6a8b0c2e4f6';

  const primeBorrower: FinancialAttributes = {
    annualIncomeUSD: 145000,
    creditScore: 785,
    repaidLoansCount: 7,
    debtToIncomeRatioPct: 14,
    subjectIdentityHash: '0x99238127391823719827391827391823',
    issuedTimestamp: Date.now()
  };

  const entryBorrower: FinancialAttributes = {
    annualIncomeUSD: 42000,
    creditScore: 630,
    repaidLoansCount: 1,
    debtToIncomeRatioPct: 38,
    subjectIdentityHash: '0x11223344556677889900aabbccddeeff',
    issuedTimestamp: Date.now()
  };

  it('Test 1: Prover successfully generates valid ZK proof for Tier 1 Prime threshold', async () => {
    const credential = engine.createAttestation(issuerPk, 'First National Bank & Trust', primeBorrower);
    expect(credential.signature).toBeDefined();

    const proof = await engine.generateCreditTierProof(
      credential,
      CreditTier.TIER_1_PRIME,
      40000,
      'borrower_secret_key_999',
      'salt_loan_request_1',
      issuerPk
    );

    expect(proof.status).toBe('proven');
    expect(proof.circuitName).toBe('request_tier_loan');
    expect(proof.nullifier).toContain('0x');
    expect(proof.publicInputs.tier).toBe(CreditTier.TIER_1_PRIME);
    expect(proof.publicInputs.thresholdSatisfied).toBe(true);
  });

  it('Test 2: Prover rejects Tier 1 Prime attempt when borrower only qualifies for Tier 3', async () => {
    const credential = engine.createAttestation(issuerPk, 'Midwest Credit Bureau', entryBorrower);

    await expect(
      engine.generateCreditTierProof(
        credential,
        CreditTier.TIER_1_PRIME, // Requesting Tier 1 with entry attributes
        30000,
        'borrower_secret_key_888',
        'salt_loan_request_2',
        issuerPk
      )
    ).rejects.toThrow(/ZK Constraint Failed/);
  });

  it('Test 3: Prover rejects forged or unverified issuer signature in witness evaluation', async () => {
    const credential = engine.createAttestation(issuerPk, 'First National Bank', primeBorrower);
    const rogueIssuerPk = '0x1111111111111111111111111111111111111111111111111111111111111111';

    await expect(
      engine.generateCreditTierProof(
        credential,
        CreditTier.TIER_1_PRIME,
        25000,
        'borrower_secret_key_999',
        'salt_loan_request_3',
        rogueIssuerPk // Unauthorized issuer
      )
    ).rejects.toThrow('Issuer signature is invalid or unauthorized');
  });

  it('Test 4: Nullifiers are uniquely generated per loan salt to prevent linkability', () => {
    const secret = 'user_private_enclave_key_42';
    const nullifier1 = engine.deriveNullifier(secret, 'loan_nonce_01');
    const nullifier2 = engine.deriveNullifier(secret, 'loan_nonce_02');

    expect(nullifier1).not.toBe(nullifier2);
  });
});
