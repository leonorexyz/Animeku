ALTER TABLE anime ADD watch_status text DEFAULT 'unwatched';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS anime_watch_status_idx ON anime (watch_status);
