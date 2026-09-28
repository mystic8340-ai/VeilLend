import React, { useState } from 'react';
import { CreditCard, Clock, ArrowUpRight, RefreshCw } from 'lucide-react';
import { LoanRecord, TIER_CONFIGS } from '../midnight/contractTypes';
import { VeilLendProtocol } from '../midnight/veillendSimulator';

interface ActiveLoansProps {
  loans: LoanRecord[];
  onLoanRepaid: (loan: LoanRecord) => void;
}

export const ActiveLoans: React.FC<ActiveLoansProps> = ({ loans, onLoanRepaid }) => {
  const protocol = VeilLendProtocol.getInstance();
  const [repayingId, setRepayingId] = useState<string | null>(null);

  const handleRepay = async (loanId: string) => {
    setRepayingId(loanId);
    try {
      const settled = await protocol.repayLoan(loanId);
      onLoanRepaid(settled);
    } catch (err: any) {
      alert(err.message || "Failed to settle loan.");
    } finally {
      setRepayingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6">
      
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Your Loan Portfolio</h2>
          <p className="text-xs text-slate-400">
            Track active obligations and execute single-click settlements via the <code className="text-cyan-400">veillend.repay_loan</code> Compact circuit.
          </p>
        </div>
      </div>

      {loans.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
          <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No loans active in your portfolio.</p>
          <p className="text-xs text-slate-500 mt-1">Originate a private loan via the ZK Credit Prover to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loans.map((loan) => {
            const config = TIER_CONFIGS[loan.tier];
            const interest = Math.round((loan.principalAmount * (loan.interestApr / 100)) * (30 / 365));
            const totalDue = loan.principalAmount + interest;

            return (
              <div
                key={loan.id}
                className={`p-6 rounded-2xl border transition-all ${
                  loan.isRepaid
                    ? 'bg-slate-900/40 border-slate-800 opacity-70'
                    : 'bg-slate-900/90 border-slate-800 glow-card'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-xs font-mono text-slate-500 uppercase">{loan.id}</span>
                    <h3 className="text-lg font-bold text-white mt-0.5">{config.name}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                      loan.isRepaid
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {loan.isRepaid ? 'SETTLED' : 'ACTIVE'}
                  </span>
                </div>

                <div className="space-y-2 py-4 border-t border-b border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Principal Disbursed:</span>
                    <span className="text-white font-mono font-semibold">${loan.principalAmount.toLocaleString()} tDUST</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Collateral Locked:</span>
                    <span className="text-white font-mono font-semibold">
                      ${loan.collateralDeposited.toLocaleString()} tDUST ({loan.collateralDeposited === 0 ? '0% Uncollateralized' : 'Low Collateral'})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Fixed APR:</span>
                    <span className="text-indigo-400 font-mono font-bold">{loan.interestApr}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Total Due:</span>
                    <span className="text-cyan-300 font-mono font-bold">${totalDue.toLocaleString()} tDUST</span>
                  </div>
                  <div className="pt-2 text-[10px] text-slate-500 font-mono break-all">
                    Nullifier: {loan.nullifier.slice(0, 24)}...
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>30-day term</span>
                  </span>

                  {!loan.isRepaid && (
                    <button
                      onClick={() => handleRepay(loan.id)}
                      disabled={repayingId === loan.id}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all"
                    >
                      {repayingId === loan.id ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Settling...</span>
                        </>
                      ) : (
                        <>
                          <span>Repay ${totalDue.toLocaleString()}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};