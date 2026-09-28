import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { PublicLedgerState } from '../midnight/contractTypes';
import { VeilLendProtocol } from '../midnight/veillendSimulator';

interface LiquidityPoolProps {
  ledger: PublicLedgerState;
  onLedgerUpdate: (newLedger: PublicLedgerState) => void;
}

export const LiquidityPool: React.FC<LiquidityPoolProps> = ({ ledger, onLedgerUpdate }) => {
  const protocol = VeilLendProtocol.getInstance();
  const [depositAmount, setDepositAmount] = useState<number>(25000);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleDeposit = async () => {
    setIsProcessing(true);
    try {
      await protocol.depositLiquidity(depositAmount);
      onLedgerUpdate(protocol.getLedgerState());
    } finally {
      setIsProcessing(false);
    }
  };

  const utilizationRate = Math.round((ledger.totalBorrowed / (ledger.totalLiquidity + ledger.totalBorrowed)) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl glow-card-emerald">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">Midnight Confidential Liquidity</span>
            <h2 className="text-2xl font-bold text-white">tDUST Lending Pool</h2>
            <p className="text-xs text-slate-400">
              Provide capital to undercollateralized ZK credit pools and earn yield funded by risk-adjusted borrower APRs.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Current LP APY</span>
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">5.42%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 block">Available Liquidity</span>
          <span className="text-xl font-bold font-mono text-cyan-300"> tDUST</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 block">Active Borrowed</span>
          <span className="text-xl font-bold font-mono text-indigo-400"> tDUST</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl">
          <span className="text-xs text-slate-400 block">Pool Utilization</span>
          <span className="text-xl font-bold font-mono text-white">{utilizationRate}%</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center space-x-2">
          <Coins className="w-5 h-5 text-emerald-400" />
          <span>Deposit Liquidity</span>
        </h3>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">Deposit Amount (tDUST)</label>
          <div className="flex space-x-3">
            <input
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleDeposit}
              disabled={isProcessing}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all disabled:opacity-50"
            >
              Deposit Funds
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};