# VBT Token Migration Testing Guide

This document outlines the complete end-to-end testing process for the VBT token migration system, from internal tokens to blockchain tokens.

## Overview

The migration system allows users to convert their internal VBT tokens (stored in the database) to blockchain VBT tokens (ERC-20 tokens on Base Sepolia). The process involves:

1. **Initiation**: User requests migration, internal VBT is deducted
2. **Blockchain Transaction**: Smart contract mints tokens to user's wallet
3. **Completion**: Migration status is updated, transaction hash is recorded
4. **Monitoring**: Backend service automatically processes pending migrations

## Prerequisites

Before testing, ensure:

- ✅ VBToken smart contract is deployed to Base Sepolia
- ✅ Contract address is set in `VBT_CONTRACT_ADDRESS` environment variable
- ✅ Migration service is running (check server logs)
- ✅ MetaMask is installed and configured for Base Sepolia
- ✅ Test user has internal VBT tokens in database

## Test Scenarios

### Scenario 1: Successful Migration (Happy Path)

**Objective**: Verify complete migration flow from start to finish

**Steps**:
1. **Setup**
   - Login as test user
   - Navigate to `/migrate` page
   - Verify current internal VBT balance is displayed

2. **Wallet Connection**
   - Click "Connect Wallet" button
   - MetaMask popup appears
   - Approve connection
   - Verify wallet address is displayed
   - Verify "Connected" status is shown

3. **Network Check**
   - If not on Base Sepolia, "Switch Network" button appears
   - Click "Switch Network"
   - Approve network switch in MetaMask
   - Verify Base Sepolia network is active

4. **Migration Initiation**
   - Enter migration amount (e.g., 100 VBT)
   - Verify preview shows 1:1 ratio
   - Click "Migrate to Blockchain"
   - Confirm transaction in MetaMask
   - Verify "Pending" status appears in migration history

5. **Backend Processing**
   - Wait for migration service to process (polls every 30 seconds)
   - Check server logs for migration processing
   - Verify smart contract `mintForMigration` is called
   - Verify transaction is confirmed on blockchain

6. **Completion Verification**
   - Migration status changes to "Completed"
   - Transaction hash is displayed
   - Click transaction hash to view on BaseScan
   - Verify internal VBT balance decreased
   - Verify blockchain VBT balance increased

**Expected Results**:
- ✅ Internal VBT balance: Original - Migrated Amount
- ✅ Blockchain VBT balance: Original + Migrated Amount
- ✅ Migration status: "Completed"
- ✅ Transaction hash: Valid and viewable on BaseScan
- ✅ No errors in server logs

### Scenario 2: Insufficient Balance

**Objective**: Verify error handling when user has insufficient internal VBT

**Steps**:
1. Login as user with low VBT balance (e.g., 50 VBT)
2. Navigate to `/migrate` page
3. Enter migration amount greater than balance (e.g., 100 VBT)
4. Click "Migrate to Blockchain"

**Expected Results**:
- ❌ Error message: "Insufficient VBT balance"
- ❌ Migration is not initiated
- ✅ Internal VBT balance remains unchanged

### Scenario 3: Rate Limiting

**Objective**: Verify rate limiting prevents abuse (1 migration per hour)

**Steps**:
1. Complete a successful migration
2. Immediately attempt another migration
3. Try to initiate second migration

**Expected Results**:
- ❌ Error message: "Migration rate limit exceeded. Please wait 1 hour."
- ❌ Second migration is not initiated
- ✅ First migration remains in history

### Scenario 4: Transaction Rejection

**Objective**: Verify handling when user rejects MetaMask transaction

**Steps**:
1. Initiate migration
2. When MetaMask popup appears, click "Reject"

**Expected Results**:
- ❌ Migration status: "Failed"
- ✅ Internal VBT is refunded to user
- ✅ Error message displayed to user
- ✅ Can retry migration after refund

### Scenario 5: Network Mismatch

**Objective**: Verify handling when user is on wrong network

**Steps**:
1. Connect wallet on Ethereum Mainnet (not Base Sepolia)
2. Attempt to initiate migration

**Expected Results**:
- ❌ Warning message: "Please switch to Base Sepolia network"
- ❌ Migration button is disabled
- ✅ "Switch Network" button is available

### Scenario 6: Wallet Not Connected

**Objective**: Verify migration requires wallet connection

