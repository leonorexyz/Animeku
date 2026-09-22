import { db } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import { runMigrations } from "./migrate";
import { MOCK_CATEGORIES, MOCK_FEATURED_ANIMES } from "@/data/mockAnime";
import { MOCK_EPISODES } from "@/data/mockEpisodes";

export async function seedDatabase() {
  await runMigrations();

  const defaultUserId = "user-default";

  // Ensure default user settings exist
  try {
    const existingSettings = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.userId, defaultUserId))
      .limit(1);

    if (existingSettings.length === 0) {
      const now = new Date().toISOString();
      await db
        .insert(schema.appSettings)
        .values({
          id: `settings-${defaultUserId}`,
          userId: defaultUserId,
          theme: "netflix",
          cardSize: "medium",
          heroBannerAutoPlay: true,
          compactSidebar: false,
          language: "id",
          defaultSubtitle: "id",
          defaultQuality: "1080p",
          playbackSpeed: 1.0,
          autoPlayNext: true,
          skipIntroSeconds: 85,
          resumePlayback: true,
          autoSyncDrive: true,
          syncIntervalHours: 6,
          cacheLimitMb: 500,
          allowCellularStream: true,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing();
    }
  } catch (err) {
    console.error("Error ensuring default appSettings:", err);
  }

  // Check if anime catalog already exists
  try {
    const existing = await db.select().from(schema.anime).limit(1);
    if (existing.length > 0) {
      console.log("Database already has anime catalog, skipping seed.");
      return;
    }
  } catch (err) {
    console.error("Error checking existing anime:", err);
  }

  // Create default guest user
  const defaultUser = {
    id: "user-default",
    name: "Pengguna Animeku",
    email: "user@animeku.local",
    image: null,
    createdAt: new Date().toISOString(),
  };

  try {
    await db.insert(schema.users).values(defaultUser).onConflictDoNothing();
  } catch (e) {}

  // Insert categories
  for (const cat of MOCK_CATEGORIES) {
    try {
      await db
        .insert(schema.categories)
        .values({
          id: cat.id,
          userId: defaultUser.id,
          name: cat.name,
          type: (cat.type as "category" | "genre" | "collection") || "category",
          description: `Kategori kurasi: ${cat.name}`,
          colorTheme: cat.id.includes("action") ? "amber" : cat.id.includes("drama") ? "rose" : cat.id.includes("weekend") ? "purple" : "red",
          sortOrder: cat.sortOrder || 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoNothing();
    } catch (e) {}
  }

  // Insert all anime
  const insertedAnimeIds = new Set<string>();
  const allAnimes = [...MOCK_FEATURED_ANIMES];
  MOCK_CATEGORIES.forEach((cat) => {
    cat.items.forEach((item) => allAnimes.push(item));
  });

  for (const a of allAnimes) {
    if (insertedAnimeIds.has(a.id)) continue;
    insertedAnimeIds.add(a.id);

    try {
      await db
        .insert(schema.anime)
        .values({
          id: a.id,
          userId: defaultUser.id,
          title: a.title,
          synopsis: a.synopsis,
          year: a.year,
          posterUrl: a.posterUrl,
          coverUrl: a.coverUrl,
          status: (a.status as "belum" | "sedang" | "tamat") || "belum",
          isFeatured: !!a.isFeatured,
          rating: a.rating || "8.5",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .onConflictDoNothing();

      // Link anime to categories
      for (const cat of MOCK_CATEGORIES) {
        if (cat.items.some((item) => item.id === a.id)) {
          await db
            .insert(schema.animeCategories)
            .values({
              id: `ac-${a.id}-${cat.id}`,
              animeId: a.id,
              categoryId: cat.id,
            })
            .onConflictDoNothing();
        }
      }

      // Insert episodes for this anime
      const eps = MOCK_EPISODES[a.id] || [];
      for (const ep of eps) {
        await db
          .insert(schema.episodes)
          .values({
            id: ep.id,
            animeId: a.id,
            title: ep.title,
            episodeNumber: ep.episodeNumber,
            durationSeconds: ep.durationSeconds || 1440,
            sourceType: (ep.sourceType as "local" | "drive" | "link") || "link",
            sourceUrl: ep.sourceUrl,
            thumbnailUrl: ep.thumbnailUrl,
            synopsis: (ep as any).synopsis || `Episode ${ep.episodeNumber} dari ${a.title}.`,
            createdAt: new Date().toISOString(),
          })
          .onConflictDoNothing();

        // Seed default episode source
        await db
          .insert(schema.episodeSources)
          .values({
            id: `src-${ep.id}-main`,
            episodeId: ep.id,
            sourceType: (ep.sourceType as "local" | "drive" | "link") || "link",
            sourceUrl: ep.sourceUrl,
            quality: "1080p",
            label: "Server Utama (HD)",
            createdAt: new Date().toISOString(),
          })
          .onConflictDoNothing();
      }
    } catch (err) {
      console.error(`Error inserting anime ${a.id}:`, err);
    }
  }

  // Seed sample favorites for default user
  for (const favId of ["snk", "jujutsu-kaisen", "frieren"]) {
    try {
      await db
        .insert(schema.favorites)
        .values({
          id: `fav-${defaultUser.id}-${favId}`,
          userId: defaultUser.id,
          animeId: favId,
          createdAt: new Date().toISOString(),
        })
        .onConflictDoNothing();
    } catch (e) {}
  }

  console.log("Database successfully seeded!");
}

if (require.main === module) {
  seedDatabase()
    .then(() => console.log("Seeding completed."))
    .catch((err) => {
      console.error("Seeding failed:", err);
      process.exit(1);
    });
}
