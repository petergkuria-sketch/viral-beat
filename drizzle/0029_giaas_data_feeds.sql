-- GIaaS Data Feeds: public document and URL submissions for agent context building

CREATE TABLE `giaasDataFeeds` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `feedId` varchar(36) NOT NULL UNIQUE,
  `submittedBy` int,
  `feedType` ENUM('url','document_url','text') NOT NULL,
  `url` text,
  `documentUrl` text,
  `textContent` text,
  `title` varchar(255),
  `description` varchar(500),
  `countryHints` json,
  `sectorHints` json,
  `status` ENUM('pending','ingested','failed') NOT NULL DEFAULT 'pending',
  `ingestedAt` timestamp NULL,
  `projectsCreated` int DEFAULT 0,
  `errorMessage` text,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `giaasDataFeeds_status_idx` (`status`),
  INDEX `giaasDataFeeds_user_idx` (`submittedBy`)
);
