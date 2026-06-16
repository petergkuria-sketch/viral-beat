ALTER TABLE `aiAssistantProfiles` ADD `youtubeHandle` varchar(100);--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `tiktokHandle` varchar(100);--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `instagramHandle` varchar(100);--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `twitterHandle` varchar(100);--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `youtubeVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `tiktokVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `instagramVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `twitterVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `verificationCode` varchar(20);--> statement-breakpoint
ALTER TABLE `aiAssistantProfiles` ADD `verificationCodeExpiry` timestamp;