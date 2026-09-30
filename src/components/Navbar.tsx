import React from 'react';
import { Shield, Wallet, Rocket } from 'lucide-react';
import { MidnightAccount } from '../midnight/dappConnector';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  account: MidnightAccount | null;
  onConnectWallet: () => void;
  deployedAddress: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  account,
  onConnectWallet,
  deployedAddress
}) => {
  const tabs = [
    { id: 'overview', label: 'Lending Market' },
    { id: 'deploy', label: 'Deploy (/deploy)' },
    { id: 'prover', label: 'ZK Credit Prover' },
    { id: 'loans', label: 'My Loans' },
    { id: 'pool', label: 'Liquidity Pool' },
    { id: 'issuer', label: 'Credential Issuer' },
    { id: 'audit', label: 'Audit & Compliance' }
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== 'undefined') {
      const targetPath = tabId === 'deploy' ? '/deploy' : (tabId === 'overview' ? '/' : `/#${tabId}`);
      window.history.pushState(null, '', targetPath);
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#070A13]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleTabClick('overview')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-[#0B1120] rounded-[10px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  Veil<span className="text-cyan-400">Lend</span>
                </span>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-indigo-500/20 text-indigo-300 rounded border border-indigo-500/30">
                  Preprod
                </span>
              </div>
              <p className="text-xs text-slate-400">Zero-Knowledge Private Lending on Midnight</p>
            </div>
          </div>

          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  {tab.id === 'deploy' && <Rocket className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>1AM Preprod</span>
            </div>

            {account ? (
              <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-700/80 px-3.5 py-2 rounded-xl text-sm shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                <div className="text-left font-mono">
                  <div className="text-xs text-slate-400">
                    ${account.balanceTdust.toLocaleString()} tDUST
                  </div>
                  <div className="text-xs text-cyan-300 font-semibold">
                    {account.address.slice(0, 12)}...{account.address.slice(-6)}
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onConnectWallet}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-sm transition-all shadow-md shadow-indigo-500/20"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect 1AM</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};