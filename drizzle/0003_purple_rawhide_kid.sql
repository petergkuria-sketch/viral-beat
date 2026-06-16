CREATE TABLE `xTrendsCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`category` enum('general','tech','entertainment','sports','politics','business') NOT NULL,
	`trendsData` json,
	`fetchedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `xTrendsCache_id` PRIMARY KEY(`id`)
);
