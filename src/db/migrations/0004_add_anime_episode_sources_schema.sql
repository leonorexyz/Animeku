-- 1. Create anime_sources table for managing connected local directories, drive folders, or direct stream feeds
CREATE TABLE IF NOT EXISTS `anime_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`anime_id` text NOT NULL,
	`source_type` text NOT NULL,
	`source_name` text NOT NULL,
	`source_path_or_url` text NOT NULL,
	`drive_folder_id` text,
	`total_episodes_detected` integer DEFAULT 0,
	`status` text DEFAULT 'active' NOT NULL,
	`last_synced_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`anime_id`) REFERENCES `anime`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `anime_sources_anime_id_idx` ON `anime_sources` (`anime_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `anime_sources_type_idx` ON `anime_sources` (`source_type`);
--> statement-breakpoint

-- 2. Add extra metadata columns to anime table
ALTER TABLE `anime` ADD `total_episodes` integer DEFAULT 12;
--> statement-breakpoint
ALTER TABLE `anime` ADD `genres` text;
--> statement-breakpoint
ALTER TABLE `anime` ADD `source_type` text DEFAULT 'link';
--> statement-breakpoint
ALTER TABLE `anime` ADD `source_path` text;
--> statement-breakpoint

-- 3. Add extra metadata columns to episodes table
ALTER TABLE `episodes` ADD `file_size` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `episodes` ADD `video_quality` text DEFAULT '1080p';
--> statement-breakpoint

-- 4. Add extra metadata columns to episode_sources table
ALTER TABLE `episode_sources` ADD `anime_id` text;
--> statement-breakpoint
ALTER TABLE `episode_sources` ADD `file_size` integer DEFAULT 0;
--> statement-breakpoint
ALTER TABLE `episode_sources` ADD `file_format` text DEFAULT 'mp4';
--> statement-breakpoint
ALTER TABLE `episode_sources` ADD `drive_file_id` text;
--> statement-breakpoint
ALTER TABLE `episode_sources` ADD `local_path` text;
--> statement-breakpoint
ALTER TABLE `episode_sources` ADD `status` text DEFAULT 'ready';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `episode_sources_anime_id_idx` ON `episode_sources` (`anime_id`);
