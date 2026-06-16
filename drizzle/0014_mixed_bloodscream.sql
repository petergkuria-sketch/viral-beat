CREATE TABLE `governanceProposals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`creatorId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`type` enum('feature_request','reward_rate_change','policy_update','other') NOT NULL,
	`options` json NOT NULL,
	`status` enum('active','approved','rejected','executed') NOT NULL DEFAULT 'active',
	`votingEndsAt` timestamp NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governanceProposals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `governanceVotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`proposalId` int NOT NULL,
	`voterId` int NOT NULL,
	`option` varchar(255) NOT NULL,
	`tokenWeight` int NOT NULL,
	`votedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `governanceVotes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenListings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sellerId` int NOT NULL,
	`amount` int NOT NULL,
	`pricePerToken` decimal(10,2) NOT NULL,
	`status` enum('active','sold','cancelled') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tokenListings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenStakes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`duration` int NOT NULL,
	`apy` int NOT NULL,
	`startDate` timestamp NOT NULL DEFAULT (now()),
	`endDate` timestamp NOT NULL,
	`status` enum('active','completed','cancelled') NOT NULL DEFAULT 'active',
	`rewardsClaimed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenStakes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenSupplyEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`eventType` enum('mint','burn') NOT NULL,
	`amount` int NOT NULL,
	`source` varchar(255) NOT NULL,
	`userId` int,
	`description` text,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenSupplyEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tokenTrades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listingId` int NOT NULL,
	`buyerId` int NOT NULL,
	`sellerId` int NOT NULL,
	`amount` int NOT NULL,
	`pricePerToken` decimal(10,2) NOT NULL,
	`totalPrice` decimal(10,2) NOT NULL,
	`platformFee` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tokenTrades_id` PRIMARY KEY(`id`)
);
