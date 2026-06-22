-- Migration 0027: Schema consolidation (Priority 3)
-- Merges redundant tables identified in architecture review

-- ─── 1. Unify sentiment tables ───────────────────────────────────────────────
-- Add geoType + geoCode to sentimentRecords so it can absorb
-- countySentiments and africaRegionSentiments over time.
-- Existing rows get geoType='national', geoCode='ke' (Kenya national data).

ALTER TABLE sentimentRecords
  ADD COLUMN IF NOT EXISTS geoType VARCHAR(20) NOT NULL DEFAULT 'national',
  ADD COLUMN IF NOT EXISTS geoCode VARCHAR(10) NOT NULL DEFAULT 'ke';

-- ─── 2. Unify content sources ────────────────────────────────────────────────
-- Add scope column to africaContentSources so kenyaContentSources
-- rows can be migrated into it.

ALTER TABLE africaContentSources
  ADD COLUMN IF NOT EXISTS scope VARCHAR(10) NOT NULL DEFAULT 'africa';

-- Migrate Kenya sources into Africa table with scope='ke'
INSERT INTO africaContentSources (name, url, type, scope, createdAt)
SELECT name, url, type, 'ke', createdAt
FROM kenyaContentSources
WHERE url NOT IN (SELECT url FROM africaContentSources);

-- ─── 3. Drop legacy contentSubmissions (replaced by viralSubmissions) ────────
-- Only safe to run after confirming no active foreign keys reference this table.
-- Uncomment when ready:
-- DROP TABLE IF EXISTS contentSubmissions;

-- ─── 4. Add invokeLLM source tracking ────────────────────────────────────────
-- Adds a `source` column to llmCache for per-router logging.

ALTER TABLE llmCache
  ADD COLUMN IF NOT EXISTS source VARCHAR(50) NULL;

-- ─── 5. Merge aiAssistantProfiles → creatorProfiles ──────────────────────────
-- Copy assistant profile preferences into creatorProfiles where a matching
-- userId exists. New columns added to creatorProfiles to hold AI prefs.

ALTER TABLE creatorProfiles
  ADD COLUMN IF NOT EXISTS onboardingCompleted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS niche               VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS primaryPlatform     VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS tone                VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS contentTopics       TEXT         NULL,
  ADD COLUMN IF NOT EXISTS aiGoals             TEXT         NULL,
  ADD COLUMN IF NOT EXISTS aiChallenges        TEXT         NULL;

-- Backfill from aiAssistantProfiles where userId matches
UPDATE creatorProfiles cp
JOIN aiAssistantProfiles ap ON cp.userId = ap.userId
SET
  cp.onboardingCompleted = ap.onboardingCompleted,
  cp.niche               = COALESCE(cp.niche, ap.niche),
  cp.primaryPlatform     = COALESCE(cp.primaryPlatform, ap.primaryPlatform),
  cp.tone                = ap.tone,
  cp.contentTopics       = ap.contentTopics,
  cp.aiGoals             = ap.goals,
  cp.aiChallenges        = ap.challenges
WHERE ap.userId IS NOT NULL;

-- NOTE: After all application code is migrated to read from creatorProfiles,
-- aiAssistantProfiles can be dropped. Kept for now as a safety fallback.
