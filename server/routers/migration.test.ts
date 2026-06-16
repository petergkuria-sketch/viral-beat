import { describe, it, expect, beforeEach } from 'vitest';
import { appRouter } from '../routers';
import { getDb } from '../db';
import { users, userTokens, tokenMigrations, tokenTransactions } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Migration Router', () => {
  let testUser: any;
  let caller: any;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test user
    const [user] = await db.insert(users).values({
      openId: `test-migration-${Date.now()}`,
      name: 'Migration Test User',
      email: 'migration@test.com',
    });

    testUser = {
      id: user.insertId,
      openId: `test-migration-${Date.now()}`,
      name: 'Migration Test User',
      email: 'migration@test.com',
    };

    // Initialize user tokens with balance
    await db.insert(userTokens).values({
      userId: testUser.id,
      balance: 1000,
      totalEarned: 1000,
      totalSpent: 0,
    });

    // Create caller with authenticated context
    caller = appRouter.createCaller({
      user: testUser,
      req: {} as any,
      res: {} as any,
    });
  });

  it('should get empty migration history for new user', async () => {
    const history = await caller.migration.getMigrationHistory();
    expect(history).toEqual([]);
  });

  it('should get migration stats for new user', async () => {
    const stats = await caller.migration.getMigrationStats();
    expect(stats.totalMigrated).toBe(0);
    expect(stats.pendingMigrations).toBe(0);
    expect(stats.failedMigrations).toBe(0);
    expect(stats.totalMigrations).toBe(0);
  });

  it('should initiate migration with valid parameters', async () => {
    const result = await caller.migration.initiateMigration({
      amount: 100,
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    expect(result.success).toBe(true);
    expect(result.amount).toBe(100);
    expect(result.walletAddress).toBe('0x1234567890123456789012345678901234567890');
    expect(result.migrationId).toBeGreaterThan(0);

    // Verify balance was deducted
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const [userBalance] = await db.select().from(userTokens).where(eq(userTokens.userId, testUser.id));
    expect(userBalance.balance).toBe(900);
  });

  it('should reject migration with insufficient balance', async () => {
    await expect(
      caller.migration.initiateMigration({
        amount: 2000,
        walletAddress: '0x1234567890123456789012345678901234567890',
      })
    ).rejects.toThrow('Insufficient internal VBT balance');
  });

  it('should reject migration with amount below minimum', async () => {
    await expect(
      caller.migration.initiateMigration({
        amount: 5,
        walletAddress: '0x1234567890123456789012345678901234567890',
      })
    ).rejects.toThrow('Minimum migration amount is 10 VBT');
  });

  it('should reject migration with invalid wallet address', async () => {
    await expect(
      caller.migration.initiateMigration({
        amount: 100,
        walletAddress: 'invalid-address',
      })
    ).rejects.toThrow();
  });

  it('should enforce rate limiting (1 per hour)', async () => {
    // First migration
    await caller.migration.initiateMigration({
      amount: 100,
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    // Second migration should fail
    await expect(
      caller.migration.initiateMigration({
        amount: 100,
        walletAddress: '0x1234567890123456789012345678901234567890',
      })
    ).rejects.toThrow('You can only initiate one migration per hour');
  });

  it('should complete migration with valid tx hash', async () => {
    // Initiate migration
    const initiateResult = await caller.migration.initiateMigration({
      amount: 100,
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    // Complete migration
    const completeResult = await caller.migration.completeMigration({
      migrationId: initiateResult.migrationId,
      txHash: '0x' + '1'.repeat(64),
    });

    expect(completeResult.success).toBe(true);
    expect(completeResult.txHash).toBe('0x' + '1'.repeat(64));

    // Verify migration status
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const [migration] = await db
      .select()
      .from(tokenMigrations)
      .where(eq(tokenMigrations.id, initiateResult.migrationId));
    expect(migration.status).toBe('completed');
    expect(migration.txHash).toBe('0x' + '1'.repeat(64));
  });

  it('should fail migration and refund tokens', async () => {
    // Initiate migration
    const initiateResult = await caller.migration.initiateMigration({
      amount: 100,
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    // Fail migration
    const failResult = await caller.migration.failMigration({
      migrationId: initiateResult.migrationId,
      errorMessage: 'Test error',
    });

    expect(failResult.success).toBe(true);
    expect(failResult.refundedAmount).toBe(100);

    // Verify balance was refunded
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const [userBalance] = await db.select().from(userTokens).where(eq(userTokens.userId, testUser.id));
    expect(userBalance.balance).toBe(1000);

    // Verify migration status
    const [migration] = await db
      .select()
      .from(tokenMigrations)
      .where(eq(tokenMigrations.id, initiateResult.migrationId));
    expect(migration.status).toBe('refunded');
    expect(migration.errorMessage).toBe('Test error');
  });

  it('should track migration history', async () => {
    // Create multiple migrations
    const migration1 = await caller.migration.initiateMigration({
      amount: 100,
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    await caller.migration.completeMigration({
      migrationId: migration1.migrationId,
      txHash: '0x' + '1'.repeat(64),
    });

    // Wait 1 second to avoid rate limit
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get history
    const history = await caller.migration.getMigrationHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(history[0].amount).toBe(100);
    expect(history[0].status).toBe('completed');
  });

  it('should update migration stats correctly', async () => {
    // Create and complete migration
    const migration1 = await caller.migration.initiateMigration({
      amount: 200,
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    await caller.migration.completeMigration({
      migrationId: migration1.migrationId,
      txHash: '0x' + '1'.repeat(64),
    });

    const stats = await caller.migration.getMigrationStats();
    expect(stats.totalMigrated).toBe(200);
    expect(stats.pendingMigrations).toBe(0);
    expect(stats.totalMigrations).toBe(1);
  });

  it('should record transaction for migration', async () => {
    await caller.migration.initiateMigration({
      amount: 150,
      walletAddress: '0x1234567890123456789012345678901234567890',
    });

    // Verify transaction was recorded
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const transactions = await db
      .select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, testUser.id));

    const migrationTx = transactions.find(tx => tx.type === 'spend_migration');
    expect(migrationTx).toBeDefined();
    expect(migrationTx?.amount).toBe(-150);
  });
});
