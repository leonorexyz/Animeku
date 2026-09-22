ALTER TABLE `app_settings` ADD `hero_banner_auto_play` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `compact_sidebar` integer DEFAULT false;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `language` text DEFAULT 'id';
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `auto_play_next` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `skip_intro_seconds` integer DEFAULT 85;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `resume_playback` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `auto_sync_drive` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `sync_interval_hours` integer DEFAULT 6;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `cache_limit_mb` integer DEFAULT 500;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `allow_cellular_stream` integer DEFAULT true;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `created_at` text DEFAULT '2026-01-01T00:00:00.000Z';
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `updated_at` text DEFAULT '2026-01-01T00:00:00.000Z';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `app_settings_user_id_unique` ON `app_settings` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `app_settings_user_id_idx` ON `app_settings` (`user_id`);
