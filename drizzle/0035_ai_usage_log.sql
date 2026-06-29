-- AI request telemetry (one row per provider call via the orchestrator)

CREATE TABLE `aiUsageLog` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `provider` varchar(32) NOT NULL,
  `model` varchar(80),
  `taskType` varchar(40),
  `tokensIn` int NOT NULL DEFAULT 0,
  `tokensOut` int NOT NULL DEFAULT 0,
  `costUsd` decimal(12,6) NOT NULL DEFAULT 0,
  `latencyMs` int NOT NULL DEFAULT 0,
  `status` ENUM('success','failure') NOT NULL,
  `errorMessage` varchar(500),
  `userId` varchar(128),
  `createdAt` timestamp NOT NULL DEFAULT (now())
);

CREATE INDEX `aiUsageLog_provider_idx` ON `aiUsageLog` (`provider`);
CREATE INDEX `aiUsageLog_created_idx` ON `aiUsageLog` (`createdAt`);
CREATE INDEX `aiUsageLog_user_idx` ON `aiUsageLog` (`userId`);
