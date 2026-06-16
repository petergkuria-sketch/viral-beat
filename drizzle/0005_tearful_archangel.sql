ALTER TABLE `users` ADD `profileVisibility` enum('public','private') DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `showStats` boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `showActivity` boolean DEFAULT true NOT NULL;