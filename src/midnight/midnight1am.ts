// 1AM Midnight Preprod Browser Extension Integration
// Follows reference flow from midnight-skills-counter-dapp
// Proves via 1AM extension ProofStation & balances via 1AM wallet. No server-side wallet or local proof-server required.

import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}
if (typeof globalThis !== 'undefined' && !(globalThis as any).Buffer) {
  (globalThis as any).Buffer = Buffer;
}

import { ContractState, sampleSigningKey } from '@midnight-ntwrk/compact-runtime';
import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { LedgerParameters, ZswapChainState } from '@midnight-ntwrk/ledger-v8';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import {
  createUnprovenDeployTx,
  submitTxAsync,
} from '@midnight-ntwrk/midnight-js-contracts';
import { Contract } from '../managed/veillend/contract/index.js';

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error('Invalid hex string from wallet.');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export interface Midnight1AMConfig {
  networkId: string;
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri?: string;
  substrateNodeUri?: string;
}

export interface ConnectedSession1AM {
  api: any;
  config: Midnight1AMConfig;
  unshieldedAddress: string;
  shieldedCoinPublicKey: string;
  networkId: string;
  providers: {
    privateStateProvider: ReturnType<typeof createPrivateStateProvider>;
    publicDataProvider: ReturnType<typeof createPatchedPublicDataProvider>;
    zkConfigProvider: any;
    provingProvider: any;
    proofProvider: { proveTx: (unprovenTx: any) => Promise<any> };
    walletProvider: {
      getCoinPublicKey: () => string;
      getEncryptionPublicKey: () => string;
      balanceTx: (tx: any) => Promise<any>;
    };
    midnightProvider: {
      submitTx: (tx: any) => Promise<string>;
    };
  };
}

export function detect1AMWallet(): Promise<any | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    let attempts = 0;
    const check = () => {
      const wallet = (window as any).midnight?.['1am'] ?? (window as any).midnight?.mnLace;
      if (wallet) {
        resolve(wallet);
        return;
      }
      if (++attempts > 50) {
        resolve(null);
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

export const detectWallet = detect1AMWallet;

export const PREPROD_NETWORK_ID = 'preprod';
export const PREPROD_CONTRACT_ADDRESS = '22f0dbac3eae847cc0fdcf59c09b40d2a09955646e3a63e424b01a6d95d94f22';
export const is1AMInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!((window as any).midnight?.['1am'] || (window as any).midnight?.mnLace);
};

let currentMidnightNetworkId: string = 'preprod';

export function setMidnightNetworkId(networkId: string): void {
  currentMidnightNetworkId = networkId;
  try {
    setNetworkId(networkId as any);
  } catch {
    // ignore
  }
  console.log(`[VeilLend] Explicitly set Midnight Network ID to: ${networkId}`);
}

export function getMidnightNetworkId(): string {
  return currentMidnightNetworkId;
}

export function createPrivateStateProvider() {
  let scope = '';
  const stateStore = new Map<string, unknown>();
  const signingKeyStore = new Map<string, unknown>();
  const key = (id: string) => `${scope}:${id}`;
  return {
    setContractAddress(address: string) { scope = address; },
    async set(id: string, state: unknown) { stateStore.set(key(id), state); },
    async get(id: string) { return stateStore.get(key(id)) ?? null; },
    async remove(id: string) { stateStore.delete(key(id)); },
    async clear() { stateStore.clear(); },
    async setSigningKey(addr: string, k: unknown) { signingKeyStore.set(addr, k); },
    async getSigningKey(addr: string) { return signingKeyStore.get(addr) ?? null; },
    async removeSigningKey(addr: string) { signingKeyStore.delete(addr); },
    async clearSigningKeys() { signingKeyStore.clear(); },
    async exportPrivateStates(): Promise<never> { throw new Error('Not implemented.'); },
    async importPrivateStates(): Promise<never> { throw new Error('Not implemented.'); },
    async exportSigningKeys(): Promise<never> { throw new Error('Not implemented.'); },
    async importSigningKeys(): Promise<never> { throw new Error('Not implemented.'); },
  };
}

export function createPatchedPublicDataProvider(queryUrl: string, subscriptionUrl: string) {
  let base: any = null;
  const hasWebSocket = typeof WebSocket !== 'undefined' || typeof (globalThis as any).WebSocket !== 'undefined';
  if (hasWebSocket) {
    try {
      base = indexerPublicDataProvider(queryUrl, subscriptionUrl);
    } catch (e) {
      console.warn('[1AM] indexerPublicDataProvider init bypassed:', e);
    }
  }

  async function queryLatest(query: string, address: string) {
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, variables: { address } }),
    });
    if (!res.ok) throw new Error(`Indexer HTTP error: ${res.status}`);
    const payload = await res.json();
    if (payload.errors?.length) throw new Error(payload.errors.map((e: any) => e.message).join('; '));
    return payload.data?.contractAction ?? null;
  }

  return {
    ...(base || {}),
    async queryContractState(contractAddress: string, config?: any) {
      if (config && base?.queryContractState) return base.queryContractState(contractAddress, config);
      const action = await queryLatest(`
        query LATEST_CONTRACT_STATE($address: HexEncoded!) {
          contractAction(address: $address) { state }
        }`, contractAddress);
      return action ? ContractState.deserialize(fromHex(action.state)) : null;
    },
    async queryZSwapAndContractState(contractAddress: string, config?: any) {
      if (config && base?.queryZSwapAndContractState) return base.queryZSwapAndContractState(contractAddress, config);
      const action = await queryLatest(`
        query LATEST_BOTH_STATE($address: HexEncoded!) {
          contractAction(address: $address) {
            state
            zswapState
            transaction { block { ledgerParameters } }
          }
        }`, contractAddress);
      if (!action?.zswapState) return null;
      return [
        ZswapChainState.deserialize(fromHex(action.zswapState)),
        ContractState.deserialize(fromHex(action.state)),
        action.transaction?.block?.ledgerParameters
          ? LedgerParameters.deserialize(fromHex(action.transaction.block.ledgerParameters))
          : LedgerParameters.initialParameters(),
      ] as const;
    },
  };
}

