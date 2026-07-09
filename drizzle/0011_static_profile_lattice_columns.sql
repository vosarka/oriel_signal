ALTER TABLE `userStaticProfiles` ADD COLUMN `activations` text;
--> statement-breakpoint
ALTER TABLE `userStaticProfiles` ADD COLUMN `channelStatuses` text;
--> statement-breakpoint
ALTER TABLE `userStaticProfiles` ADD COLUMN `calculationStatus` varchar(32);
--> statement-breakpoint
ALTER TABLE `userStaticProfiles` ADD COLUMN `calculationContext` text;
--> statement-breakpoint
ALTER TABLE `userStaticProfiles` ADD COLUMN `specVersion` varchar(32);