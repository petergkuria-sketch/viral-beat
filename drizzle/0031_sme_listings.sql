-- SME Exchange listings (Phase 1 IPO onboarding)

CREATE TABLE `smeListings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(200) NOT NULL,
  `sector` varchar(100) NOT NULL,
  `countryCode` varchar(3) NOT NULL,
  `countryName` varchar(100) NOT NULL,
  `location` varchar(255),
  `website` varchar(255),
  `foundedYear` int,
  `ownership` varchar(120),
  `employees` varchar(60),
  `summary` text,
  `products` text,
  `governance` int DEFAULT 0,
  `financial` int DEFAULT 0,
  `innovation` int DEFAULT 0,
  `market` int DEFAULT 0,
  `ers` int DEFAULT 0,
  `statusTags` json,
  `certifications` json,
  `exportMarkets` json,
  `awards` json,
  `contactName` varchar(160),
  `contactEmail` varchar(200),
  `contactPhone` varchar(60),
  `contributorId` varchar(128),
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewNote` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX `smeListings_country_idx` ON `smeListings` (`countryCode`);
CREATE INDEX `smeListings_status_idx` ON `smeListings` (`status`);
