ALTER TABLE `userTokens` ADD `loginStreak` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `userTokens` ADD `lastStreakDate` varchar(10);