import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// 1. Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  createdAt: text("created_at").notNull(),
});

// 2. Anime table
export const anime = sqliteTable("anime", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  synopsis: text("synopsis").notNull(),
  year: integer("year").notNull(),
  posterUrl: text("poster_url").notNull(),
  coverUrl: text("cover_url").notNull(),
  status: text("status", { enum: ["belum", "sedang", "tamat"] }).notNull().default("belum"),
  isFeatured: integer("is_featured", { mode: "boolean" }).notNull().default(false),
  isFavorite: integer("is_favorite", { mode: "boolean" }).notNull().default(false),
  watchStatus: text("watch_status", {
    enum: ["unwatched", "watching", "completed"],
  }).default("unwatched"),
  rating: text("rating"),
  totalEpisodes: integer("total_episodes").default(12),
  genres: text("genres"),
  sourceType: text("source_type", { enum: ["local", "drive", "link"] }).default("link"),
  sourcePath: text("source_path"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
},
(table) => [
  index("anime_user_id_idx").on(table.userId),
  index("anime_status_idx").on(table.status),
  index("anime_is_favorite_idx").on(table.isFavorite),
  index("anime_watch_status_idx").on(table.watchStatus),
]);

// 3. Episodes table
export const episodes = sqliteTable(
  "episodes",
  {
    id: text("id").primaryKey(),
    animeId: text("anime_id")
      .notNull()
      .references(() => anime.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    episodeNumber: integer("episode_number").notNull(),
    durationSeconds: integer("duration_seconds").notNull().default(0),
    sourceType: text("source_type", { enum: ["local", "drive", "link"] })
      .notNull()
      .default("link"),
    sourceUrl: text("source_url").notNull(),
    thumbnailUrl: text("thumbnail_url"),
    synopsis: text("synopsis"),
    fileSize: integer("file_size").default(0),
    videoQuality: text("video_quality").default("1080p"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("episodes_anime_id_idx").on(table.animeId),
    uniqueIndex("episodes_anime_number_idx").on(table.animeId, table.episodeNumber),
  ]
);

// 3.1 Episode Sources table (multiple video streams/mirrors per episode)
export const episodeSources = sqliteTable(
  "episode_sources",
  {
    id: text("id").primaryKey(),
    episodeId: text("episode_id")
      .notNull()
      .references(() => episodes.id, { onDelete: "cascade" }),
    animeId: text("anime_id").references(() => anime.id, { onDelete: "cascade" }),
    quality: text("quality").default("1080p"),
    sourceType: text("source_type", { enum: ["local", "drive", "link"] }).notNull(),
    sourceUrl: text("source_url").notNull(),
    label: text("label").default("Server Utama"),
    fileSize: integer("file_size").default(0),
    fileFormat: text("file_format").default("mp4"),
    driveFileId: text("drive_file_id"),
    localPath: text("local_path"),
    status: text("status").default("ready"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("episode_sources_episode_id_idx").on(table.episodeId),
    index("episode_sources_anime_id_idx").on(table.animeId),
  ]
);

// 3.2 Anime Sources table (connected folders, drive targets, or stream feed sources)
export const animeSources = sqliteTable(
  "anime_sources",
  {
    id: text("id").primaryKey(),
    animeId: text("anime_id")
      .notNull()
      .references(() => anime.id, { onDelete: "cascade" }),
    sourceType: text("source_type", { enum: ["local", "drive", "link"] }).notNull(),
    sourceName: text("source_name").notNull(),
    sourcePathOrUrl: text("source_path_or_url").notNull(),
    driveFolderId: text("drive_folder_id"),
    totalEpisodesDetected: integer("total_episodes_detected").default(0),
    status: text("status").notNull().default("active"),
    lastSyncedAt: text("last_synced_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("anime_sources_anime_id_idx").on(table.animeId),
    index("anime_sources_type_idx").on(table.sourceType),
  ]
);

// 4. Categories table
export const categories = sqliteTable(
  "categories",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type", { enum: ["category", "genre", "collection"] })
      .notNull()
      .default("category"),
    description: text("description"),
    colorTheme: text("color_theme").default("red"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
  },
  (table) => [
    index("categories_user_id_idx").on(table.userId),
    index("categories_type_idx").on(table.type),
    index("categories_sort_order_idx").on(table.sortOrder),
  ]
);

// 5. Anime-Categories pivot table
export const animeCategories = sqliteTable(
  "anime_categories",
  {
    id: text("id").primaryKey(),
    animeId: text("anime_id")
      .notNull()
      .references(() => anime.id, { onDelete: "cascade" }),
    categoryId: text("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("anime_categories_anime_id_idx").on(table.animeId),
    index("anime_categories_category_id_idx").on(table.categoryId),
    uniqueIndex("anime_categories_unique_idx").on(table.animeId, table.categoryId),
  ]
);

// 6. Watch Progress table
export const watchProgress = sqliteTable("watch_progress", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  animeId: text("anime_id")
    .notNull()
    .references(() => anime.id, { onDelete: "cascade" }),
  episodeId: text("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  positionSeconds: integer("position_seconds").notNull().default(0),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  isCompleted: integer("is_completed", { mode: "boolean" }).notNull().default(false),
  audioTrack: text("audio_track"),
  subtitleTrack: text("subtitle_track"),
  lastWatchedAt: text("last_watched_at").notNull(),
});

// 7. Favorites table
export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    animeId: text("anime_id")
      .notNull()
      .references(() => anime.id, { onDelete: "cascade" }),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("favorites_user_anime_idx").on(table.userId, table.animeId),
    index("favorites_anime_id_idx").on(table.animeId),
  ]
);

// 8. Connected Sources table
export const connectedSources = sqliteTable("connected_sources", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(), // "drive", "local", "link"
  accountLabel: text("account_label").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  createdAt: text("created_at").notNull(),
});

// 9. Search History table
export const searchHistory = sqliteTable(
  "search_history",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    keyword: text("keyword").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("search_history_user_idx").on(table.userId),
    index("search_history_created_idx").on(table.createdAt),
  ]
);

// 10. App Settings table
export const appSettings = sqliteTable(
  "app_settings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
    theme: text("theme").default("netflix"),
    cardSize: text("card_size").default("medium"),
    heroBannerAutoPlay: integer("hero_banner_auto_play", { mode: "boolean" }).default(true),
    compactSidebar: integer("compact_sidebar", { mode: "boolean" }).default(false),
    language: text("language").default("id"),
    defaultSubtitle: text("default_subtitle").default("id"),
    defaultQuality: text("default_quality").default("1080p"),
    playbackSpeed: real("playback_speed").default(1.0),
    autoPlayNext: integer("auto_play_next", { mode: "boolean" }).default(true),
    skipIntroSeconds: integer("skip_intro_seconds").default(85),
    resumePlayback: integer("resume_playback", { mode: "boolean" }).default(true),
    autoSyncDrive: integer("auto_sync_drive", { mode: "boolean" }).default(true),
    syncIntervalHours: integer("sync_interval_hours").default(6),
    cacheLimitMb: integer("cache_limit_mb").default(500),
    allowCellularStream: integer("allow_cellular_stream", { mode: "boolean" }).default(true),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("app_settings_user_id_unique").on(table.userId),
    index("app_settings_user_id_idx").on(table.userId),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  animes: many(anime),
  categories: many(categories),
  watchProgresses: many(watchProgress),
  favorites: many(favorites),
  connectedSources: many(connectedSources),
  searchHistories: many(searchHistory),
  settings: one(appSettings, {
    fields: [users.id],
    references: [appSettings.userId],
  }),
}));

