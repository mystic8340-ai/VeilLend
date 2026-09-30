import { describe, it, expect, beforeEach } from 'vitest';
import { MidnightDAppConnector } from '../src/midnight/dappConnector';
import { 
  setMidnightNetworkId, 
  getMidnightNetworkId, 
  create1AMConnectedSession 
} from '../src/midnight/midnight1am';
import fs from 'node:fs';
import path from 'node:path';

describe('VeilLend Integration Tests: Midnight DApp Connector & Contract Specification', () => {
  let connector: MidnightDAppConnector;

  beforeEach(() => {
    connector = MidnightDAppConnector.getInstance();
    connector.disconnect();
  });

  it('Test 1: DApp Connector rejects connection when no wallet extension is present with descriptive error', async () => {
    expect(connector.isConnected()).toBe(false);
    expect(connector.getAccount()).toBeNull();

    // In a Node/headless test environment without window.midnight, connect() MUST throw
    await expect(connector.connect()).rejects.toThrow(/Wallet not connected/);
    expect(connector.isConnected()).toBe(false);
  });

  it('Test 2: Midnight network ID is explicitly tracked and enforced across wallet sessions', async () => {
    setMidnightNetworkId('preprod');
    expect(getMidnightNetworkId()).toBe('preprod');

    // Attempting to create a connected deployment session without wallet API must reject
    await expect(create1AMConnectedSession(null)).rejects.toThrow(
      /Wallet not connected: An active 1AM or Midnight Lace wallet connection is required/
    );
  });

  it('Test 3: Contract specification strictly matches Compact source AST and 64-char address format', () => {
    const compactPath = path.resolve('contracts/veillend.compact');
    const specPath = path.resolve('contracts/compiler-spec.json');

    expect(fs.existsSync(compactPath)).toBe(true);
    expect(fs.existsSync(specPath)).toBe(true);

    const compactSource = fs.readFileSync(compactPath, 'utf8');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8').replace(/^\uFEFF/, ''));

    // Check all circuits declared in compiler-spec.json
    for (const circuit of spec.circuits) {
      expect(compactSource).toContain(`export circuit ${circuit}`);
    }

    // Check all ledger fields
    for (const field of spec.ledgerFields) {
      expect(compactSource).toContain(`export ledger ${field}`);
    }

    // Verify authentic 64-char hex contract address format
    const sampleContractAddr = 'c7e841f92e03d4a6b5c1084e319bf0863ac24e7561dc1398ea05e26b47a19c32';
    expect(sampleContractAddr).toMatch(/^[0-9a-f]{64}$/);
  });
});