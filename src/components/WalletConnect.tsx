import React from 'react';
import { Wallet, LogOut, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useMidnight } from '../hooks/useMidnight';

interface WalletConnectProps {
  onAccountChange?: (address: string | null) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onAccountChange }) => {
  const { isConnected, isConnecting, address, networkId, balance, error, connect, disconnect } = useMidnight();

  const handleConnect = async () => {
    try {
      const acc = await connect();
      if (onAccountChange) onAccountChange(acc.address);
    } catch (e) {
      // Error handled in hook state
    }
  };

  const handleDisconnect = () => {
    disconnect();
    if (onAccountChange) onAccountChange(null);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Midnight Wallet Session</h3>
            <p className="text-xs text-slate-400">1AM & Midnight Lace DApp Connector</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 text-xs rounded-full font-mono font-medium flex items-center space-x-1.5 ${
          isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start space-x-2.5 text-xs text-red-300">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {isConnected && address ? (
        <div className="space-y-4">
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/80 font-mono text-xs space-y-2">
            <div className="flex justify-between items-center text-slate-400">
              <span>Network:</span>
              <span className="text-cyan-400 font-semibold">{networkId}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Address:</span>
              <span className="text-white font-semibold">{address.slice(0, 14)}...{address.slice(-8)}</span>
            </div>
            <div className="flex justify-between items-center text-slate-400">
              <span>Testnet DUST:</span>
              <span className="text-emerald-400 font-semibold">{balance.toLocaleString()} tDUST</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDisconnect}
              className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition border border-slate-700"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
              <span>Disconnect Wallet</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Connect your 1AM or Midnight Lace extension to interact with confidential lending pools, originate uncollateralized loans, and generate zero-knowledge proofs.
          </p>

          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Wallet className="w-4 h-4" />
            <span>{isConnecting ? 'Connecting to 1AM / Lace...' : 'Connect Midnight Wallet'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
