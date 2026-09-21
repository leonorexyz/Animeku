import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
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
  rating: text("rating"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 3. Episodes table
export const episodes = sqliteTable("episodes", {
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
  createdAt: text("created_at").notNull(),
});

// 3.1 Episode Sources table (multiple video streams/mirrors per episode)
export const episodeSources = sqliteTable("episode_sources", {
  id: text("id").primaryKey(),
  episodeId: text("episode_id")
    .notNull()
    .references(() => episodes.id, { onDelete: "cascade" }),
  quality: text("quality").default("1080p"),
  sourceType: text("source_type", { enum: ["local", "drive", "link"] }).notNull(),
  sourceUrl: text("source_url").notNull(),
  label: text("label").default("Server Utama"),
  createdAt: text("created_at").notNull(),
});

// 4. Categories table
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: text("type").notNull().default("category"), // "category" | "genre"
  sortOrder: integer("sort_order").notNull().default(0),
});

// 5. Anime-Categories pivot table
export const animeCategories = sqliteTable("anime_categories", {
  id: text("id").primaryKey(),
  animeId: text("anime_id")
    .notNull()
    .references(() => anime.id, { onDelete: "cascade" }),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
});

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
export const favorites = sqliteTable("favorites", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  animeId: text("anime_id")
    .notNull()
    .references(() => anime.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull(),
});

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
export const searchHistory = sqliteTable("search_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  keyword: text("keyword").notNull(),
  createdAt: text("created_at").notNull(),
});

// 10. App Settings table
export const appSettings = sqliteTable("app_settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("dark"),
  cardSize: text("card_size").default("medium"),
  defaultSubtitle: text("default_subtitle").default("id"),
  defaultQuality: text("default_quality").default("1080p"),
  playbackSpeed: real("playback_speed").default(1.0),
});

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
