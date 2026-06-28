-- OSS (One-Stop-Shop) community contributions

CREATE TABLE `ossSubmissions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `countryCode` varchar(3) NOT NULL,
  `countryName` varchar(100) NOT NULL,
  `kind` ENUM('new','update') NOT NULL DEFAULT 'new',
  `name` varchar(200) NOT NULL,
  `acronym` varchar(40),
  `mandate` text,
  `location` varchar(255),
  `website` varchar(255),
  `operatingHours` varchar(120),
  `legalBasis` varchar(255),
  `established` int,
  `services` json,
  `offers` json,
  `linkedZones` json,
  `sourceUrl` varchar(500),
  `notes` text,
  `contributorId` varchar(128),
  `contributorName` varchar(160),
  `contributorEmail` varchar(200),
  `status` ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewNote` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);

CREATE INDEX `ossSubmissions_country_idx` ON `ossSubmissions` (`countryCode`);
CREATE INDEX `ossSubmissions_status_idx` ON `ossSubmissions` (`status`);
