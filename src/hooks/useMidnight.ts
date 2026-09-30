import { useState, useEffect, useCallback } from 'react';
import { MidnightDAppConnector, MidnightAccount } from '../midnight/dappConnector';
import { is1AMInstalled, PREPROD_NETWORK_ID } from '../midnight/midnight1am';

export interface UseMidnightState {
  isConnected: boolean;
  isConnecting: boolean;
  account: MidnightAccount | null;
  address: string | null;
  networkId: string;
  balance: number;
  error: string | null;
  connect: () => Promise<MidnightAccount>;
  disconnect: () => void;
}

export function useMidnight(): UseMidnightState {
  const [account, setAccount] = useState<MidnightAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const connector = MidnightDAppConnector.getInstance();

  useEffect(() => {
    const existing = connector.getAccount();
    if (existing) {
      setAccount(existing);
    }
  }, [connector]);

  const connect = useCallback(async (): Promise<MidnightAccount> => {
    setIsConnecting(true);
    setError(null);
    try {
      const isInstalled = is1AMInstalled();
      if (!isInstalled && typeof window !== 'undefined' && !(window as any).midnight?.mnLace) {
        throw new Error('No Midnight wallet detected. Please install the 1AM or Midnight Lace browser extension.');
      }

      const acc = await connector.connect();
      setAccount(acc);
      return acc;
    } catch (err: any) {
      const msg = err?.message || 'Failed to connect Midnight wallet. User may have rejected the request.';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsConnecting(false);
    }
  }, [connector]);

  const disconnect = useCallback(() => {
    connector.disconnect();
    setAccount(null);
    setError(null);
  }, [connector]);

  return {
    isConnected: !!account,
    isConnecting,
    account,
    address: account?.address || null,
    networkId: account?.networkId || PREPROD_NETWORK_ID,
    balance: account?.balanceTdust || 0,
    error,
    connect,
    disconnect
  };
}
