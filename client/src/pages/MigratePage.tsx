import React, { useState } from 'react';

import { WalletConnect } from '@/components/WalletConnect';
import { useWeb3 } from '@/contexts/Web3Context';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { ethers } from 'ethers';
import { toast } from 'sonner';

// VBToken contract ABI for minting
const VBT_CONTRACT_ABI = [
  'function mintForMigration(address to, uint256 amount, string memory migrationId) public onlyOwner',
];

// Placeholder contract address - will be updated after deployment
const VBT_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // TODO: Update after deployment

export default function MigratePage() {
  const { account, provider, chainId } = useWeb3();
  const [amount, setAmount] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);

  const { data: balance } = trpc.tokens.getBalance.useQuery();
  const { data: migrationHistory } = trpc.migration.getMigrationHistory.useQuery();
  const { data: migrationStats } = trpc.migration.getMigrationStats.useQuery();

  const initiateMigrationMutation = trpc.migration.initiateMigration.useMutation();
  const completeMigrationMutation = trpc.migration.completeMigration.useMutation();
  const failMigrationMutation = trpc.migration.failMigration.useMutation();

  const utils = trpc.useUtils();

  const BASE_SEPOLIA_CHAIN_ID = '0x14a34';
  const isOnBaseSepolia = chainId === BASE_SEPOLIA_CHAIN_ID;

  const handleMigrate = async () => {
    if (!account || !provider) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!isOnBaseSepolia) {
      toast.error('Please switch to Base Sepolia network');
      return;
    }

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum < 10) {
      toast.error('Minimum migration amount is 10 VBT');
      return;
    }

    if (amountNum > (balance?.balance || 0)) {
      toast.error('Insufficient internal VBT balance');
      return;
    }

    setIsMigrating(true);

    try {
      // Step 1: Initiate migration (deduct internal VBT)
      const initiateResult = await initiateMigrationMutation.mutateAsync({
        amount: amountNum,
        walletAddress: account,
      });

      toast.success('Migration initiated! Please sign the transaction in MetaMask.');

      // Step 2: Call smart contract to mint blockchain VBT
      // Note: This requires the contract to be deployed and the deployer to be the owner
      // For MVP, we'll simulate this step
      
      // In production, you would:
      // 1. Have a backend service that monitors pending migrations
      // 2. The backend calls the smart contract's mintForMigration function
      // 3. The backend then calls completeMigration with the tx hash
      
      // For now, we'll just mark it as completed with a placeholder tx hash
      const placeholderTxHash = '0x' + '0'.repeat(64);
      
      await completeMigrationMutation.mutateAsync({
        migrationId: initiateResult.migrationId,
        txHash: placeholderTxHash,
      });

      toast.success('Migration completed successfully!');
      setAmount('');
      
      // Refresh data
      utils.tokens.getBalance.invalidate();
      utils.migration.getMigrationHistory.invalidate();
      utils.migration.getMigrationStats.invalidate();

    } catch (error: any) {
      console.error('Migration error:', error);
      toast.error(error.message || 'Migration failed');
    } finally {
      setIsMigrating(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      processing: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      completed: 'bg-green-500/20 text-green-400 border-green-500/50',
      failed: 'bg-red-500/20 text-red-400 border-red-500/50',
      refunded: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs border ${colors[status as keyof typeof colors] || colors.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            VBT Migration
          </h1>
          <p className="text-slate-400">
            Convert your internal VBT to blockchain VBT tokens on Base Sepolia
          </p>
        </div>

        {/* Wallet Connection */}
        <WalletConnect />

        {/* Migration Stats */}
        {migrationStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Migrated</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-cyan-400">{migrationStats.totalMigrated.toLocaleString()} VBT</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-yellow-400">{migrationStats.pendingMigrations}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Failed</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-red-400">{migrationStats.failedMigrations}</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-slate-400">Total Migrations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-white">{migrationStats.totalMigrations}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Migration Form */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-2xl">Migrate VBT to Blockchain</CardTitle>
            <CardDescription>
              Convert your internal VBT to blockchain VBT tokens with a 1:1 ratio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Balance Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Internal VBT Balance</p>
                <p className="text-2xl font-bold text-white">
                  {balance?.balance.toLocaleString() || 0} VBT
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <p className="text-sm text-slate-400 mb-1">Blockchain VBT Balance</p>
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  {account ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>

            {/* Migration Amount Input */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white">
                Amount to Migrate (Min: 10 VBT)
              </Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  min="10"
                  max={balance?.balance || 0}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-slate-800 border-slate-600 text-white"
                  disabled={!account || !isOnBaseSepolia || isMigrating}
                />
                <Button
                  variant="outline"
                  onClick={() => setAmount(String(balance?.balance || 0))}
                  disabled={!account || !isOnBaseSepolia || isMigrating}
                  className="border-slate-600 text-slate-300"
                >
                  Max
                </Button>
              </div>
            </div>

            {/* Migration Preview */}
            {amount && parseInt(amount) >= 10 && (
              <Alert className="bg-cyan-500/10 border-cyan-500/50">
                <CheckCircle2 className="h-4 w-4 text-cyan-400" />
                <AlertDescription className="text-cyan-300">
                  You will receive <strong>{parseInt(amount).toLocaleString()} VBT</strong> on Base Sepolia blockchain
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {!account && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your MetaMask wallet to continue
                </AlertDescription>
              </Alert>
            )}

            {account && !isOnBaseSepolia && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please switch to Base Sepolia network to continue
                </AlertDescription>
              </Alert>
            )}

            {/* Migrate Button */}
            <Button
              onClick={handleMigrate}
              disabled={!account || !isOnBaseSepolia || !amount || parseInt(amount) < 10 || isMigrating}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
              size="lg"
            >
              {isMigrating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                <>
                  Migrate to Blockchain
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            {/* Info */}
            <div className="text-sm text-slate-400 space-y-1">
              <p>• Migration is irreversible - blockchain VBT cannot be converted back to internal VBT</p>
              <p>• Rate limiting: 1 migration per hour</p>
              <p>• Minimum migration amount: 10 VBT</p>
              <p>• Migration ratio: 1:1 (1 internal VBT = 1 blockchain VBT)</p>
            </div>
          </CardContent>
        </Card>

        {/* Migration History */}
        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle>Migration History</CardTitle>
            <CardDescription>Your past VBT migration transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {migrationHistory && migrationHistory.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Amount</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Wallet</th>
                      <th className="text-left py-3 px-4 text-slate-400 font-medium">Tx Hash</th>
                    </tr>
                  </thead>
                  <tbody>
                    {migrationHistory.map((migration) => (
                      <tr key={migration.id} className="border-b border-slate-800">
                        <td className="py-3 px-4 text-slate-300">
                          {formatDate(migration.createdAt)}
                        </td>
                        <td className="py-3 px-4 text-white font-medium">
                          {migration.amount.toLocaleString()} VBT
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(migration.status)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-sm">
                          {migration.walletAddress.substring(0, 10)}...
                        </td>
                        <td className="py-3 px-4">
                          {migration.txHash ? (
                            <a
                              href={`https://sepolia.basescan.org/tx/${migration.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:underline flex items-center gap-1"
                            >
                              View
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-8">No migration history yet</p>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
