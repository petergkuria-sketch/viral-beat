-- SME listing ownership transfers (incubator/accelerator -> SME owner)

CREATE TABLE `listingTransfers` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `listingId` int NOT NULL,
  `fromContributorId` varchar(128) NOT NULL,
  `toEmail` varchar(200) NOT NULL,
  `token` varchar(64) NOT NULL UNIQUE,
  `status` ENUM('pending','accepted','cancelled','expired') NOT NULL DEFAULT 'pending',
  `acceptedByContributorId` varchar(128),
  `acceptedAt` timestamp NULL,
  `expiresAt` timestamp NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);

CREATE INDEX `listingTransfers_listing_idx` ON `listingTransfers` (`listingId`);
CREATE INDEX `listingTransfers_token_idx` ON `listingTransfers` (`token`);
