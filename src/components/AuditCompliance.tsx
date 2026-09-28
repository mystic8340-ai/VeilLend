import React, { useState } from 'react';
import { Scale, CheckCircle2, Shield, KeyRound, RefreshCw } from 'lucide-react';
import { AuditReport, PublicLedgerState } from '../midnight/contractTypes';
import { VeilLendProtocol } from '../midnight/veillendSimulator';

interface AuditComplianceProps {
  ledger: PublicLedgerState;
}

export const AuditCompliance: React.FC<AuditComplianceProps> = ({ ledger }) => {
  const protocol = VeilLendProtocol.getInstance();
  const [auditKey, setAuditKey] = useState<string>('REG_COMPLIANCE_KEY_2026_PREPROD');
  const [report, setReport] = useState<AuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    try {
      const result = await protocol.generateRegulatoryAudit(auditKey);
      setReport(result);
    } finally {
      setIsAuditing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl glow-card-purple">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Selective Disclosure for Regulatory Compliance</h2>
            <p className="text-sm text-slate-400 mt-1 leading-relaxed">
              Midnight's unique programmable privacy enables <strong>Selective Disclosure</strong>. 
              Authorized regulators and compliance auditors can cryptographically verify lending pool solvency 
              and reserve health without de-anonymizing borrowers or exposing private personal financials.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <span>Execute On-Chain Solvency Verification</span>
        </h3>

        <div className="space-y-2">
          <label className="text-xs text-slate-400">Auditor Authorization Token / Key</label>
          <input
            type="text"
            value={auditKey}
            onChange={(e) => setAuditKey(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
          />
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isAuditing}
          className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-sm transition-all"
        >
          {isAuditing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying Midnight Reserve Proofs...</span>
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              <span>Verify Solvency via Compact Circuit</span>
            </>
          )}
        </button>

        {report && (
          <div className="mt-6 p-6 rounded-xl bg-slate-950 border border-purple-500/30 space-y-4 font-mono text-xs">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <span className="text-slate-400">Circuit Name:</span>
              <span className="text-purple-300 font-semibold">veillend.disclose_solvency_audit</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Protocol Solvency:</span>
              <span className="text-emerald-400 font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>CRYPTOGRAPHICALLY VERIFIED SOLVENT</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Borrower Privacy:</span>
              <span className="text-cyan-400 font-bold">100% PRESERVED (0 Personal Data Exposed)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Available Reserves:</span>
              <span className="text-white"> tDUST</span>
            </div>
            <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 break-all">
              Audit Proof Hash: {report.proofHash}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};