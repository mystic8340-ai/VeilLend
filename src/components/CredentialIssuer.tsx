import React, { useState } from 'react';
import { Award, CheckCircle2, Key, Building2, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { ZkProofEngine } from '../midnight/zkProofEngine';
import { FinancialAttributes, SignedCredential } from '../midnight/contractTypes';

interface CredentialIssuerProps {
  onCredentialIssued: (cred: SignedCredential) => void;
  activeCredential: SignedCredential | null;
}

export const CredentialIssuer: React.FC<CredentialIssuerProps> = ({
  onCredentialIssued,
  activeCredential
}) => {
  const zkEngine = ZkProofEngine.getInstance();
  const issuerPk = '0x8f4c2e1b9a3d7e5f0c2b4a6d8e1f3a5b7c9e0d2f4a6b8c0e2d4f6a8b0c2e4f6';

  const [institutionName, setInstitutionName] = useState('Apex Institutional Verifier & Bank');
  const [income, setIncome] = useState<number>(140000);
  const [creditScore, setCreditScore] = useState<number>(780);
  const [repaidLoans, setRepaidLoans] = useState<number>(6);
  const [dti, setDti] = useState<number>(18);
  const [isIssuing, setIsIssuing] = useState(false);

  const applyPreset = (preset: 'prime' | 'standard' | 'entry') => {
    if (preset === 'prime') {
      setIncome(145000);
      setCreditScore(790);
      setRepaidLoans(7);
      setDti(15);
    } else if (preset === 'standard') {
      setIncome(78000);
      setCreditScore(715);
      setRepaidLoans(3);
      setDti(28);
    } else {
      setIncome(42000);
      setCreditScore(630);
      setRepaidLoans(1);
      setDti(42);
    }
  };

  const handleIssueCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIssuing(true);

    const attributes: FinancialAttributes = {
      annualIncomeUSD: Number(income),
      creditScore: Number(creditScore),
      repaidLoansCount: Number(repaidLoans),
      debtToIncomeRatioPct: Number(dti),
      subjectIdentityHash: '0x' + Math.random().toString(16).slice(2, 10).repeat(4),
      issuedTimestamp: Date.now()
    };

    setTimeout(() => {
      const cred = zkEngine.createAttestation(issuerPk, institutionName, attributes);
      onCredentialIssued(cred);
      setIsIssuing(false);
    }, 450);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 glow-card">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Building2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Authorized Financial Attestation Issuer</h2>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              In VeilLend, accredited institutions (banks, payroll verifiers, credit agencies) issue 
              cryptographically signed financial attestations. These credentials remain strictly stored in your local 
              browser enclave and are <strong>never published to the public blockchain</strong>.
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
        <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">Quick Test Profiles:</span>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => applyPreset('prime')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-500/30 transition-all"
          >
            Tier 1: Prime ( / 790 Score)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('standard')}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium hover:bg-indigo-500/30 transition-all"
          >
            Tier 2: Standard ( / 715 Score)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('entry')}
            className="px-3 py-1.5 rounded-lg bg-slate-700/40 text-slate-300 border border-slate-600/30 text-xs font-medium hover:bg-slate-700/60 transition-all"
          >
            Tier 3: Entry ( / 630 Score)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        <form onSubmit={handleIssueCredential} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <span>Generate Financial Attestation</span>
          </h3>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Issuing Authority</label>
            <input
              type="text"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Annual Verified Income ()</label>
              <input
                type="number"
                value={income}
                onChange={(e) => setIncome(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Credit Score (FICO)</label>
              <input
                type="number"
                value={creditScore}
                onChange={(e) => setCreditScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Repaid Loans History</label>
              <input
                type="number"
                value={repaidLoans}
                onChange={(e) => setRepaidLoans(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Debt-To-Income Ratio (%)</label>
              <input
                type="number"
                value={dti}
                onChange={(e) => setDti(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isIssuing}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isIssuing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Signing Cryptographic Attestation...</span>
              </>
            ) : (
              <>
                <Award className="w-4 h-4" />
                <span>Issue & Store in Local Enclave</span>
              </>
            )}
          </button>
        </form>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Current Enclave Credential</span>
            </h3>

            {activeCredential ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Issuer Authority:</span>
                    <span className="text-emerald-300 font-semibold">{activeCredential.issuerName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Verified Income:</span>
                    <span className="text-white font-bold"> USD</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Credit Score:</span>
                    <span className="text-cyan-400 font-bold">{activeCredential.attributes.creditScore}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Repaid Loans:</span>
                    <span className="text-white">{activeCredential.attributes.repaidLoansCount} past loans</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Debt-to-Income:</span>
                    <span className="text-white">{activeCredential.attributes.debtToIncomeRatioPct}%</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 break-all">
                    Signature: {activeCredential.signature}
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Credential valid and ready for Zero-Knowledge Tier Proving.</span>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl">
                <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-sm text-slate-400">No credential loaded in local enclave.</p>
                <p className="text-xs text-slate-500 mt-1">Select a quick profile above or issue an attestation.</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 pt-4 border-t border-slate-800/80">
            Confidentiality Guarantee: No personal identification numbers or raw income values are ever sent to Midnight validators.
          </div>
        </div>

      </div>

    </div>
  );
};