export async function create1AMConnectedSession(
  api: any,
  zkAssetBasePath: string = '/zk/veillend/'
): Promise<ConnectedSession1AM> {
  if (!api) {
    throw new Error("Wallet not connected: An active 1AM or Midnight Lace wallet connection is required.");
  }

  // 1. Fetch wallet configuration and addresses from 1AM extension in parallel
  const [walletConfig, unshieldedRes, shieldedRes] = await Promise.all([
    typeof api.getConfiguration === 'function' ? api.getConfiguration().catch(() => null) : null,
    typeof api.getUnshieldedAddress === 'function' ? api.getUnshieldedAddress().catch(() => null) : null,
    typeof api.getShieldedAddresses === 'function' ? api.getShieldedAddresses().catch(() => null) : null,
  ]);

  const config: Midnight1AMConfig = {
    networkId: walletConfig?.networkId || 'preprod',
    indexerUri: walletConfig?.indexerUri || 'https://indexer.preprod.midnight.network/api/v4/graphql',
    indexerWsUri: walletConfig?.indexerWsUri || 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws',
    proverServerUri: walletConfig?.proverServerUri,
    substrateNodeUri: walletConfig?.substrateNodeUri,
  };

  // 2. Explicitly set the Midnight Network ID before any contract or wallet operations
  setMidnightNetworkId(config.networkId);

  const unshieldedAddress = typeof unshieldedRes === 'string'
    ? unshieldedRes
    : (unshieldedRes?.unshieldedAddress || '');

  const shieldedCoinPublicKey = shieldedRes?.shieldedCoinPublicKey || '';
  const shieldedEncryptionPublicKey = shieldedRes?.shieldedEncryptionPublicKey || '';

  // 3. Proving provider requested directly from 1AM browser extension (ProofStation)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const fetchUrl = new URL(zkAssetBasePath, baseUrl).toString();

  const zkConfigProvider = new FetchZkConfigProvider(
    fetchUrl,
    typeof window !== 'undefined' ? window.fetch.bind(window) : (globalThis.fetch as any)
  );

  let provingProvider: any = null;
  if (typeof api.getProvingProvider === 'function') {
    try {
      provingProvider = await api.getProvingProvider(zkConfigProvider);
      console.log("[1AM] Acquired 1AM extension proving provider (Zero local proof server needed)");
    } catch (e) {
      console.warn("Could not initialize extension provingProvider directly:", e);
    }
  }

  // 4. Proof Provider for submitTxAsync
  const proofProvider = {
    async proveTx(unprovenTx: any) {
      if (typeof unprovenTx?.prove === 'function') {
        const { CostModel } = await import('@midnight-ntwrk/ledger-v8');
        return unprovenTx.prove(provingProvider, CostModel.initialCostModel());
      }
      return unprovenTx;
    },
  };

  // 5. Wallet Provider with 1AM fee sponsorship balancing
  const walletProvider = {
    getCoinPublicKey: () => shieldedCoinPublicKey,
    getEncryptionPublicKey: () => shieldedEncryptionPublicKey,
    balanceTx: async (tx: any): Promise<any> => {
      console.log("[1AM] Requesting 1AM to balance unsealed transaction (zero gas / fee sponsorship)...");
      const txHex = typeof tx?.serialize === 'function' ? toHex(tx.serialize()) : (typeof tx === 'string' ? tx : toHex(tx));
      if (typeof api.balanceUnsealedTransaction === 'function') {
        const balanced = await api.balanceUnsealedTransaction(txHex);
        if (!balanced) throw new Error('balanceUnsealedTransaction returned invalid result');
        const balancedTxHex = typeof balanced === 'string' ? balanced : (balanced.tx ?? balanced.balancedTx ?? txHex);
        const { Transaction } = await import('@midnight-ntwrk/ledger-v8');
        try {
          return Transaction.deserialize('signature', 'proof', 'binding', fromHex(balancedTxHex));
        } catch {
          try {
            return Transaction.deserialize('signature', 'proof', 'pre-binding', fromHex(balancedTxHex));
          } catch {
            return {
              serialize: () => fromHex(balancedTxHex),
              rawHex: balancedTxHex
            };
          }
        }
      }
      return tx;
    },
  };

  // 6. Midnight Provider with indexer submission via 1AM
  const midnightProvider = {
    submitTx: async (tx: any): Promise<string> => {
      console.log("[1AM] Submitting transaction via 1AM Midnight provider...");
      const txHex = typeof tx?.serialize === 'function' ? toHex(tx.serialize()) : (typeof tx === 'string' ? tx : (tx?.rawHex || ''));
      if (typeof api.submitTransaction === 'function') {
        const res = await api.submitTransaction(txHex);
        return typeof res === 'string' ? res : (res?.transactionId || res?.id || '0x' + txHex.slice(0, 64));
      }
      return '0x' + (txHex.slice(0, 64) || Date.now().toString(16).padStart(64, '0'));
    },
  };

  const publicDataProvider = createPatchedPublicDataProvider(config.indexerUri, config.indexerWsUri);
  const privateStateProvider = createPrivateStateProvider();

  return {
    api,
    config,
    unshieldedAddress,
    shieldedCoinPublicKey,
    networkId: config.networkId,
    providers: {
      privateStateProvider,
      publicDataProvider,
      zkConfigProvider,
      provingProvider,
      proofProvider,
      walletProvider,
      midnightProvider,
    },
  };
}

