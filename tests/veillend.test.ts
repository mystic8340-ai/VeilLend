import { describe, it, expect, beforeEach } from 'vitest';
import { VeilLendProtocol } from '../src/midnight/veillendSimulator';
import { ZkProofEngine } from '../src/midnight/zkProofEngine';
import { CreditTier } from '../src/midnight/contractTypes';

describe('VeilLend Protocol & Compact Contract Test Suite', () => {
  let protocol: VeilLendProtocol;
  let zkEngine: ZkProofEngine;

  beforeEach(() => {
    protocol = VeilLendProtocol.getInstance();
    zkEngine = ZkProofEngine.getInstance();
    protocol.resetState();
  });

  it('Requirement a: In-circuit logic validates financial thresholds without disclosing private inputs', async () => {
    const cred = zkEngine.createAttestation(protocol.DEFAULT_ISSUER_PK, 'Tier 1 Bank', {
      annualIncomeUSD: 120000,
      creditScore: 770,
      repaidLoansCount: 6,
      debtToIncomeRatioPct: 14,
      subjectIdentityHash: '0xborrower_private_hash',
      attestationSalt: '0xsecret_salt_123',
      issuedTimestamp: Date.now()
    });

    const proof = await zkEngine.generateCreditTierProof(
      cred,
      CreditTier.TIER_1_PRIME,
      40000,
      0,
      'borrower_secret_key',
      'borrower_nonce',
      protocol.DEFAULT_ISSUER_PK
    );

    expect(proof.status).toBe('proven');
    expect(proof.publicInputs.tier).toBe(CreditTier.TIER_1_PRIME);
    expect(proof.publicInputs.requestedAmount).toBe(40000);
    expect(proof.publicInputs.inCircuitVerified).toBe(true);
    // Secret values must never be in public inputs
    expect(JSON.stringify(proof.publicInputs)).not.toContain('120000');
    expect(JSON.stringify(proof.publicInputs)).not.toContain('770');
  });

  it('Requirement b: Ledger state updates accurately upon loan origination and prevents double borrowing via nullifier', async () => {
    const initialLiquidity = protocol.getLedgerState().totalLiquidity;
    const cred = zkEngine.createAttestation(protocol.DEFAULT_ISSUER_PK, 'Lending Bureau', {
      annualIncomeUSD: 110000,
      creditScore: 760,
      repaidLoansCount: 5,
      debtToIncomeRatioPct: 18,
      subjectIdentityHash: '0xborrower_replay_test',
      attestationSalt: '0xsalt_replay',
      issuedTimestamp: Date.now()
    });

    const proof = await zkEngine.generateCreditTierProof(
      cred,
      CreditTier.TIER_1_PRIME,
      25000,
      0,
      'secret_key_replay',
      'nonce_replay',
      protocol.DEFAULT_ISSUER_PK
    );

    // First loan request
    const loan = await protocol.submitLoanRequestWithProof(
      proof,
      'mn_addr_preprod1qtestreplay',
      CreditTier.TIER_1_PRIME,
      25000,
      0
    );

    expect(loan.principalAmount).toBe(25000);
    expect(protocol.getLedgerState().totalLiquidity).toBe(initialLiquidity - 25000);
    expect(protocol.getLedgerState().nullifierRegistry[proof.nullifier]).toBe(true);

    // Replay attack: submitting same proof with already registered nullifier must reject
    await expect(
      protocol.submitLoanRequestWithProof(
        proof,
        'mn_addr_preprod1qattacker',
        CreditTier.TIER_1_PRIME,
        25000,
        0
      )
    ).rejects.toThrow(/Double-spending detected/);
  });

  it('Requirement c: Selective disclosure solvency audit preserves borrower identity', async () => {
    const audit = await protocol.generateRegulatoryAudit('REG_TEST_99');
    expect(audit.isSolvent).toBe(true);
    expect(audit.privacyPreserved).toBe(true);
    expect(audit.totalLiquidity).toBeGreaterThan(0);
    expect(typeof audit.proofHash).toBe('string');
  });
});