export const animeRelations = relations(anime, ({ one, many }) => ({
  user: one(users, {
    fields: [anime.userId],
    references: [users.id],
  }),
  episodes: many(episodes),
  sources: many(animeSources),
  episodeSources: many(episodeSources),
  animeCategories: many(animeCategories),
  watchProgresses: many(watchProgress),
  favorites: many(favorites),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  anime: one(anime, {
    fields: [episodes.animeId],
    references: [anime.id],
  }),
  sources: many(episodeSources),
  watchProgresses: many(watchProgress),
}));

export const episodeSourcesRelations = relations(episodeSources, ({ one }) => ({
  episode: one(episodes, {
    fields: [episodeSources.episodeId],
    references: [episodes.id],
  }),
  anime: one(anime, {
    fields: [episodeSources.animeId],
    references: [anime.id],
  }),
}));

export const animeSourcesRelations = relations(animeSources, ({ one }) => ({
  anime: one(anime, {
    fields: [animeSources.animeId],
    references: [anime.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  animeCategories: many(animeCategories),
}));

export const animeCategoriesRelations = relations(animeCategories, ({ one }) => ({
  anime: one(anime, {
    fields: [animeCategories.animeId],
    references: [anime.id],
  }),
  category: one(categories, {
    fields: [animeCategories.categoryId],
    references: [categories.id],
  }),
}));

export const watchProgressRelations = relations(watchProgress, ({ one }) => ({
  user: one(users, {
    fields: [watchProgress.userId],
    references: [users.id],
  }),
  anime: one(anime, {
    fields: [watchProgress.animeId],
    references: [anime.id],
  }),
  episode: one(episodes, {
    fields: [watchProgress.episodeId],
    references: [episodes.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  anime: one(anime, {
    fields: [favorites.animeId],
    references: [anime.id],
  }),
}));
