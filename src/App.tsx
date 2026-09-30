import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { DeployContract } from './components/DeployContract';
import { CredentialIssuer } from './components/CredentialIssuer';
import { TierProver } from './components/TierProver';
import { LendingMarket } from './components/LendingMarket';
import { ActiveLoans } from './components/ActiveLoans';
import { LiquidityPool } from './components/LiquidityPool';
import { AuditCompliance } from './components/AuditCompliance';

import { CreditTier, LoanRecord, PublicLedgerState, SignedCredential, ZkProofResult } from './midnight/contractTypes';
import { MidnightDAppConnector, MidnightAccount } from './midnight/dappConnector';
import { VeilLendProtocol } from './midnight/veillendSimulator';
import { ZkProofEngine } from './midnight/zkProofEngine';

export const App: React.FC = () => {
  const connector = MidnightDAppConnector.getInstance();
  const protocol = VeilLendProtocol.getInstance();
  const zkEngine = ZkProofEngine.getInstance();

  // Route detection: if URL is /deploy or #deploy, set tab to deploy
  const getInitialTab = (): string => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/deploy' || hash === '#deploy' || hash === '#/deploy') {
        return 'deploy';
      }
    }
    return 'overview';
  };

  const [activeTab, setActiveTab] = useState<string>(getInitialTab);
  const [account, setAccount] = useState<MidnightAccount | null>(null);
  const [ledger, setLedger] = useState<PublicLedgerState>(protocol.getLedgerState());
  const [loans, setLoans] = useState<LoanRecord[]>(protocol.getAllLoans());
  const [contractAddress, setContractAddress] = useState<string>(protocol.CONTRACT_ADDRESS);

  // Active credential & proof state
  const [credential, setCredential] = useState<SignedCredential | null>(null);
  const [activeProof, setActiveProof] = useState<ZkProofResult | null>(null);
  const [selectedTier, setSelectedTier] = useState<CreditTier>(CreditTier.TIER_1_PRIME);
  const [requestedAmount, setRequestedAmount] = useState<number>(35000);

  useEffect(() => {
    setAccount(connector.getAccount());

    // Listen to browser history navigation
    const handleLocationChange = () => {
      if (window.location.pathname === '/deploy' || window.location.hash.includes('deploy')) {
        setActiveTab('deploy');
      }
    };
    window.addEventListener('popstate', handleLocationChange);

    // Prepopulate a sample prime credential for seamless testing
    const demoCred = zkEngine.createAttestation(
      protocol.DEFAULT_ISSUER_PK,
      'Apex Institutional Credit Bureau',
      {
        annualIncomeUSD: 145000,
        creditScore: 790,
        repaidLoansCount: 7,
        debtToIncomeRatioPct: 15,
        subjectIdentityHash: '0x77281938210482910385918392019482',
        attestationSalt: '0x11223344556677889900aabbccddeeff',
        issuedTimestamp: Date.now()
      }
    );
    setCredential(demoCred);

    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const handleConnectWallet = async () => {
    const acc = await connector.connect();
    setAccount(acc);
  };

  const handleContractDeployed = (newAddress: string) => {
    setContractAddress(newAddress);
  };

  const handleProofGenerated = (proof: ZkProofResult, tier: CreditTier, amount: number) => {
    setActiveProof(proof);
    setSelectedTier(tier);
    setRequestedAmount(amount);
  };

  const handleLoanOriginated = (_newLoan: LoanRecord) => {
    setLoans(protocol.getAllLoans());
    setLedger(protocol.getLedgerState());
    setActiveProof(null);
  };

  const handleLoanRepaid = (_settledLoan: LoanRecord) => {
    setLoans(protocol.getAllLoans());
    setLedger(protocol.getLedgerState());
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#040711] text-slate-100">
      
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        account={account}
        onConnectWallet={handleConnectWallet}
        deployedAddress={contractAddress}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'deploy' && (
          <DeployContract
            onContractDeployed={handleContractDeployed}
            onNavigateToMarket={() => {
              setActiveTab('overview');
              window.history.pushState(null, '', '/');
            }}
          />
        )}

        {activeTab === 'overview' && (
          <LendingMarket
            ledger={ledger}
            activeProof={activeProof}
            selectedTier={selectedTier}
            requestedAmount={requestedAmount}
            onLoanOriginated={handleLoanOriginated}
            onNavigateToLoans={() => setActiveTab('loans')}
          />
        )}

        {activeTab === 'prover' && (
          <TierProver
            credential={credential}
            onProofGenerated={handleProofGenerated}
            activeProof={activeProof}
            onNavigateToMarket={() => setActiveTab('overview')}
          />
        )}

        {activeTab === 'loans' && (
          <ActiveLoans
            loans={loans}
            onLoanRepaid={handleLoanRepaid}
          />
        )}

        {activeTab === 'pool' && (
          <LiquidityPool
            ledger={ledger}
            onLedgerUpdate={setLedger}
          />
        )}

        {activeTab === 'issuer' && (
          <CredentialIssuer
            onCredentialIssued={setCredential}
            activeCredential={credential}
          />
        )}

        {activeTab === 'audit' && (
          <AuditCompliance
            ledger={ledger}
          />
        )}
      </main>

      {/* Footer with Deployed Contract Indicator */}
      <footer className="border-t border-slate-900 bg-[#070A13] py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>Built on <strong>Midnight Network</strong> (1AM Preprod / Compact v0.23)</span>
          </div>
          <div className="mt-2 sm:mt-0 font-mono text-[11px] text-slate-400">
            Active Contract: <span className="text-cyan-400 font-semibold">{contractAddress}</span>
          </div>
        </div>
      </footer>

    </div>
  );
};