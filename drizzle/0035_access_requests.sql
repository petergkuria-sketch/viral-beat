-- Access requests (price discovery for hidden paid tiers)

CREATE TABLE `accessRequests` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` varchar(128),
  `email` varchar(200) NOT NULL,
  `tier` ENUM('bronze','premium') NOT NULL,
  `message` text,
  `status` ENUM('new','contacted','closed') NOT NULL DEFAULT 'new',
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
CREATE INDEX `accessRequests_status_idx` ON `accessRequests` (`status`);
