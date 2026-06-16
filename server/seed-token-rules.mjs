import { drizzle } from "drizzle-orm/mysql2";
import { mysqlTable, int, varchar, text, boolean, timestamp } from "drizzle-orm/mysql-core";

// Define tokenEarningRules table inline
const tokenEarningRules = mysqlTable("tokenEarningRules", {
  id: int("id").autoincrement().primaryKey(),
  actionType: varchar("actionType", { length: 100 }).notNull().unique(),
  tokenAmount: int("tokenAmount").notNull(),
  description: text("description").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

const db = drizzle(process.env.DATABASE_URL);

const rules = [
  {
    actionType: "thread_creation",
    tokenAmount: 50,
    description: "Create a new thread in Developer Hub",
    isActive: true,
  },
  {
    actionType: "post_reply",
    tokenAmount: 20,
    description: "Reply to a thread or post",
    isActive: true,
  },
  {
    actionType: "upvote_received",
    tokenAmount: 10,
    description: "Receive an upvote on your thread",
    isActive: true,
  },
  {
    actionType: "daily_login",
    tokenAmount: 5,
    description: "Daily login bonus",
    isActive: true,
  },
  {
    actionType: "feature_implementation",
    tokenAmount: 500,
    description: "Implement an approved feature request",
    isActive: true,
  },
  {
    actionType: "bug_report",
    tokenAmount: 100,
    description: "Report a verified bug",
    isActive: true,
  },
];

async function seedTokenRules() {
  console.log("Seeding token earning rules...");
  
  for (const rule of rules) {
    try {
      await db.insert(tokenEarningRules).values(rule).onDuplicateKeyUpdate({
        set: {
          tokenAmount: rule.tokenAmount,
          description: rule.description,
          isActive: rule.isActive,
        },
      });
      console.log(`✓ Seeded rule: ${rule.actionType} (${rule.tokenAmount} tokens)`);
    } catch (error) {
      console.error(`✗ Failed to seed rule ${rule.actionType}:`, error.message);
    }
  }
  
  console.log("Token earning rules seeded successfully!");
  process.exit(0);
}

seedTokenRules().catch((error) => {
  console.error("Failed to seed token rules:", error);
  process.exit(1);
});
