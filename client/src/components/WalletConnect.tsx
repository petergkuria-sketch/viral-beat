import React from 'react';
import { useWeb3 } from '@/contexts/Web3Context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const WalletConnect: React.FC = () => {
  const {
    account,
    chainId,
    vbtBalance,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    switchToBaseSepolia,
  } = useWeb3();

  const BASE_SEPOLIA_CHAIN_ID = '0x14a34'; // 84532
  const isOnBaseSepolia = chainId === BASE_SEPOLIA_CHAIN_ID;

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  if (!account) {
    return (
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">Connect Your Wallet</h3>
              <p className="text-slate-400 text-sm mb-4">
                Connect your MetaMask wallet to access blockchain VBT features
              </p>
            </div>
            {error && (
              <Alert variant="destructive" className="w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {isConnecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect MetaMask
                </>
              )}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Don't have MetaMask?{' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                Install it here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Connected Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Connected</p>
                <p className="text-white font-mono text-sm">{formatAddress(account)}</p>
              </div>
            </div>
            <Button
              onClick={disconnectWallet}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Disconnect
            </Button>
          </div>

          {/* Network Status */}
          {!isOnBaseSepolia && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Wrong network. Please switch to Base Sepolia.</span>
                <Button
                  onClick={switchToBaseSepolia}
                  size="sm"
                  variant="outline"
                  className="ml-2"
                >
                  Switch Network
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {isOnBaseSepolia && (
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-slate-400">Base Sepolia Testnet</span>
            </div>
          )}

          {/* VBT Balance */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <p className="text-sm text-slate-400 mb-1">Blockchain VBT Balance</p>
            <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              {parseFloat(vbtBalance).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{' '}
              VBT
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
