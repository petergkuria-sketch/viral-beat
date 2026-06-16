CREATE TABLE `creatorStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`subscriberCount` bigint,
	`totalViews` bigint,
	`videoCount` int,
	`avgViews` bigint,
	`engagementRate` varchar(20),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creatorStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creators` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`handle` varchar(255),
	`platform` enum('youtube','tiktok') NOT NULL,
	`platformId` varchar(255),
	`avatarUrl` text,
	`subscriberCount` bigint,
	`totalViews` bigint,
	`videoCount` int,
	`description` text,
	`country` varchar(100),
	`joinedDate` varchar(100),
	`badges` json,
	`links` json,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `creators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`topic` varchar(255) NOT NULL,
	`platform` enum('all','youtube','tiktok') NOT NULL DEFAULT 'all',
	`viralityScore` varchar(10),
	`thumbnail` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentimentCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`topic` varchar(255) NOT NULL,
	`platform` enum('all','youtube','tiktok') NOT NULL DEFAULT 'all',
	`positive` int NOT NULL,
	`negative` int NOT NULL,
	`neutral` int NOT NULL,
	`emotions` json,
	`summary` text,
	`analyzedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentimentCache_id` PRIMARY KEY(`id`)
);
