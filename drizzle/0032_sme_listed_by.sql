-- SME listing attribution (self / incubator / accelerator)

ALTER TABLE `smeListings`
  ADD COLUMN `listedByType` ENUM('self','incubator','accelerator') NOT NULL DEFAULT 'self',
  ADD COLUMN `listedByOrg` varchar(200);
