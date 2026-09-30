import React, { useState } from 'react';
import { EyeOff, Cpu, CheckCircle, ArrowRight, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';
import { CreditTier, SignedCredential, TIER_CONFIGS, ZkProofResult } from '../midnight/contractTypes';
import { ZkProofEngine } from '../midnight/zkProofEngine';

interface TierProverProps {
  credential: SignedCredential | null;
  onProofGenerated: (proof: ZkProofResult, tier: CreditTier, amount: number) => void;
  activeProof: ZkProofResult | null;
  onNavigateToMarket: () => void;
}

export const TierProver: React.FC<TierProverProps> = ({
  credential,
  onProofGenerated,
  activeProof,
  onNavigateToMarket
}) => {
  const zkEngine = ZkProofEngine.getInstance();
  const authorizedIssuerPk = '0x8f4c2e1b9a3d7e5f0c2b4a6d8e1f3a5b7c9e0d2f4a6b8c0e2d4f6a8b0c2e4f6';

  const [selectedTier, setSelectedTier] = useState<CreditTier>(CreditTier.TIER_1_PRIME);
  const [requestedAmount, setRequestedAmount] = useState<number>(35000);
  const [isProving, setIsProving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const config = TIER_CONFIGS[selectedTier];

  const handleGenerateProof = async () => {
    if (!credential) {
      setErrorMsg("Please issue or load a credential first from the Credential Issuer tab.");
      return;
    }
    setErrorMsg(null);
    setIsProving(true);

    try {
      const borrowerSecret = 'sec_borrower_' + credential.id;
      const loanSalt = 'salt_' + Date.now();

      const proof = await zkEngine.generateCreditTierProof(
        credential,
        selectedTier,
        requestedAmount,
        Math.round((requestedAmount * config.collateralRatioPct) / 100),
        borrowerSecret,
        loanSalt,
        authorizedIssuerPk
      );

      onProofGenerated(proof, selectedTier, requestedAmount);
    } catch (err: any) {
      setErrorMsg(err.message || "Zero-Knowledge Circuit execution failed.");
    } finally {
      setIsProving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-6">
      
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-3xl font-extrabold text-white">
          Client-Side <span className="zk-gradient-text">Zero-Knowledge Prover</span>
        </h2>
        <p className="text-slate-400 text-sm">
          Generate mathematical cryptographic proofs directly inside your browser. Prove your creditworthiness 
          tier without disclosing your verified income, credit score, or identity to anyone.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[CreditTier.TIER_1_PRIME, CreditTier.TIER_2_STANDARD, CreditTier.TIER_3_ENTRY].map((tier) => {
          const tConfig = TIER_CONFIGS[tier];
          const isSelected = selectedTier === tier;
          return (
            <div
              key={tier}
              onClick={() => {
                setSelectedTier(tier);
                if (requestedAmount > tConfig.maxBorrowLimit) {
                  setRequestedAmount(tConfig.maxBorrowLimit);
                }
              }}
              className={`p-6 rounded-2xl cursor-pointer transition-all duration-200 relative border ${
                isSelected
                  ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-[1.02]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isSelected && (
                <div className="absolute top-4 right-4">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                </div>
              )}

              <div className="text-xs uppercase font-bold tracking-wider text-cyan-400 mb-2">
                {tConfig.name}
              </div>
              <div className="text-sm font-semibold text-slate-200 mb-4">
                {tConfig.badge}
              </div>

              <div className="space-y-2 py-4 border-t border-b border-slate-800 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Borrow Limit:</span>
                  <span className="text-white font-mono font-semibold">${tConfig.maxBorrowLimit.toLocaleString()} tDUST</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Required Collateral:</span>
                  <span className={`font-mono font-bold ${tConfig.collateralRatioPct === 0 ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {tConfig.collateralRatioPct}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Base APR:</span>
                  <span className="text-cyan-300 font-mono font-bold">{tConfig.baseAprPct}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Min Thresholds:</span>
                  <span className="text-slate-300 font-mono">${tConfig.minIncome / 1000}k+ / {tConfig.minCreditScore}+ Score</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-4 leading-relaxed">
                {tConfig.description}
              </p>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 glow-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-indigo-400" />
              <span>Configure Loan Amount & Circuit</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Requested Loan Amount (Max: ${config.maxBorrowLimit.toLocaleString()} tDUST)
              </label>
              <input
                type="range"
                min={1000}
                max={config.maxBorrowLimit}
                step={1000}
                value={requestedAmount}
                onChange={(e) => setRequestedAmount(Number(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between items-center mt-2">
                <span className="font-mono text-2xl font-extrabold text-cyan-300">
                  ${requestedAmount.toLocaleString()} <span className="text-sm font-normal text-slate-400">tDUST</span>
                </span>
                <span className="text-xs text-slate-400">
                  Collateral Required: <strong className="text-white font-mono">{Math.round((requestedAmount * config.collateralRatioPct) / 100).toLocaleString()} tDUST</strong>
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleGenerateProof}
              disabled={isProving}
              className="w-full flex items-center justify-center space-x-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {isProving ? (
                <>
                  <Zap className="w-4 h-4 animate-spin text-cyan-200" />
                  <span>Executing Midnight Compact Circuit...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Generate Zero-Knowledge Proof</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-slate-400">Circuit Name:</span>
              <span className="text-cyan-400 font-semibold">veillend.request_tier_loan</span>
            </div>

            {activeProof ? (
              <>
                <div>
                  <span className="text-slate-500 block">ZK Proof Commitment Hash:</span>
                  <span className="text-emerald-400 break-all text-[11px]">{activeProof.proofHash}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Deterministic Nullifier:</span>
                  <span className="text-indigo-300 break-all text-[11px]">{activeProof.nullifier}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px]">
                  <div>
                    <span className="text-slate-500">Execution Time:</span>
                    <div className="text-white">{activeProof.proofGenerationTimeMs} ms</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <div className="text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>PROVEN</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onNavigateToMarket}
                  className="w-full mt-3 py-2 px-3 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center space-x-2 text-xs font-sans font-medium transition-all"
                >
                  <span>Submit Proof to Lending Market</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="py-10 text-center text-slate-500 space-y-2">
                <EyeOff className="w-8 h-8 mx-auto text-slate-700" />
                <p>Waiting for proof generation...</p>
                <p className="text-[10px] text-slate-600">Zero sensitive values will be exposed in proof artifacts.</p>
              </div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
};