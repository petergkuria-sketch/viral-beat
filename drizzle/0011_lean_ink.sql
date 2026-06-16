CREATE TABLE `contentAnalytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`totalSubmissions` int NOT NULL DEFAULT 0,
	`humanContent` int NOT NULL DEFAULT 0,
	`aiContent` int NOT NULL DEFAULT 0,
	`humanPercentage` int NOT NULL DEFAULT 0,
	`tier1Count` int NOT NULL DEFAULT 0,
	`tier2Count` int NOT NULL DEFAULT 0,
	`tier3Count` int NOT NULL DEFAULT 0,
	`tier4Count` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contentAnalytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentType` enum('forum_thread','forum_post','article','video_script','social_post') NOT NULL,
	`contentId` int,
	`aiUsageLevel` enum('none','minor','moderate','heavy','full') NOT NULL,
	`aiToolsUsed` text,
	`verificationStatus` enum('pending','verified','flagged','rejected') NOT NULL DEFAULT 'pending',
	`rewardTier` enum('tier1','tier2','tier3','tier4') NOT NULL,
	`baseReward` int NOT NULL,
	`multiplier` int NOT NULL,
	`bonusReward` int NOT NULL DEFAULT 0,
	`totalVbtAwarded` int NOT NULL,
	`engagementScore` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('ai_assisted','human_created','verified_human','premium_human') NOT NULL DEFAULT 'ai_assisted',
	`verificationStatus` enum('unverified','pending','verified','rejected') NOT NULL DEFAULT 'unverified',
	`kycVerified` boolean NOT NULL DEFAULT false,
	`portfolioUrl` text,
	`bio` text,
	`totalContentSubmitted` int NOT NULL DEFAULT 0,
	`humanContentCount` int NOT NULL DEFAULT 0,
	`aiContentCount` int NOT NULL DEFAULT 0,
	`vouchCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creatorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `creatorProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `verificationVouches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`voucherId` int NOT NULL,
	`status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `verificationVouches_id` PRIMARY KEY(`id`)
);
