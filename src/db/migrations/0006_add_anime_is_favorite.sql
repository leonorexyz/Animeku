ALTER TABLE `anime` ADD `is_favorite` integer DEFAULT false NOT NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `anime_is_favorite_idx` ON `anime` (`is_favorite`);
