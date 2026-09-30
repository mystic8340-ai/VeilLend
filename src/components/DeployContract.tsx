import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Shield, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  Cpu, 
  Zap, 
  Globe 
} from 'lucide-react';
import { 
  detect1AMWallet, 
  create1AMConnectedSession, 
  deployVeilLendThroughBrowser, 
  ConnectedSession1AM, 
  DeployContractResult,
  getMidnightNetworkId
} from '../midnight/midnight1am';

interface DeployContractProps {
  onContractDeployed: (address: string) => void;
  onNavigateToMarket: () => void;
}

export const DeployContract: React.FC<DeployContractProps> = ({
  onContractDeployed,
  onNavigateToMarket
}) => {
  const [walletAvailable, setWalletAvailable] = useState<boolean | null>(null);
  const [session, setSession] = useState<ConnectedSession1AM | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDeploying, setIsDeploying] = useState<boolean>(false);
  const [deployStep, setDeployStep] = useState<string>('');
  const [deployResult, setDeployResult] = useState<DeployContractResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    detect1AMWallet().then((w) => {
      setWalletAvailable(w !== null);
      if (!w) {
        setSession(null);
      }
    });
  }, []);

  const handleConnectWallet = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      const wallet = await detect1AMWallet();
      if (!wallet) {
        throw new Error("1AM / Lace extension not found. Please install the 1AM wallet extension to connect.");
      }
      let api: any = null;
      if (typeof wallet.connect === 'function') {
        api = await wallet.connect('preprod');
      } else if (typeof wallet.enable === 'function') {
        api = await wallet.enable();
      }
      const s = await create1AMConnectedSession(api);
      setSession(s);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to connect 1AM browser extension');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDeploy = async () => {
    if (!session || !session.api) {
      setErrorMsg("Wallet not connected: Please connect your 1AM wallet extension before deploying.");
      return;
    }
    setIsDeploying(true);
    setErrorMsg(null);
    setDeployStep('Initializing deployment flow...');

    try {
      const result = await deployVeilLendThroughBrowser(session, (step) => {
        setDeployStep(step);
      });

      setDeployResult(result);
      onContractDeployed(result.contractAddress);
    } catch (err: any) {
      setErrorMsg(err.message || 'Contract deployment failed: Wallet not connected or user rejected');
    } finally {
      setIsDeploying(false);
      setDeployStep('');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 glow-card">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <Rocket className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-white">Browser Contract Deployment (1AM Preprod)</h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                  /deploy
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                Deploy the <strong>VeilLend Compact smart contract</strong> directly through your browser extension on the 
                <strong> Midnight Preprod network</strong>. 
                Zero funded server wallets or local proof servers required — 1AM sponsors fees and handles client-side proving.
              </p>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-mono">Explicit Network ID</span>
            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>{getMidnightNetworkId()}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Deployment Rules & Guarantees */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400">
            <Cpu className="w-4 h-4" />
            <span>Browser-Only Prover</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Proof generation executes via 1AM extension's built-in ProofStation. No local proof server (localhost:6300) required.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400">
            <Zap className="w-4 h-4" />
            <span>Zero-Gas / Sponsored Fees</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Transactions are balanced via the 1AM wallet provider. No server-side funded deployer private keys or seeds needed.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1">
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-400">
            <Globe className="w-4 h-4" />
            <span>Explicit Network ID</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Explicitly sets Midnight Network ID (<code className="text-slate-300">preprod</code>) prior to any contract or wallet operations.
          </p>
        </div>
      </div>

      {/* Main Deploy Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 glow-card">
        
        {/* Step 1: Wallet Connection */}
        <div className="pb-6 border-b border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-mono uppercase text-slate-400">Step 1: Wallet Provider</span>
            <div className="text-sm font-semibold text-white mt-0.5 flex items-center space-x-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>
                {session ? 'Connected to Midnight 1AM Wallet' : 'Connect 1AM Browser Extension'}
              </span>
            </div>
            {session && (
              <span className="text-xs font-mono text-cyan-300 mt-1 block">
                {session.unshieldedAddress}
              </span>
            )}
          </div>

          {!session ? (
            <button
              onClick={handleConnectWallet}
              disabled={isConnecting}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect 1AM'}
            </button>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-mono">
              <CheckCircle2 className="w-4 h-4" />
              <span>Ready on Preprod</span>
            </div>
          )}
        </div>

        {/* Step 2: Deployment Trigger */}
        <div className="py-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-white">Step 2: Deploy VeilLend Contract</h3>
            <p className="text-xs text-slate-400">
              Target Contract: <code className="text-slate-300">contracts/veillend.compact</code> (Minokawa Compact v0.23)
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isDeploying && (
            <div className="p-5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3 font-mono text-xs">
              <div className="flex items-center space-x-3 text-cyan-300">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span className="font-semibold">{deployStep}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full animate-pulse w-3/4"></div>
              </div>
              <div className="text-[11px] text-slate-500">
                Executing 1AM extension browser deploy flow (proving, balancing, and submitting)...
              </div>
            </div>
          )}

          {!deployResult && !isDeploying && (
            !session ? (
              <div className="space-y-3">
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>1AM Wallet Not Connected. Connect your 1AM browser extension on Midnight Preprod before deploying.</span>
                </div>
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="w-full py-4 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Shield className="w-5 h-5" />
                  <span>{isConnecting ? 'Connecting 1AM Wallet...' : 'Connect 1AM Wallet to Deploy'}</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeploy}
                className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold text-sm transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center space-x-2"
              >
                <Rocket className="w-5 h-5" />
                <span>Deploy VeilLend Contract via 1AM Extension</span>
              </button>
            )
          )}

          {/* Step 3: SUCCESS STATE - Shows Deployed Contract Address */}
          {deployResult && (
            <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-5 animate-in fade-in">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">VeilLend Successfully Deployed to Preprod!</h4>
                  <p className="text-xs text-slate-300">
                    Contract deployed via 1AM browser extension in {deployResult.deploymentTimeMs}ms with zero server wallets.
                  </p>
                </div>
              </div>

              {/* Deployed Address Chip */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-semibold uppercase">Deployed Contract Address:</span>
                  <button
                    onClick={() => handleCopy(deployResult.contractAddress)}
                    className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-xs font-mono"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-emerald-300 break-all select-all">
                  {deployResult.contractAddress}
                </div>
              </div>

              {/* Metadata Details */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block">Transaction Hash:</span>
                  <span className="text-slate-300 break-all text-[11px]">{deployResult.txHash}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block">Network:</span>
                  <span className="text-cyan-300 font-semibold">Midnight Preprod ({deployResult.networkId})</span>
                </div>
              </div>

              {/* Navigation Action */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={onNavigateToMarket}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all text-center"
                >
                  Open Lending Market with this Contract
                </button>
                <button
                  onClick={() => setDeployResult(null)}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  Deploy Another Instance
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};