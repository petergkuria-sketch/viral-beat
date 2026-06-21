CREATE TABLE IF NOT EXISTS `signalRatings` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `userId` int NOT NULL,
  `messageId` varchar(128) NOT NULL,
  `topic` varchar(512) NOT NULL,
  `geoLayer` varchar(32) NOT NULL,
  `geoScope` varchar(64) NOT NULL,
  `pestelCategory` varchar(32) NOT NULL,
  `rating` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  INDEX `idx_signal_ratings_user_msg` (`userId`, `messageId`),
  INDEX `idx_signal_ratings_pestel` (`pestelCategory`)
);