**Steps**:
1. Navigate to `/migrate` page without connecting wallet
2. Attempt to initiate migration

**Expected Results**:
- ❌ Migration form is disabled
- ✅ "Connect Wallet" button is prominent
- ✅ Message: "Connect your wallet to migrate tokens"

### Scenario 7: Migration History Display

**Objective**: Verify migration history is correctly displayed

**Steps**:
1. Complete multiple migrations (successful and failed)
2. Navigate to migration history section
3. Verify all migrations are listed

**Expected Results**:
- ✅ All migrations are displayed in reverse chronological order
- ✅ Each migration shows: amount, status, date, transaction hash
- ✅ Successful migrations have green status badge
- ✅ Failed migrations have red status badge
- ✅ Pending migrations have yellow status badge
- ✅ Transaction hashes are clickable links to BaseScan

### Scenario 8: Concurrent Migrations

**Objective**: Verify system handles multiple users migrating simultaneously

**Steps**:
1. Login as User A and initiate migration
2. Login as User B (different browser) and initiate migration
3. Verify both migrations process independently

**Expected Results**:
- ✅ Both migrations complete successfully
- ✅ No interference between users
- ✅ Correct balances for both users
- ✅ Separate transaction hashes

### Scenario 9: Migration Service Restart

**Objective**: Verify pending migrations resume after service restart

**Steps**:
1. Initiate migration
2. Before completion, restart server
3. Wait for service to restart
4. Verify migration completes

**Expected Results**:
- ✅ Migration resumes processing after restart
- ✅ No duplicate transactions
- ✅ Migration completes successfully

### Scenario 10: Invalid Amount

**Objective**: Verify validation for invalid migration amounts

**Steps**:
1. Try to migrate 0 VBT
2. Try to migrate negative amount
3. Try to migrate decimal amount (e.g., 10.5 VBT)

**Expected Results**:
- ❌ Error: "Amount must be greater than 0"
- ❌ Error: "Amount must be positive"
- ❌ Error: "Amount must be a whole number"

## Manual Testing Checklist

Use this checklist to verify all functionality:

### Wallet Integration
- [ ] MetaMask connection works
- [ ] Wallet address displays correctly
- [ ] Disconnect wallet works
- [ ] Network switching works
- [ ] Blockchain balance displays correctly

### Migration Flow
- [ ] Amount input validation works
- [ ] Migration preview shows correct 1:1 ratio
- [ ] Internal VBT deduction works
- [ ] Blockchain transaction signing works
- [ ] Transaction confirmation works
- [ ] Status updates correctly

### Error Handling
- [ ] Insufficient balance error works
- [ ] Rate limiting works
- [ ] Transaction rejection handling works
- [ ] Network mismatch warning works
- [ ] Wallet not connected warning works

### Migration History
- [ ] History displays all migrations
- [ ] Status badges show correct colors
- [ ] Transaction hashes are clickable
- [ ] Dates display correctly
- [ ] Amounts display correctly

### Backend Service
- [ ] Service starts automatically
- [ ] Polling works (every 30 seconds)
- [ ] Pending migrations are processed
- [ ] Smart contract interaction works
- [ ] Status updates in database
- [ ] Error logging works

## Automated Testing

Run the migration router tests:

```bash
cd /home/ubuntu/viral-beat
pnpm test migration.test.ts
```

Expected output:
```
✓ should initiate migration and deduct internal VBT
✓ should fail migration with insufficient balance
✓ should enforce rate limiting (1 per hour)
✓ should get migration history
✓ should get migration statistics
✓ should refund VBT on failed migration
✓ should prevent duplicate migrations
✓ should validate migration amount
✓ should track pending migrations
✓ should complete migration with transaction hash
✓ should handle concurrent migrations
✓ should resume pending migrations after restart
```

## Performance Testing

### Load Testing

Test migration service under load:

```bash
# Simulate 10 concurrent migrations
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/trpc/migration.initiate \
    -H "Content-Type: application/json" \
    -d '{"amount": 100}' &
done
```

**Expected Results**:
- ✅ All migrations are queued
- ✅ Service processes migrations sequentially
- ✅ No race conditions or duplicate transactions
- ✅ Response time < 2 seconds per migration

### Stress Testing

Test with high migration volume:

