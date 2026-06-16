CREATE TABLE `newsletterContent` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionId` int NOT NULL,
	`contentType` enum('past_week_highlights','top_creators_spotlight','week_ahead_projections','trending_topics','viral_content','personalized_tips') NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`data` text,
	`personalizationMetadata` text,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletterContent_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterDeliveries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionId` int NOT NULL,
	`userId` int NOT NULL,
	`deliveryStatus` enum('pending','sent','failed','bounced','opened','clicked') NOT NULL DEFAULT 'pending',
	`sentAt` timestamp,
	`openedAt` timestamp,
	`clickedAt` timestamp,
	`errorMessage` text,
	`retryCount` int NOT NULL DEFAULT 0,
	CONSTRAINT `newsletterDeliveries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterEditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`editionNumber` int NOT NULL,
	`weekStartDate` timestamp NOT NULL,
	`weekEndDate` timestamp NOT NULL,
	`generationStatus` enum('pending','generating','completed','failed') NOT NULL DEFAULT 'pending',
	`generatedAt` timestamp,
	`errorMessage` text,
	`metadata` text,
	CONSTRAINT `newsletterEditions_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterEditions_editionNumber_unique` UNIQUE(`editionNumber`)
);
--> statement-breakpoint
CREATE TABLE `newsletterSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`frequency` enum('weekly','biweekly','monthly') NOT NULL DEFAULT 'weekly',
	`nichePreferences` text,
	`platformPreferences` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	`unsubscribeToken` varchar(255),
	CONSTRAINT `newsletterSubscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterSubscriptions_unsubscribeToken_unique` UNIQUE(`unsubscribeToken`)
);
