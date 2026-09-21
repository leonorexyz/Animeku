CREATE TABLE `episode_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`episode_id` text NOT NULL,
	`quality` text DEFAULT '1080p',
	`source_type` text NOT NULL,
	`source_url` text NOT NULL,
	`label` text DEFAULT 'Server Utama',
	`created_at` text NOT NULL,
	FOREIGN KEY (`episode_id`) REFERENCES `episodes`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `episodes` ADD `synopsis` text;--> statement-breakpoint
ALTER TABLE `watch_progress` ADD `audio_track` text;--> statement-breakpoint
ALTER TABLE `watch_progress` ADD `subtitle_track` text;