CREATE INDEX IF NOT EXISTS `search_history_user_idx` ON `search_history` (`user_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `search_history_created_idx` ON `search_history` (`created_at`);
