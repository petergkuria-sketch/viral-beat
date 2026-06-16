CREATE TABLE `constituencies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`county` varchar(100) NOT NULL,
	`region` varchar(100),
	`registeredVoters` int,
	`currentMpId` int,
	`dominantParty` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `constituencies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `county_sentiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`countyName` varchar(100) NOT NULL,
	`countyCode` int,
	`sentimentScore` decimal(5,2) NOT NULL,
	`hateSpeechCount` int NOT NULL DEFAULT 0,
	`riskLevel` enum('low','medium','high','critical') NOT NULL DEFAULT 'low',
	`population` int,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `county_sentiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `election_phases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`phaseType` enum('pre_election','campaign','local_mobilization','election_day','post_election') NOT NULL,
	`description` text,
	`startDate` timestamp,
	`endDate` timestamp,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'no',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `election_phases_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `executive_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`position` enum('president','deputy_president','prime_cabinet_secretary','cabinet_secretary','attorney_general','secretary_cabinet') NOT NULL,
	`ministry` varchar(255),
	`party` varchar(100),
	`county` varchar(100),
	`imageUrl` text,
	`bio` text,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`appointedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `executive_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hate_speech_analyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`inputText` text NOT NULL,
	`speakerInfo` varchar(255),
	`contextInfo` varchar(255),
	`totalScore` int NOT NULL,
	`riskLevel` enum('Low','Moderate','High','Critical') NOT NULL,
	`contextScore` int NOT NULL,
	`speakerScore` int NOT NULL,
	`intentScore` int NOT NULL,
	`contentScore` int NOT NULL,
	`extentScore` int NOT NULL,
	`likelihoodScore` int NOT NULL,
	`detectedTerms` json,
	`languageAnalysis` json,
	`verdict` text,
	`actorType` enum('executive','parliament','senate','party','other'),
	`actorId` int,
	`phaseId` int,
	`county` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hate_speech_analyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kenya_content_sources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sourceType` enum('news','twitter','facebook','manual') NOT NULL,
	`title` varchar(500),
	`content` text NOT NULL,
	`url` text,
	`author` varchar(255),
	`publishedAt` timestamp,
	`sentimentScore` decimal(5,2),
	`hateSpeechRisk` enum('Low','Moderate','High','Critical'),
	`relatedFigureId` int,
	`relatedCounty` varchar(100),
	`actorType` enum('executive','parliament','senate','party','other'),
	`actorId` int,
	`phaseId` int,
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `kenya_content_sources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `parliament_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(100),
	`memberType` enum('constituency','women_rep','nominated') NOT NULL,
	`constituency` varchar(255),
	`county` varchar(100) NOT NULL,
	`party` varchar(100),
	`coalition` varchar(100),
	`imageUrl` text,
	`bio` text,
	`committees` json,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`electedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `parliament_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `phase_sentiments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phaseId` int NOT NULL,
	`actorType` enum('executive','parliament','senate','party','county') NOT NULL,
	`actorId` int NOT NULL,
	`sentimentScore` decimal(5,2) NOT NULL,
	`positiveCount` int NOT NULL DEFAULT 0,
	`negativeCount` int NOT NULL DEFAULT 0,
	`neutralCount` int NOT NULL DEFAULT 0,
	`supportLevel` decimal(5,2),
	`engagementCount` int DEFAULT 0,
	`source` varchar(100),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `phase_sentiments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `political_figures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(255),
	`party` varchar(255),
	`imageUrl` text,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `political_figures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `political_parties` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`abbreviation` varchar(20),
	`coalition` varchar(100),
	`leader` varchar(255),
	`logoUrl` text,
	`color` varchar(20),
	`memberCount` int,
	`foundedYear` int,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `political_parties_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `regional_support` (
	`id` int AUTO_INCREMENT NOT NULL,
	`phaseId` int,
	`county` varchar(100) NOT NULL,
	`constituency` varchar(255),
	`region` varchar(100),
	`dominantParty` varchar(100),
	`dominantCoalition` varchar(100),
	`supportScore` decimal(5,2),
	`voterTurnoutEstimate` decimal(5,2),
	`hateSpeechIntensity` enum('low','medium','high','critical') DEFAULT 'low',
	`mobilizationLevel` enum('dormant','emerging','active','intense') DEFAULT 'dormant',
	`keyIssues` json,
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `regional_support_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `senate_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`title` varchar(100),
	`memberType` enum('elected','women_nominated','youth','pwd') NOT NULL,
	`county` varchar(100) NOT NULL,
	`party` varchar(100),
	`coalition` varchar(100),
	`imageUrl` text,
	`bio` text,
	`committees` json,
	`isActive` enum('yes','no') NOT NULL DEFAULT 'yes',
	`electedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `senate_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sentiment_records` (
	`id` int AUTO_INCREMENT NOT NULL,
	`figureId` int NOT NULL,
	`sentimentScore` decimal(5,2) NOT NULL,
	`positiveCount` int NOT NULL DEFAULT 0,
	`negativeCount` int NOT NULL DEFAULT 0,
	`neutralCount` int NOT NULL DEFAULT 0,
	`source` varchar(100),
	`recordedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sentiment_records_id` PRIMARY KEY(`id`)
);
