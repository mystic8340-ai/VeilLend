import { describe, it, expect, beforeEach } from 'vitest';
import { VeilLendProtocol } from '../src/midnight/veillendSimulator';
import { ZkProofEngine } from '../src/midnight/zkProofEngine';
import { CreditTier, FinancialAttributes } from '../src/midnight/contractTypes';

describe('VeilLend Confidential Lending Market & On-Chain State Machine Suite', () => {
  let protocol: VeilLendProtocol;
  let zkEngine: ZkProofEngine;

  beforeEach(() => {
    protocol = VeilLendProtocol.getInstance();
    zkEngine = ZkProofEngine.getInstance();
    protocol.resetState();
  });

  it('Test 1: Prime borrower originates undercollateralized loan with 0% collateral and registers nullifier on-chain', async () => {
    const primeAttributes: FinancialAttributes = {
      annualIncomeUSD: 160000,
      creditScore: 810,
      repaidLoansCount: 9,
      debtToIncomeRatioPct: 12,
      subjectIdentityHash: '0xprime_identity_hash',
      attestationSalt: '0xprime_salt_001',
      issuedTimestamp: Date.now()
    };

    const credential = zkEngine.createAttestation(protocol.DEFAULT_ISSUER_PK, 'Apex Credit Verifier', primeAttributes);
    const proof = await zkEngine.generateCreditTierProof(
      credential,
      CreditTier.TIER_1_PRIME,
      45000,
      0, // 0% collateral!
      'secret_prime_user',
      'salt_prime_01',
      protocol.DEFAULT_ISSUER_PK
    );

    const borrowerAddress = 'mn_addr_preprod1qprimeuser12345';
    const initialLiquidity = protocol.getLedgerState().totalLiquidity;
    const initialBorrowed = protocol.getLedgerState().totalBorrowed;

    const loan = await protocol.submitLoanRequestWithProof(
      proof,
      borrowerAddress,
      CreditTier.TIER_1_PRIME,
      45000,
      0
    );

    expect(loan.id).toBeDefined();
    expect(loan.tier).toBe(CreditTier.TIER_1_PRIME);
    expect(loan.principalAmount).toBe(45000);
    expect(loan.collateralDeposited).toBe(0);
    expect(loan.interestApr).toBe(3.8);
    expect(loan.isRepaid).toBe(false);

    // Verify on-chain nullifier registry stores nullifier and active loan
    const ledger = protocol.getLedgerState();
    expect(ledger.nullifierRegistry[proof.nullifier]).toBe(true);
    expect(ledger.activeLoans[proof.nullifier]).toBe(45000);
    expect(ledger.totalLiquidity).toBe(initialLiquidity - 45000);
    expect(ledger.totalBorrowed).toBe(initialBorrowed + 45000);
  });

  it('Test 2: Double-spending prevention: Reusing the same ZK nullifier throws on-chain error', async () => {
    const primeAttributes: FinancialAttributes = {
      annualIncomeUSD: 120000,
      creditScore: 760,
      repaidLoansCount: 5,
      debtToIncomeRatioPct: 18,
      subjectIdentityHash: '0xprime_identity_hash_2',
      attestationSalt: '0xprime_salt_002',
      issuedTimestamp: Date.now()
    };

    const credential = zkEngine.createAttestation(protocol.DEFAULT_ISSUER_PK, 'Apex Credit Verifier', primeAttributes);
    const proof = await zkEngine.generateCreditTierProof(
      credential,
      CreditTier.TIER_1_PRIME,
      20000,
      0,
      'secret_prime_user_2',
      'fixed_salt_reuse',
      protocol.DEFAULT_ISSUER_PK
    );

    // First loan succeeds
    await protocol.submitLoanRequestWithProof(proof, 'mn_addr_preprod1qborrowerA', CreditTier.TIER_1_PRIME, 20000, 0);

    // Second loan with exact same nullifier MUST be rejected by on-chain nullifier_registry
    await expect(
      protocol.submitLoanRequestWithProof(proof, 'mn_addr_preprod1qborrowerA', CreditTier.TIER_1_PRIME, 20000, 0)
    ).rejects.toThrow(/Double-spending detected: Nullifier has already been consumed on-chain/);
  });

  it('Test 3: Loan repayment verifies registered nullifier, settles active debt, and updates protocol reserves', async () => {
    const activeLoans = protocol.getActiveLoans();
    const targetLoan = activeLoans[0];
    const initialRepaid = protocol.getLedgerState().totalRepaid;
    const initialBorrowed = protocol.getLedgerState().totalBorrowed;

    // Verify loan is active before settlement
    expect(protocol.getLedgerState().activeLoans[targetLoan.nullifier]).toBe(targetLoan.principalAmount);

    const settledLoan = await protocol.repayLoan(targetLoan.id);
    expect(settledLoan.isRepaid).toBe(true);
    expect(settledLoan.totalRepaidAmount).toBeGreaterThan(targetLoan.principalAmount);

    // Verify active debt record is deleted from active_loans map upon settlement
    const ledger = protocol.getLedgerState();
    expect(ledger.activeLoans[targetLoan.nullifier]).toBeUndefined();
    expect(ledger.totalRepaid).toBe(initialRepaid + targetLoan.principalAmount);
    expect(ledger.totalBorrowed).toBe(initialBorrowed - targetLoan.principalAmount);

    // Attempting to repay an already settled loan must throw
    await expect(
      protocol.repayLoan(targetLoan.id)
    ).rejects.toThrow(/already been fully settled/);
  });
});