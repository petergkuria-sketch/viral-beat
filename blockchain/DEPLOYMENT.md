# VBToken Smart Contract Deployment Guide

This guide walks through deploying the VBToken ERC-20 smart contract to Base Sepolia testnet and verifying it on BaseScan.

## Prerequisites

1. **Testnet ETH**: Get Base Sepolia testnet ETH from the faucet
   - Visit: https://www.alchemy.com/faucets/base-sepolia
   - Enter deployment wallet address: `0x67899E362407D74a0de169503B429072ee3dDf3E`
   - Request testnet ETH (usually 0.1-0.5 ETH)

2. **Private Key**: The deployment wallet private key has been generated
   - Location: Generated during setup
   - **Security**: Never commit private keys to version control

3. **BaseScan API Key**: For contract verification
   - Visit: https://basescan.org/myapikey
   - Create a free account and generate an API key
   - Add to `.env` file: `BASESCAN_API_KEY=your_api_key_here`

## Deployment Steps

### Step 1: Configure Environment

Add the following to `blockchain/.env`:

```bash
# Deployment wallet private key (generated)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# BaseScan API key for contract verification
BASESCAN_API_KEY=your_basescan_api_key_here

# Base Sepolia RPC URL (already configured in hardhat.config.js)
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### Step 2: Deploy Contract

Run the deployment script:

```bash
cd blockchain
npx hardhat run scripts/deploy.js --network baseSepolia
```

Expected output:
```
🚀 Deploying VBToken to Base Sepolia...
📍 Deploying from: 0x67899E362407D74a0de169503B429072ee3dDf3E
⏳ Waiting for deployment...
✅ VBToken deployed to: 0x...
💰 Total Supply: 100,000,000 VBT
🔗 View on BaseScan: https://sepolia.basescan.org/address/0x...
```

**Important**: Save the deployed contract address!

### Step 3: Verify Contract on BaseScan

Run the verification script with the deployed contract address:

```bash
node scripts/verify.js 0xYOUR_CONTRACT_ADDRESS
```

Expected output:
```
🔍 Starting contract verification on BaseScan...
📍 Contract Address: 0x...
🌐 Network: baseSepolia
⏳ Submitting contract source code to BaseScan...
✅ Contract verified successfully!
🔗 View on BaseScan: https://sepolia.basescan.org/address/0x...#code
```

### Step 4: Update Application Configuration

Add the deployed contract address to the application environment:

```bash
# In the main project .env file (not blockchain/.env)
VBT_CONTRACT_ADDRESS=0xYOUR_CONTRACT_ADDRESS
```

### Step 5: Restart Services

Restart the development server to load the new contract address:

```bash
pnpm dev
```

The migration service will automatically connect to the deployed contract.

## Testing the Deployment

### 1. Check Contract on BaseScan

Visit: `https://sepolia.basescan.org/address/0xYOUR_CONTRACT_ADDRESS`

Verify:
- ✅ Contract is verified (green checkmark)
- ✅ Source code is visible
- ✅ Total supply is 100,000,000 VBT
- ✅ Contract owner is the deployment wallet

### 2. Test Migration Flow

1. **Connect Wallet**: Visit `/migrate` page and connect MetaMask
2. **Switch Network**: Ensure MetaMask is on Base Sepolia network
3. **Initiate Migration**: Enter amount and click "Migrate to Blockchain"
4. **Sign Transaction**: Approve the transaction in MetaMask
5. **Verify Completion**: Check transaction on BaseScan and verify balance update

### 3. Monitor Migration Service

Check server logs for migration service activity:

```bash
tail -f .manus-logs/devserver.log | grep MigrationService
```

Expected logs:
```
[MigrationService] Starting migration monitoring service
[MigrationService] Contract address: 0xYOUR_CONTRACT_ADDRESS
[MigrationService] Polling interval: 30000ms
[MigrationService] Service started successfully
[MigrationService] Processing pending migration: 1
[MigrationService] Minting 1000 VBT for user 1
[MigrationService] Transaction confirmed: 0x...
[MigrationService] Migration 1 completed successfully
```

## Troubleshooting

### Deployment Fails

**Error**: "insufficient funds for gas"
- **Solution**: Get more testnet ETH from the faucet

**Error**: "nonce too low"
- **Solution**: Wait a few minutes and try again, or reset MetaMask account

**Error**: "network not found"
- **Solution**: Check `hardhat.config.js` network configuration

### Verification Fails

**Error**: "Contract source code already verified"
- **Solution**: This is fine! Contract is already verified

**Error**: "Unable to verify contract"
- **Solution**: Wait 1-2 minutes after deployment, then try again

**Error**: "Invalid API key"
- **Solution**: Check `BASESCAN_API_KEY` in `.env` file

### Migration Service Issues

**Issue**: Contract address shows as 0x0000...
- **Solution**: Update `VBT_CONTRACT_ADDRESS` in `.env` and restart server

**Issue**: Migrations stuck in "pending" status
- **Solution**: Check server logs for errors, verify contract is deployed

**Issue**: "Insufficient balance" error during migration
- **Solution**: Ensure user has enough internal VBT tokens

## Security Considerations

1. **Private Key Security**
   - Never commit private keys to version control
   - Use environment variables for sensitive data
   - Consider using hardware wallets for mainnet

2. **Contract Ownership**
   - Only the contract owner can mint tokens
   - Transfer ownership carefully if needed
   - Consider multi-sig for production

3. **Rate Limiting**
   - Migration service has built-in rate limiting (1 per hour per user)
   - Monitor for suspicious activity
   - Implement additional fraud detection if needed

4. **Testing**
   - Always test on testnet first
   - Verify all functions work correctly
   - Test edge cases and error handling

## Mainnet Deployment

When ready to deploy to Base mainnet:

1. **Audit**: Get smart contract audited by professionals
2. **Testing**: Thoroughly test on testnet
3. **Liquidity**: Prepare initial liquidity for DEX listing
4. **Documentation**: Update all documentation with mainnet addresses
5. **Monitoring**: Set up monitoring and alerting
6. **Announcement**: Announce deployment to community

**Network Configuration for Mainnet**:
```javascript
base: {
  url: "https://mainnet.base.org",
  chainId: 8453,
  accounts: [process.env.DEPLOYER_PRIVATE_KEY]
}
```

## Support

For issues or questions:
- Check server logs: `.manus-logs/devserver.log`
- Review smart contract tests: `cd blockchain && npx hardhat test`
- Contact: peter.g.kuria@gmail.com
