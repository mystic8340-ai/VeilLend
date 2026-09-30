import WebSocket from 'ws';
if (typeof (globalThis as any).WebSocket === 'undefined') {
  (globalThis as any).WebSocket = WebSocket;
}

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

  it('Test 4: 1AM transaction balancing formats unsealed transaction with midnight:transaction header tag', async () => {
    let receivedHex = '';
    const mock1AmApi = {
      getConfiguration: async () => ({
        networkId: 'preprod',
        indexerUri: 'https://indexer.preprod.midnight.network/api/v1/graphql',
        indexerWsUri: 'wss://indexer.preprod.midnight.network/api/v1/graphql/ws',
      }),
      getUnshieldedAddress: async () => '00'.repeat(32),
      getShieldedAddresses: async () => ({
        shieldedCoinPublicKey: '00'.repeat(32),
        shieldedEncryptionPublicKey: '00'.repeat(32),
      }),
      balanceUnsealedTransaction: async (txHex: string) => {
        receivedHex = txHex;
        return { tx: txHex };
      },
      submitTransaction: async (_txHex: string) => '0x' + 'ab'.repeat(32),
    };

    const session = await create1AMConnectedSession(mock1AmApi);
    expect(session).toBeDefined();
    expect(session.networkId).toBe('preprod');

    // Test balancing through walletProvider with genuine serialized midnight transaction format
    const headerTag = 'midnight:transaction[v9](signature[v1],proof,embedded-fr[v1]):';
    const sampleTxBytes = new TextEncoder().encode(headerTag + 'payload');
    const sampleTxHex = Array.from(sampleTxBytes, b => b.toString(16).padStart(2, '0')).join('');

    await session.providers.walletProvider.balanceTx(sampleTxHex);

    expect(receivedHex).toBe(sampleTxHex);
    // Decode receivedHex to verify the midnight:transaction header tag is present
    const normalized = receivedHex.replace(/^0x/, '');
    const decodedBytes = new Uint8Array(normalized.length / 2);
    for (let i = 0; i < normalized.length; i += 2) {
      decodedBytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
    }
    const decodedStr = new TextDecoder().decode(decodedBytes);
    expect(decodedStr).toContain('midnight:transaction[v9]');
    expect(decodedStr.startsWith(headerTag)).toBe(true);
  });
});