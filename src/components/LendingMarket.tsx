import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { CreditTier, LoanRecord, PublicLedgerState, TIER_CONFIGS, ZkProofResult } from '../midnight/contractTypes';
import { VeilLendProtocol } from '../midnight/veillendSimulator';

interface LendingMarketProps {
  ledger: PublicLedgerState;
  activeProof: ZkProofResult | null;
  selectedTier: CreditTier;
  requestedAmount: number;
  onLoanOriginated: (loan: LoanRecord) => void;
  onNavigateToLoans: () => void;
}

export const LendingMarket: React.FC<LendingMarketProps> = ({
  ledger,
  activeProof,
  selectedTier,
  requestedAmount,
  onLoanOriginated,
  onNavigateToLoans
}) => {
  const protocol = VeilLendProtocol.getInstance();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successLoan, setSuccessLoan] = useState<LoanRecord | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const config = TIER_CONFIGS[selectedTier];
  const requiredCollateral = Math.round((requestedAmount * config.collateralRatioPct) / 100);

  const handleSubmitLoan = async () => {
    if (!activeProof) {
      setErrorMsg("Please generate a valid ZK credit proof in the ZK Prover tab first.");
      return;
    }
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const borrowerAddress = 'mn_addr_preprod1q9v8k74z8g2f6w30pxc5y7h0d1a4j8k3x2m9n1';
      const newLoan = await protocol.submitLoanRequestWithProof(
        activeProof,
        borrowerAddress,
        selectedTier,
        requestedAmount
      );

      setSuccessLoan(newLoan);
      onLoanOriginated(newLoan);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to execute transaction on Midnight ledger.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Total Pool Liquidity</span>
          <span className="text-xl font-bold font-mono text-cyan-300">
            ${ledger.totalLiquidity.toLocaleString()} <span className="text-xs font-normal text-slate-400">tDUST</span>
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Active Borrowed</span>
          <span className="text-xl font-bold font-mono text-indigo-300">
            ${ledger.totalBorrowed.toLocaleString()} <span className="text-xs font-normal text-slate-400">tDUST</span>
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Active Borrowers</span>
          <span className="text-xl font-bold font-mono text-white">
            {ledger.activeBorrowersCount} <span className="text-xs font-normal text-slate-400">anonymized</span>
          </span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <span className="text-xs text-slate-400 block">Protocol Solvency</span>
          <span className="text-xl font-bold font-mono text-emerald-400">
            100% Solvent
          </span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 glow-card">
        <div className="max-w-2xl mx-auto space-y-6">
          
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-bold text-white">Originate Confidential Loan</h3>
            <p className="text-xs text-slate-400">
              Submit your local ZK proof to the Midnight smart contract to receive instant uncollateralized or low-collateral liquidity.
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-sm text-slate-400">Verified Credit Tier:</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {config.name}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Borrow Principal:</span>
              <span className="text-lg font-mono font-bold text-white">${requestedAmount.toLocaleString()} tDUST</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Required Collateral:</span>
              <span className={`text-lg font-mono font-bold ${requiredCollateral === 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                ${requiredCollateral.toLocaleString()} tDUST ({config.collateralRatioPct}%)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Fixed APR:</span>
              <span className="text-lg font-mono font-bold text-indigo-400">{config.baseAprPct}%</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Loan Term:</span>
              <span className="text-sm font-mono text-slate-300">30 Days</span>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">ZK Proof Status:</span>
              {activeProof ? (
                <span className="text-emerald-400 font-semibold flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valid Proof Attached</span>
                </span>
              ) : (
                <span className="text-amber-400 font-semibold flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>No Proof Attached</span>
                </span>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {successLoan ? (
            <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-lg font-bold text-white">Loan Successfully Originated!</h4>
              <p className="text-xs text-slate-300">
                ${successLoan.principalAmount.toLocaleString()} tDUST disbursed to your Midnight address. No financial attributes were leaked!
              </p>
              <div className="font-mono text-[11px] text-slate-400 break-all">
                TX: {successLoan.txHash}
              </div>
              <button
                onClick={onNavigateToLoans}
                className="mt-2 inline-flex items-center space-x-2 py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all"
              >
                <span>View in Active Loans</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSubmitLoan}
              disabled={isSubmitting || !activeProof}
              className="w-full flex items-center justify-center space-x-2 py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-500/25 disabled:opacity-40"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Executing On-Chain Proof Verification...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Disburse Loan on Midnight Preprod</span>
                </>
              )}
            </button>
          )}

        </div>
      </div>

    </div>
  );
};