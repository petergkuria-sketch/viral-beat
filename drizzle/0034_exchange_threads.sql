-- SME Exchange investor↔SME safe contact: intros + in-platform messages

CREATE TABLE `exchangeIntros` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `listingId` int NOT NULL,
  `investorId` varchar(128) NOT NULL,
  `investorName` varchar(160),
  `investorOrg` varchar(200),
  `investorType` ENUM('dfi','pe_vc','angel','strategic','other') NOT NULL DEFAULT 'other',
  `intent` ENUM('collaboration','supply_chain','capital') NOT NULL,
  `status` ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX `exchangeIntros_listing_idx` ON `exchangeIntros` (`listingId`);
CREATE INDEX `exchangeIntros_investor_idx` ON `exchangeIntros` (`investorId`);

CREATE TABLE `exchangeMessages` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `introId` int NOT NULL,
  `senderId` varchar(128) NOT NULL,
  `senderRole` ENUM('investor','sme') NOT NULL,
  `body` text NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now())
);
CREATE INDEX `exchangeMessages_intro_idx` ON `exchangeMessages` (`introId`);
