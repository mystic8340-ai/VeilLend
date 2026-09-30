import { describe, it, expect, beforeEach } from 'vitest';
import { VeilLendProtocol } from '../src/midnight/veillendSimulator';
import { ZkProofEngine } from '../src/midnight/zkProofEngine';
import { CreditTier, FinancialAttributes } from '../src/midnight/contractTypes';

describe('VeilLend Privacy & State Transition Test Suite', () => {
  let protocol: VeilLendProtocol;
  let zkEngine: ZkProofEngine;

  beforeEach(() => {
    protocol = VeilLendProtocol.getInstance();
    zkEngine = ZkProofEngine.getInstance();
    protocol.resetState();
  });

  it('Test 1: Circuit logic computes correct mathematical constraints across all tiers', async () => {
    const issuerPk = protocol.DEFAULT_ISSUER_PK;

    // 1. Prime Tier ($100k+ income, 750+ score, 0% collateral)
    const primeCred = zkEngine.createAttestation(issuerPk, 'Prime Bank', {
      annualIncomeUSD: 135000,
      creditScore: 790,
      repaidLoansCount: 6,
      debtToIncomeRatioPct: 15,
      subjectIdentityHash: '0xprime_id',
      attestationSalt: '0xsalt1',
      issuedTimestamp: Date.now()
    });
    const primeProof = await zkEngine.generateCreditTierProof(
      primeCred, CreditTier.TIER_1_PRIME, 50000, 0, 'secret_1', 'nonce_1', issuerPk
    );
    expect(primeProof.status).toBe('proven');
    expect(primeProof.publicInputs.tier).toBe(CreditTier.TIER_1_PRIME);

    // 2. Standard Tier ($60k+ income, 680+ score, 25% collateral)
    const stdCred = zkEngine.createAttestation(issuerPk, 'Standard Bank', {
      annualIncomeUSD: 72000,
      creditScore: 695,
      repaidLoansCount: 3,
      debtToIncomeRatioPct: 22,
      subjectIdentityHash: '0xstd_id',
      attestationSalt: '0xsalt2',
      issuedTimestamp: Date.now()
    });
    const stdProof = await zkEngine.generateCreditTierProof(
      stdCred, CreditTier.TIER_2_STANDARD, 20000, 5000, 'secret_2', 'nonce_2', issuerPk
    );
    expect(stdProof.status).toBe('proven');
    expect(stdProof.publicInputs.tier).toBe(CreditTier.TIER_2_STANDARD);

    // 3. Entry Tier ($30k+ income, 600+ score, 60% collateral)
    const entryCred = zkEngine.createAttestation(issuerPk, 'Credit Union', {
      annualIncomeUSD: 38000,
      creditScore: 620,
      repaidLoansCount: 1,
      debtToIncomeRatioPct: 28,
      subjectIdentityHash: '0xentry_id',
      attestationSalt: '0xsalt3',
      issuedTimestamp: Date.now()
    });
    const entryProof = await zkEngine.generateCreditTierProof(
      entryCred, CreditTier.TIER_3_ENTRY, 10000, 6000, 'secret_3', 'nonce_3', issuerPk
    );
    expect(entryProof.status).toBe('proven');
    expect(entryProof.publicInputs.tier).toBe(CreditTier.TIER_3_ENTRY);
  });

  it('Test 2: State transitions update public ledger, active loans, and pool reserves accurately', async () => {
    const issuerPk = protocol.DEFAULT_ISSUER_PK;
    const initialLiq = protocol.getLedgerState().totalLiquidity;
    const initialLoansCount = protocol.getLedgerState().loanCount;

    const cred = zkEngine.createAttestation(issuerPk, 'Fintech Credit', {
      annualIncomeUSD: 110000,
      creditScore: 760,
      repaidLoansCount: 5,
      debtToIncomeRatioPct: 18,
      subjectIdentityHash: '0xstate_id',
      attestationSalt: '0xstate_salt',
      issuedTimestamp: Date.now()
    });
    const proof = await zkEngine.generateCreditTierProof(
      cred, CreditTier.TIER_1_PRIME, 30000, 0, 'secret_state', 'nonce_state', issuerPk
    );

    const loan = await protocol.submitLoanRequestWithProof(
      proof, 'mn_addr_preprod1qstateuser', CreditTier.TIER_1_PRIME, 30000, 0
    );

    const ledgerAfterBorrow = protocol.getLedgerState();
    expect(ledgerAfterBorrow.totalLiquidity).toBe(initialLiq - 30000);
    expect(ledgerAfterBorrow.loanCount).toBe(initialLoansCount + 1);
    expect(ledgerAfterBorrow.nullifierRegistry[proof.nullifier]).toBe(true);

    // Repay loan
    const repaid = await protocol.repayLoan(loan.id);
    expect(repaid.isRepaid).toBe(true);

    const ledgerAfterRepay = protocol.getLedgerState();
    expect(ledgerAfterRepay.activeLoans[proof.nullifier]).toBeUndefined();
    expect(ledgerAfterRepay.repaidLoanCount).toBeGreaterThan(0);
  });

  it('Test 3: Privacy preservation: Private financial attributes are never leaked to public ledger or proofs', async () => {
    const secretSalary = 240000;
    const secretScore = 825;
    const secretDti = 9;

    const confidentialCred = zkEngine.createAttestation(protocol.DEFAULT_ISSUER_PK, 'Private Trust', {
      annualIncomeUSD: secretSalary,
      creditScore: secretScore,
      repaidLoansCount: 12,
      debtToIncomeRatioPct: secretDti,
      subjectIdentityHash: '0xstrictly_confidential_hash',
      attestationSalt: '0xsuper_secret_salt_9999',
      issuedTimestamp: Date.now()
    });

    const proof = await zkEngine.generateCreditTierProof(
      confidentialCred, CreditTier.TIER_1_PRIME, 50000, 0, 'ultra_secret_borrower_key', 'loan_salt_44', protocol.DEFAULT_ISSUER_PK
    );

    // Verify proof publicInputs do NOT contain the raw salary, score, or salt
    const proofString = JSON.stringify(proof);
    expect(proofString).not.toContain(String(secretSalary));
    expect(proofString).not.toContain(String(secretScore));
    expect(proofString).not.toContain('0xsuper_secret_salt_9999');

    // Verify on-chain ledger state after loan request does NOT leak the private inputs
    await protocol.submitLoanRequestWithProof(
      proof, 'mn_addr_preprod1qprivate_borrower', CreditTier.TIER_1_PRIME, 50000, 0
    );
    const ledgerString = JSON.stringify(protocol.getLedgerState());
    expect(ledgerString).not.toContain(String(secretSalary));
    expect(ledgerString).not.toContain(String(secretScore));
    expect(ledgerString).not.toContain('0xsuper_secret_salt_9999');
  });

  it('Test 4: Disallow loan borrowing when requested amount exceeds tier max limit', async () => {
    const cred = zkEngine.createAttestation(protocol.DEFAULT_ISSUER_PK, 'Bank', {
      annualIncomeUSD: 150000,
      creditScore: 800,
      repaidLoansCount: 8,
      debtToIncomeRatioPct: 15,
      subjectIdentityHash: '0xoverflow_id',
      attestationSalt: '0xoverflow_salt',
      issuedTimestamp: Date.now()
    });

    // Tier 1 max limit is 50,000. Requesting 65,000 must reject
    await expect(
      zkEngine.generateCreditTierProof(
        cred, CreditTier.TIER_1_PRIME, 65000, 0, 'secret_overflow', 'nonce_overflow', protocol.DEFAULT_ISSUER_PK
      )
    ).rejects.toThrow(/exceeds Tier 1 cap/);
  });

  it('Test 5: Protocol solvency audit verifies reserve integrity without exposing individual loan nullifiers', async () => {
    const auditReport = await protocol.generateRegulatoryAudit('REG_AUDIT_FINAL_001');
    expect(auditReport.isSolvent).toBe(true);
    expect(auditReport.privacyPreserved).toBe(true);
    expect(auditReport.totalLiquidity).toBeGreaterThan(0);
    expect(auditReport.proofHash.startsWith('0x')).toBe(true);
  });
});
