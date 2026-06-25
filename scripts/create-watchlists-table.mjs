// Run: node scripts/create-watchlists-table.mjs
// Creates signalWatchlists table — additive only, no risk to existing data.
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env") });

const url = process.env.DATABASE_URL;
if (!url) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(url);

await conn.execute(`
  CREATE TABLE IF NOT EXISTS signalWatchlists (
    id                INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    watchId           VARCHAR(36) NOT NULL UNIQUE,
    userId            INT NOT NULL,
    label             VARCHAR(200) NOT NULL,
    countryCodes      JSON NOT NULL DEFAULT (JSON_ARRAY()),
    pestelDims        JSON NOT NULL DEFAULT (JSON_ARRAY()),
    sector            VARCHAR(100),
    keywords          JSON NOT NULL DEFAULT (JSON_ARRAY()),
    thresholdSeverity ENUM('normal','alert','breaking') NOT NULL DEFAULT 'alert',
    isActive          BOOLEAN NOT NULL DEFAULT TRUE,
    triggerCount      INT NOT NULL DEFAULT 0,
    lastTriggeredAt   TIMESTAMP NULL,
    createdAt         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX signalWatchlists_user_idx (userId),
    INDEX signalWatchlists_active_idx (isActive)
  )
`);

console.log("✓ signalWatchlists table created (or already exists)");
await conn.end();
