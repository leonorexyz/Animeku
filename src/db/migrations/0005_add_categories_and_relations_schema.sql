ALTER TABLE `categories` ADD `description` text;
--> statement-breakpoint
ALTER TABLE `categories` ADD `color_theme` text DEFAULT 'red';
--> statement-breakpoint
ALTER TABLE `categories` ADD `created_at` text;
--> statement-breakpoint
ALTER TABLE `categories` ADD `updated_at` text;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `categories_user_id_idx` ON `categories` (`user_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `categories_type_idx` ON `categories` (`type`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `categories_sort_order_idx` ON `categories` (`sort_order`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `anime_categories_anime_id_idx` ON `anime_categories` (`anime_id`);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `anime_categories_category_id_idx` ON `anime_categories` (`category_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `anime_categories_unique_idx` ON `anime_categories` (`anime_id`, `category_id`);
