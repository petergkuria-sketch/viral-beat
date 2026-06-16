import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { tokenMigrations, userTokens, tokenTransactions } from "../../drizzle/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const migrationRouter = router({
  /**
   * Get user's migration history
   */
  getMigrationHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const migrations = await db
      .select()
      .from(tokenMigrations)
      .where(eq(tokenMigrations.userId, ctx.user.id))
      .orderBy(desc(tokenMigrations.createdAt))
      .limit(50);

    return migrations;
  }),

  /**
   * Get migration statistics
   */
  getMigrationStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const migrations = await db
      .select()
      .from(tokenMigrations)
      .where(eq(tokenMigrations.userId, ctx.user.id));

    const totalMigrated = migrations
      .filter((m: typeof migrations[0]) => m.status === "completed")
      .reduce((sum: number, m: typeof migrations[0]) => sum + m.amount, 0);

    const pendingMigrations = migrations.filter((m: typeof migrations[0]) => m.status === "pending" || m.status === "processing").length;

    const failedMigrations = migrations.filter((m: typeof migrations[0]) => m.status === "failed").length;

    return {
      totalMigrated,
      pendingMigrations,
      failedMigrations,
      totalMigrations: migrations.length,
    };
  }),

  /**
   * Initiate a migration from internal VBT to blockchain VBT
   * This deducts the internal balance and creates a pending migration record
   */
  initiateMigration: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive().int(),
        walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { amount, walletAddress } = input;

      // Check rate limiting: max 1 migration per hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentMigrations = await db
        .select()
        .from(tokenMigrations)
        .where(
          and(
            eq(tokenMigrations.userId, ctx.user.id),
            gte(tokenMigrations.createdAt, oneHourAgo)
          )
        );

      if (recentMigrations.length > 0) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "You can only initiate one migration per hour. Please try again later.",
        });
      }

      // Check user's internal VBT balance
      const [userBalance] = await db
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, ctx.user.id));

      if (!userBalance || userBalance.balance < amount) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Insufficient internal VBT balance. You have ${userBalance?.balance || 0} VBT, but tried to migrate ${amount} VBT.`,
        });
      }

      // Minimum migration amount: 10 VBT
      if (amount < 10) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Minimum migration amount is 10 VBT.",
        });
      }

      // Deduct internal VBT balance
      await db
        .update(userTokens)
        .set({
          balance: userBalance.balance - amount,
          totalSpent: userBalance.totalSpent + amount,
        })
        .where(eq(userTokens.userId, ctx.user.id));

      // Record transaction
      await db.insert(tokenTransactions).values({
        userId: ctx.user.id,
        amount: -amount,
        type: "spend_migration",
        description: `Migration to blockchain (${walletAddress.substring(0, 10)}...)`,
        referenceType: "migration",
      });

      // Create migration record
      const [migration] = await db.insert(tokenMigrations).values({
        userId: ctx.user.id,
        amount,
        walletAddress,
        status: "pending",
      });

      return {
        success: true,
        migrationId: migration.insertId,
        amount,
        walletAddress,
        message: "Migration initiated. Please sign the transaction in MetaMask.",
      };
    }),

  /**
   * Complete a migration after blockchain transaction is confirmed
   * This updates the migration status and records the transaction hash
   */
  completeMigration: protectedProcedure
    .input(
      z.object({
        migrationId: z.number().int().positive(),
        txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid transaction hash"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { migrationId, txHash } = input;

      // Get migration record
      const [migration] = await db
        .select()
        .from(tokenMigrations)
        .where(
          and(
            eq(tokenMigrations.id, migrationId),
            eq(tokenMigrations.userId, ctx.user.id)
          )
        );

      if (!migration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Migration not found.",
        });
      }

      if (migration.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Migration is already ${migration.status}.`,
        });
      }

      // Update migration status
      await db
        .update(tokenMigrations)
        .set({
          status: "completed",
          txHash,
          completedAt: new Date(),
        })
        .where(eq(tokenMigrations.id, migrationId));

      return {
        success: true,
        message: "Migration completed successfully!",
        txHash,
      };
    }),

  /**
   * Mark a migration as failed and refund internal VBT
   */
  failMigration: protectedProcedure
    .input(
      z.object({
        migrationId: z.number().int().positive(),
        errorMessage: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const { migrationId, errorMessage } = input;

      // Get migration record
      const [migration] = await db
        .select()
        .from(tokenMigrations)
        .where(
          and(
            eq(tokenMigrations.id, migrationId),
            eq(tokenMigrations.userId, ctx.user.id)
          )
        );

      if (!migration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Migration not found.",
        });
      }

      if (migration.status !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Migration is already ${migration.status}.`,
        });
      }

      // Refund internal VBT balance
      const [userBalance] = await db
        .select()
        .from(userTokens)
        .where(eq(userTokens.userId, ctx.user.id));

      if (userBalance) {
        await db
          .update(userTokens)
          .set({
            balance: userBalance.balance + migration.amount,
            totalSpent: userBalance.totalSpent - migration.amount,
          })
          .where(eq(userTokens.userId, ctx.user.id));

        // Record refund transaction
        await db.insert(tokenTransactions).values({
          userId: ctx.user.id,
          amount: migration.amount,
          type: "refund",
          description: `Migration refund (failed)`,
          referenceType: "migration_refund",
        });
      }

      // Update migration status
      await db
        .update(tokenMigrations)
        .set({
          status: "refunded",
          errorMessage,
        })
        .where(eq(tokenMigrations.id, migrationId));

      return {
        success: true,
        message: "Migration failed and VBT has been refunded.",
        refundedAmount: migration.amount,
      };
    }),
});
