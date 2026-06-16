CREATE TABLE `tokenEarningRules` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actionType` varchar(100) NOT NULL,
	`tokenAmount` int NOT NULL,
	`description` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tokenEarningRules_id` PRIMARY KEY(`id`),
	CONSTRAINT `tokenEarningRules_actionType_unique` UNIQUE(`actionType`)
);
--> statement-breakpoint
CREATE TABLE `tokenTransactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`type` enum('earn_thread_creation','earn_post_reply','earn_upvote_received','earn_feature_implementation','earn_bug_report','earn_daily_login','earn_referral','earn_admin_grant','spend_ai_agent','spend_analytics','spend_boost','spend_premium_feature','refund') NOT NULL,
	`description` text NOT NULL,
	`referenceId` int,
	`referenceType` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenTransactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userTokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`balance` int NOT NULL DEFAULT 0,
	`totalEarned` int NOT NULL DEFAULT 0,
	`totalSpent` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userTokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `userTokens_userId_unique` UNIQUE(`userId`)
);
