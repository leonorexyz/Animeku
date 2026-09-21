CREATE UNIQUE INDEX IF NOT EXISTS `favorites_user_anime_idx` ON `favorites` (`user_id`, `anime_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `favorites_anime_id_idx` ON `favorites` (`anime_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `episodes_anime_id_idx` ON `episodes` (`anime_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `episodes_anime_number_idx` ON `episodes` (`anime_id`, `episode_number`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `episode_sources_episode_id_idx` ON `episode_sources` (`episode_id`);
