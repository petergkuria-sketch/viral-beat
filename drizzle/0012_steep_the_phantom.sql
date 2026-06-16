CREATE TABLE `haaLeaderboard` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`totalSubmissions` int NOT NULL DEFAULT 0,
	`acceptedSubmissions` int NOT NULL DEFAULT 0,
	`rejectedSubmissions` int NOT NULL DEFAULT 0,
	`verifiedViralCount` int NOT NULL DEFAULT 0,
	`trendingDiscoveries` int NOT NULL DEFAULT 0,
	`totalVbtEarned` int NOT NULL DEFAULT 0,
	`acceptanceRate` int NOT NULL DEFAULT 0,
	`rank` int NOT NULL DEFAULT 0,
	`lastSubmissionAt` timestamp,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `haaLeaderboard_id` PRIMARY KEY(`id`),
	CONSTRAINT `haaLeaderboard_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `submissionMetadata` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`views` bigint NOT NULL DEFAULT 0,
	`likes` int NOT NULL DEFAULT 0,
	`shares` int NOT NULL DEFAULT 0,
	`comments` int NOT NULL DEFAULT 0,
	`growthRate` int NOT NULL DEFAULT 0,
	`peakDate` timestamp,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `submissionMetadata_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `submissionVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`submissionId` int NOT NULL,
	`userId` int NOT NULL,
	`vote` enum('upvote','downvote') NOT NULL,
	`reason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `submissionVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `viralSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentUrl` text NOT NULL,
	`platform` enum('tiktok','youtube','twitter','instagram','facebook','linkedin','reddit','other') NOT NULL,
	`category` enum('entertainment','education','news','tech','lifestyle','business','art','music','gaming','sports','other') NOT NULL,
	`title` text,
	`description` text,
	`thumbnailUrl` text,
	`submitterAnalysis` text,
	`viralityScore` int NOT NULL DEFAULT 0,
	`status` enum('pending','accepted','rejected','verified_viral','spam') NOT NULL DEFAULT 'pending',
	`vbtAwarded` int NOT NULL DEFAULT 0,
	`submittedAt` timestamp NOT NULL DEFAULT (now()),
	`verifiedAt` timestamp,
	CONSTRAINT `viralSubmissions_id` PRIMARY KEY(`id`)
);
