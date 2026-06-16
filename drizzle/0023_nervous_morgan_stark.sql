CREATE TABLE `telegramAlertLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chatId` varchar(255) NOT NULL,
	`alertType` enum('trend_alert','daily_briefing','weekly_summary','viral_opportunity','goal_reminder','token_earned') NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`deliveryStatus` enum('sent','failed') NOT NULL DEFAULT 'sent',
	`errorMessage` text,
	CONSTRAINT `telegramAlertLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `telegramAlertPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enableTrendAlerts` boolean NOT NULL DEFAULT true,
	`enableDailyBriefing` boolean NOT NULL DEFAULT true,
	`enableWeeklySummary` boolean NOT NULL DEFAULT true,
	`maxAlertsPerDay` int NOT NULL DEFAULT 5,
	`minViralityScore` int NOT NULL DEFAULT 70,
	`briefingTime` varchar(5) NOT NULL DEFAULT '08:00',
	`timezone` varchar(50) NOT NULL DEFAULT 'UTC',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `telegramAlertPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegramAlertPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `telegramConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`chatId` varchar(255) NOT NULL,
	`username` varchar(255),
	`firstName` varchar(255),
	`lastName` varchar(255),
	`isActive` boolean NOT NULL DEFAULT true,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`lastInteractionAt` timestamp,
	CONSTRAINT `telegramConnections_id` PRIMARY KEY(`id`),
	CONSTRAINT `telegramConnections_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `telegramConnections_chatId_unique` UNIQUE(`chatId`)
);
