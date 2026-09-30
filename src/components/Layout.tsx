import React from 'react';
import { Navbar } from './Navbar';
import { MidnightAccount } from '../midnight/dappConnector';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  account: MidnightAccount | null;
  onConnectWallet: () => void;
  deployedAddress: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  account,
  onConnectWallet,
  deployedAddress
}) => {
  return (
    <div className="min-h-screen bg-[#070A13] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        account={account}
        onConnectWallet={onConnectWallet}
        deployedAddress={deployedAddress}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="border-t border-slate-800/80 bg-[#070A13] py-6 text-center text-xs text-slate-500 font-mono">
        VeilLend · Midnight Preprod Contract: {deployedAddress.slice(0, 10)}...{deployedAddress.slice(-8)}
      </footer>
    </div>
  );
};
