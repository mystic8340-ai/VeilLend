import { describe, it, expect, beforeEach } from 'vitest';
import { VeilLendProtocol } from '../src/midnight/veillendSimulator';

describe('VeilLend Compact Smart Contract Suite', () => {
  let protocol: VeilLendProtocol;

  beforeEach(() => {
    protocol = VeilLendProtocol.getInstance();
    protocol.resetState();
  });

  it('Test 1: initialize_lending_pool initializes public ledger state correctly', () => {
    const ledger = protocol.getLedgerState();
    expect(ledger.poolAdminPk).toBe(protocol.DEFAULT_ADMIN_PK);
    expect(ledger.authorizedIssuerPk).toBe(protocol.DEFAULT_ISSUER_PK);
    expect(ledger.totalLiquidity).toBeGreaterThan(0);
    expect(ledger.isPaused).toBe(false);
    expect(ledger.tier1MaxLimit).toBe(50000);
    expect(ledger.tier2MaxLimit).toBe(25000);
    expect(ledger.tier3MaxLimit).toBe(10000);
  });

  it('Test 2: deposit_liquidity increases pool liquidity', async () => {
    const before = protocol.getLedgerState().totalLiquidity;
    await protocol.depositLiquidity(50000);
    const after = protocol.getLedgerState().totalLiquidity;
    expect(after).toBe(before + 50000);
  });

  it('Test 3: withdraw_liquidity enforces liquidity constraints', async () => {
    const before = protocol.getLedgerState().totalLiquidity;
    await protocol.withdrawLiquidity(20000);
    const after = protocol.getLedgerState().totalLiquidity;
    expect(after).toBe(before - 20000);

    // Over-withdrawal attempt must throw
    await expect(protocol.withdrawLiquidity(999999999)).rejects.toThrow('Withdrawal exceeds free pool liquidity');
  });

  it('Test 4: disclose_solvency_audit verifies protocol solvency without exposing borrower data', async () => {
    const audit = await protocol.generateRegulatoryAudit('REG_AUDIT_PREPROD_001');
    expect(audit.isSolvent).toBe(true);
    expect(audit.privacyPreserved).toBe(true);
    expect(audit.proofHash).toContain('0x');
    expect(audit.activeLoanCount).toBeGreaterThan(0);
  });
});
