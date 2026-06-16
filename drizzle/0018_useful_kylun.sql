CREATE TABLE `aiAssistantProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`niche` varchar(100),
	`primaryPlatform` enum('youtube','tiktok','instagram','twitter'),
	`audienceSize` int,
	`averageViews` int,
	`contentStyle` text,
	`goals` text,
	`challenges` text,
	`successPatterns` text,
	`preferredHashtags` text,
	`optimalPostingTimes` text,
	`onboardingCompleted` boolean NOT NULL DEFAULT false,
	`lastAnalyzedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiAssistantProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `aiAssistantProfiles_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `assistantConversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sessionId` varchar(64) NOT NULL,
	`role` enum('user','assistant','system') NOT NULL,
	`message` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assistantConversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assistantTasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`taskType` enum('analyze_content','find_trends','optimize_post','competitor_analysis','content_calendar','performance_report') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`input` text,
	`output` text,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `assistantTasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contentAnalyses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`contentTitle` varchar(500) NOT NULL,
	`contentUrl` text,
	`contentType` enum('video','image','text','audio') NOT NULL,
	`platform` enum('youtube','tiktok','instagram','twitter') NOT NULL,
	`viralityScore` decimal(3,1),
	`strengths` text,
	`weaknesses` text,
	`recommendations` text,
	`predictedPerformance` text,
	`optimizedTitle` text,
	`optimizedHashtags` text,
	`optimalPostTime` timestamp,
	`analysisType` enum('pre_publish','post_publish','competitor') NOT NULL,
	`actualPerformance` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contentAnalyses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creatorGoals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`goalType` enum('followers','views','engagement','revenue','custom') NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`targetValue` int NOT NULL,
	`currentValue` int NOT NULL DEFAULT 0,
	`deadline` timestamp,
	`status` enum('active','completed','abandoned') NOT NULL DEFAULT 'active',
	`milestones` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `creatorGoals_id` PRIMARY KEY(`id`)
);
