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
    expect(ledger.activeLoans).toBeDefined();
    expect(ledger.nullifierRegistry).toBeDefined();
    expect(ledger.lpBalances).toBeDefined();
  });

  it('Test 2: deposit_liquidity enforces per-LP accounting and increases pool reserves', async () => {
    const newLp = '0x1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff';
    const beforeLiq = protocol.getLedgerState().totalLiquidity;

    await protocol.depositLiquidity(newLp, 75000);

    const ledger = protocol.getLedgerState();
    expect(ledger.totalLiquidity).toBe(beforeLiq + 75000);
    expect(ledger.lpBalances[newLp]).toBe(75000);
  });

  it('Test 3: withdraw_liquidity enforces caller LP authorization & deposit balance checks', async () => {
    const lpIdentity = '0x9923812739182371982739182739182377281938210482910385918392019482';
    const beforeLiq = protocol.getLedgerState().totalLiquidity;

    // Legitimate withdrawal within LP balance
    await protocol.withdrawLiquidity(lpIdentity, 50000);
    const afterLiq = protocol.getLedgerState().totalLiquidity;
    expect(afterLiq).toBe(beforeLiq - 50000);

    // Over-withdrawal exceeding LP balance must throw
    await expect(
      protocol.withdrawLiquidity(lpIdentity, 999999999)
    ).rejects.toThrow(/exceeds caller LP deposit balance/);

    // Unauthorized withdrawal from address with zero LP balance must throw
    const unauthorizedLp = '0xbad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0bad0';
    await expect(
      protocol.withdrawLiquidity(unauthorizedLp, 1000)
    ).rejects.toThrow(/No active LP deposit found/);
  });

  it('Test 4: disclose_solvency_audit verifies protocol solvency on-chain without exposing borrower data', async () => {
    const audit = await protocol.generateRegulatoryAudit('REG_AUDIT_PREPROD_001');
    expect(audit.isSolvent).toBe(true);
    expect(audit.privacyPreserved).toBe(true);
    expect(audit.proofHash).toContain('0x');
    expect(audit.activeLoanCount).toBeGreaterThan(0);
  });
});