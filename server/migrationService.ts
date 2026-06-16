import { ethers } from 'ethers';
import { getDb } from './db';
import { tokenMigrations } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

// VBToken contract ABI for minting
const VBT_CONTRACT_ABI = [
  'function mintForMigration(address to, uint256 amount, string memory migrationId) public onlyOwner returns (bool)',
  'function balanceOf(address account) public view returns (uint256)',
];

// Configuration
const VBT_CONTRACT_ADDRESS = process.env.VBT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;
const BASE_SEPOLIA_RPC_URL = process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';
const POLLING_INTERVAL_MS = 30000; // 30 seconds

let isServiceRunning = false;

/**
 * Process a single pending migration
 */
async function processMigration(migration: any) {
  const db = await getDb();
  if (!db) {
    console.error('[MigrationService] Database unavailable');
    return false;
  }

  try {
    console.log(`[MigrationService] Processing migration ${migration.id} for ${migration.amount} VBT to ${migration.walletAddress}`);

    // Update status to processing
    await db
      .update(tokenMigrations)
      .set({ status: 'processing' })
      .where(eq(tokenMigrations.id, migration.id));

    // Check if contract is deployed
    if (VBT_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
      console.warn('[MigrationService] VBT contract not deployed yet, skipping migration');
      return false;
    }

    // Check if private key is available
    if (!DEPLOYER_PRIVATE_KEY) {
      console.error('[MigrationService] DEPLOYER_PRIVATE_KEY not set');
      await db
        .update(tokenMigrations)
        .set({
          status: 'failed',
          errorMessage: 'Deployer private key not configured',
        })
        .where(eq(tokenMigrations.id, migration.id));
      return false;
    }

    // Initialize provider and wallet
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(VBT_CONTRACT_ADDRESS, VBT_CONTRACT_ABI, wallet);

    // Convert VBT amount to wei (assuming 18 decimals)
    const amountInWei = ethers.parseUnits(migration.amount.toString(), 18);

    // Call mintForMigration on the smart contract
    const tx = await contract.mintForMigration(
      migration.walletAddress,
      amountInWei,
      migration.id.toString()
    );

    console.log(`[MigrationService] Transaction sent: ${tx.hash}`);

    // Wait for transaction confirmation
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      // Transaction successful
      await db
        .update(tokenMigrations)
        .set({
          status: 'completed',
          txHash: tx.hash,
          completedAt: new Date(),
        })
        .where(eq(tokenMigrations.id, migration.id));

      console.log(`[MigrationService] Migration ${migration.id} completed successfully`);
      return true;
    } else {
      // Transaction failed
      await db
        .update(tokenMigrations)
        .set({
          status: 'failed',
          errorMessage: 'Transaction failed on blockchain',
        })
        .where(eq(tokenMigrations.id, migration.id));

      console.error(`[MigrationService] Migration ${migration.id} transaction failed`);
      return false;
    }
  } catch (error: any) {
    console.error(`[MigrationService] Error processing migration ${migration.id}:`, error);

    // Update migration status to failed
    await db
      .update(tokenMigrations)
      .set({
        status: 'failed',
        errorMessage: error.message || 'Unknown error',
      })
      .where(eq(tokenMigrations.id, migration.id));

    return false;
  }
}

/**
 * Poll for pending migrations and process them
 */
async function pollPendingMigrations() {
  const db = await getDb();
  if (!db) {
    console.error('[MigrationService] Database unavailable');
    return;
  }

  try {
    // Get all pending migrations
    const pendingMigrations = await db
      .select()
      .from(tokenMigrations)
      .where(eq(tokenMigrations.status, 'pending'));

    if (pendingMigrations.length > 0) {
      console.log(`[MigrationService] Found ${pendingMigrations.length} pending migrations`);

      // Process each migration sequentially
      for (const migration of pendingMigrations) {
        await processMigration(migration);
      }
    }
  } catch (error) {
    console.error('[MigrationService] Error polling pending migrations:', error);
  }
}

/**
 * Start the migration monitoring service
 */
export function startMigrationService() {
  if (isServiceRunning) {
    console.log('[MigrationService] Service already running');
    return;
  }

  console.log('[MigrationService] Starting migration monitoring service');
  console.log(`[MigrationService] Contract address: ${VBT_CONTRACT_ADDRESS}`);
  console.log(`[MigrationService] Polling interval: ${POLLING_INTERVAL_MS}ms`);

  isServiceRunning = true;

  // Initial poll
  pollPendingMigrations();

  // Set up polling interval
  const intervalId = setInterval(() => {
    if (isServiceRunning) {
      pollPendingMigrations();
    } else {
      clearInterval(intervalId);
    }
  }, POLLING_INTERVAL_MS);

  console.log('[MigrationService] Service started successfully');
}

/**
 * Stop the migration monitoring service
 */
export function stopMigrationService() {
  if (!isServiceRunning) {
    console.log('[MigrationService] Service not running');
    return;
  }

  console.log('[MigrationService] Stopping migration monitoring service');
  isServiceRunning = false;
}

/**
 * Get service status
 */
export function getMigrationServiceStatus() {
  return {
    isRunning: isServiceRunning,
    contractAddress: VBT_CONTRACT_ADDRESS,
    pollingInterval: POLLING_INTERVAL_MS,
  };
}
