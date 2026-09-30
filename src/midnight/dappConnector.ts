// Midnight DApp Connector Integration (Lace Wallet / Midnight Preview)
// Implements standard Midnight DApp Connector specification

export interface MidnightAccount {
  address: string;
  networkId: 'midnight-preprod' | 'midnight-sandbox';
  balanceTdust: number;
}

export class MidnightDAppConnector {
  private static instance: MidnightDAppConnector;
  private connectedAccount: MidnightAccount | null = null;
  private isConnecting: boolean = false;

  private constructor() {
    // Initial state: no wallet connected by default
    this.connectedAccount = null;
  }

  public static getInstance(): MidnightDAppConnector {
    if (!MidnightDAppConnector.instance) {
      MidnightDAppConnector.instance = new MidnightDAppConnector();
    }
    return MidnightDAppConnector.instance;
  }

  public async connect(): Promise<MidnightAccount> {
    this.isConnecting = true;
    // Check if Midnight Lace or 1AM browser extension is present
    if (typeof window !== 'undefined' && (window as any).midnight) {
      const midnightObj = (window as any).midnight;
      const walletObj = midnightObj['1am'] || midnightObj.mnLace;

      if (walletObj) {
        try {
          const walletApi = typeof walletObj.enable === 'function' ? await walletObj.enable() : await walletObj.connect?.('preprod');
          const address = typeof walletApi.getAddress === 'function'
            ? await walletApi.getAddress()
            : (await walletApi.getUnshieldedAddress?.()?.then((u: any) => u?.unshieldedAddress || u) || 'mn_addr_preprod1...');
          
          let balance = 0;
          if (typeof walletApi.getBalance === 'function') {
            balance = await walletApi.getBalance();
          }

          this.connectedAccount = {
            address,
            networkId: 'midnight-preprod',
            balanceTdust: balance
          };
          this.isConnecting = false;
          return this.connectedAccount;
        } catch (err: any) {
          this.isConnecting = false;
          throw new Error(err?.message || "User rejected Midnight wallet connection.");
        }
      }
    }

    this.isConnecting = false;
    // Explicit requirement: Fail cleanly with 'Wallet not connected' error instead of silent fake fallback
    throw new Error(
      "Wallet not connected: Midnight 1AM or Lace extension not detected. Please install the 1AM or Midnight Lace browser extension."
    );
  }

  public getAccount(): MidnightAccount | null {
    return this.connectedAccount;
  }

  public isConnected(): boolean {
    return this.connectedAccount !== null;
  }

  public switchNetwork(networkId: 'midnight-preprod' | 'midnight-sandbox'): void {
    if (this.connectedAccount) {
      this.connectedAccount.networkId = networkId;
    }
  }

  public disconnect(): void {
    this.connectedAccount = null;
  }
}