```bash
# Create 100 pending migrations
for i in {1..100}; do
  # Insert pending migration into database
  echo "INSERT INTO tokenMigrations (userId, amount, status) VALUES ($i, 100, 'pending');"
done
```

**Expected Results**:
- ✅ Service processes all migrations
- ✅ No memory leaks
- ✅ No database deadlocks
- ✅ Consistent processing time

## Security Testing

### SQL Injection

Attempt SQL injection in amount field:

```bash
curl -X POST http://localhost:3000/api/trpc/migration.initiate \
  -H "Content-Type: application/json" \
  -d '{"amount": "100; DROP TABLE tokenMigrations;"}'
```

**Expected Results**:
- ❌ Request is rejected
- ✅ Error: "Invalid amount"
- ✅ Database remains intact

### Rate Limit Bypass

Attempt to bypass rate limiting:

```bash
# Try multiple migrations from same user
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/trpc/migration.initiate \
    -H "Content-Type: application/json" \
    -d '{"amount": 100}'
done
```

**Expected Results**:
- ✅ First migration succeeds
- ❌ Subsequent migrations fail with rate limit error
- ✅ Only one migration is processed

### Transaction Replay

Attempt to replay a completed migration:

**Expected Results**:
- ❌ Duplicate detection prevents replay
- ✅ Error: "Migration already completed"
- ✅ No duplicate blockchain transaction

## Monitoring and Logging

### Server Logs

Monitor migration service logs:

```bash
tail -f .manus-logs/devserver.log | grep MigrationService
```

**Key Log Messages**:
- `[MigrationService] Starting migration monitoring service`
- `[MigrationService] Processing pending migration: {id}`
- `[MigrationService] Minting {amount} VBT for user {userId}`
- `[MigrationService] Transaction confirmed: {txHash}`
- `[MigrationService] Migration {id} completed successfully`
- `[MigrationService] Error processing migration: {error}`

### Database Queries

Check migration status in database:

```sql
-- Get all pending migrations
SELECT * FROM tokenMigrations WHERE status = 'pending';

-- Get migration statistics
SELECT 
  status,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM tokenMigrations
GROUP BY status;

-- Get recent migrations
SELECT * FROM tokenMigrations 
ORDER BY createdAt DESC 
LIMIT 10;
```

### Blockchain Verification

Verify transactions on BaseScan:

1. Visit: `https://sepolia.basescan.org/address/{VBT_CONTRACT_ADDRESS}`
2. Check "Transactions" tab
3. Verify `mintForMigration` calls
4. Verify correct amounts and recipients

## Troubleshooting

### Migration Stuck in Pending

**Symptoms**: Migration remains in "pending" status for > 5 minutes

**Diagnosis**:
1. Check server logs for errors
2. Verify migration service is running
3. Check contract address is correct
4. Verify deployer wallet has ETH for gas

**Solution**:
1. Restart server
2. Check migration service logs
3. Manually complete migration if needed

### Transaction Failed

**Symptoms**: Migration status changes to "failed"

**Diagnosis**:
1. Check transaction hash on BaseScan
2. Review error message in logs
3. Verify contract is not paused

**Solution**:
1. Refund user's internal VBT
2. Investigate root cause
3. Fix issue and allow retry

### Balance Mismatch

**Symptoms**: Internal VBT deducted but blockchain VBT not received

**Diagnosis**:
1. Check migration status in database
2. Verify transaction on BaseScan
3. Check wallet address is correct

**Solution**:
1. If transaction succeeded, update migration status
2. If transaction failed, refund internal VBT
3. Investigate discrepancy

## Success Criteria

Migration system is considered fully functional when:

- ✅ All 10 test scenarios pass
- ✅ All automated tests pass (12/12)
- ✅ Load testing shows consistent performance
- ✅ Security testing shows no vulnerabilities
- ✅ Monitoring and logging work correctly
- ✅ Error handling covers all edge cases
- ✅ User experience is smooth and intuitive

## Next Steps After Testing

1. **Documentation**: Update user-facing migration guide
2. **Monitoring**: Set up alerts for failed migrations
3. **Analytics**: Track migration volume and success rate
4. **Optimization**: Improve migration service performance
5. **Mainnet**: Prepare for mainnet deployment

## Support

For testing issues or questions:
- Review server logs: `.manus-logs/devserver.log`
- Check database: Use Database UI in Management Panel
- Contact: peter.g.kuria@gmail.com