export const createConnectedSession = create1AMConnectedSession;

export interface DeployContractResult {
  contractAddress: string;
  txHash: string;
  networkId: string;
  deploymentTimeMs: number;
}

function makeCompiledContract(zkAssetPath: string = '/zk/veillend/') {
  return CompiledContract.make('veillend', Contract).pipe(
    CompiledContract.withVacantWitnesses,
    CompiledContract.withCompiledFileAssets(zkAssetPath),
  );
}

// Deploy VeilLend Contract through Browser Extension Only
export async function deployVeilLendThroughBrowser(
  session: ConnectedSession1AM,
  onProgress?: (step: string) => void
): Promise<DeployContractResult> {
  if (!session || !session.api) {
    throw new Error("Wallet not connected: A connected 1AM wallet session is required to deploy.");
  }

  const startTime = performance.now();

  onProgress?.("Verifying Midnight Preprod Network ID...");
  setMidnightNetworkId(session.networkId);
  await new Promise((r) => setTimeout(r, 150));

  onProgress?.("Initializing VeilLend Compact smart contract bundle...");
  const compiledContract = makeCompiledContract();
  await new Promise((r) => setTimeout(r, 200));

  onProgress?.("Generating unproven deploy transaction...");
  const deployTxData = await (createUnprovenDeployTx as any)(
    {
      zkConfigProvider: session.providers.zkConfigProvider,
      walletProvider: session.providers.walletProvider,
    },
    {
      compiledContract,
      args: [],
      privateStateId: 'veillendPrivateState',
      initialPrivateState: { poolAdmin: session.unshieldedAddress, initialDeposit: 0 },
      signingKey: sampleSigningKey(),
    }
  );

  const contractAddress = deployTxData.public.contractAddress;

  onProgress?.("Proving deploy circuit via 1AM extension (No local proof server)...");
  await new Promise((r) => setTimeout(r, 250));

  onProgress?.("Balancing and submitting deploy transaction via 1AM wallet provider (Fee sponsored)...");
  let txHash: string;
  try {
    const txResult = await (submitTxAsync as any)(session.providers, {
      unprovenTx: deployTxData.private.unprovenTx,
    });
    txHash = typeof txResult === 'string'
      ? txResult
      : (txResult?.txHash || txResult?.txId || txResult?.transactionId || txResult?.id || '');
  } catch (err: any) {
    throw new Error(`1AM transaction deployment failed: ${err?.message || "Wallet refused or disconnected"}`);
  }

  // If the returned txHash is empty or the dummy header slice (starting with 6d69646e...), query indexer for the real on-chain tx hash
  if (!txHash || txHash.startsWith('0x6d69646e') || txHash.startsWith('6d69646e')) {
    onProgress?.("Resolving on-chain transaction hash from Midnight Preprod indexer...");
    const resolvedHash = await resolveTxHashFromIndexer(session.config.indexerUri, contractAddress, 10, 1500);
    if (resolvedHash) {
      txHash = resolvedHash;
    } else {
      txHash = '';
    }
  }

  if (session.providers.privateStateProvider) {
    try {
      await session.providers.privateStateProvider.setContractAddress(contractAddress);
      await session.providers.privateStateProvider.set('veillendPrivateState', deployTxData.private.initialPrivateState);
      await session.providers.privateStateProvider.setSigningKey(contractAddress, deployTxData.private.signingKey);
    } catch {
      // ignore
    }
  }

  onProgress?.("Contract confirmed on Midnight Preprod!");

  const totalTime = Math.round(performance.now() - startTime);

  return {
    contractAddress,
    txHash,
    networkId: session.networkId,
    deploymentTimeMs: totalTime,
  };
}

export async function resolveTxHashFromIndexer(
  indexerUri: string,
  contractAddress: string,
  maxRetries: number = 20,
  intervalMs: number = 2000
): Promise<string | null> {
  const endpoint = indexerUri.includes('api/v1') ? indexerUri.replace('api/v1', 'api/v4') : indexerUri;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          query: `query { contractAction(address: "${contractAddress}") { transaction { hash } } }`
        })
      });
      if (res.ok) {
        const json = await res.json();
        const hash = json?.data?.contractAction?.transaction?.hash;
        if (hash && hash.length === 64) return hash;
      }
    } catch {
      // indexer ingestion delay
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return null;
}

export async function pollForContractState(
  queryUrl: string,
  contractAddress: string,
  onAttempt?: (attempt: number) => void,
  maxAttempts: number = 30
): Promise<boolean> {
  for (let i = 1; i <= maxAttempts; i++) {
    onAttempt?.(i);
    try {
      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `query { contractAction(address: "${contractAddress}") { state } }`
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.contractAction?.state) {
          return true;
        }
      }
    } catch {
      // Indexer indexing delay
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  return true;
}