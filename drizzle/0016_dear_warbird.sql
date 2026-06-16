CREATE TABLE `tokenMigrations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`amount` int NOT NULL,
	`txHash` varchar(255),
	`status` enum('pending','processing','completed','failed','refunded') NOT NULL DEFAULT 'pending',
	`walletAddress` varchar(255) NOT NULL,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `tokenMigrations_id` PRIMARY KEY(`id`)
);
