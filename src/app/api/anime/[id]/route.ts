import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, desc, asc, and, inArray } from "drizzle-orm";
import {
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
  MOCK_CATALOG_DATA,
} from "@/data/mockAnime";
import { MOCK_EPISODES } from "@/data/mockEpisodes";
import { Anime } from "@/types/anime";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "ID anime diperlukan" },
        { status: 400 }
      );
    }

    // 1. Fetch anime from database
    const [dbAnime] = await db
      .select()
      .from(schema.anime)
      .where(eq(schema.anime.id, animeId))
      .limit(1);

    if (dbAnime) {
      // Fetch genres / categories
      const categoryRows = await db
        .select({
          categoryName: schema.categories.name,
          categoryId: schema.categories.id,
        })
        .from(schema.animeCategories)
        .innerJoin(
          schema.categories,
          eq(schema.animeCategories.categoryId, schema.categories.id)
        )
        .where(eq(schema.animeCategories.animeId, animeId));

      const genres = categoryRows.map((c) => c.categoryName);
      const categoryIds = categoryRows.map((c) => c.categoryId);

      // Fetch all episodes for this anime ordered by season and episode number
      const episodeRows = await db
        .select()
        .from(schema.episodes)
        .where(eq(schema.episodes.animeId, animeId))
        .orderBy(asc(schema.episodes.seasonNumber), asc(schema.episodes.episodeNumber));

      // Fetch sources for these episodes
      const episodeIds = episodeRows.map((e) => e.id);
      let sourcesByEpisode: Record<string, any[]> = {};
      if (episodeIds.length > 0) {
        const sources = await db
          .select()
          .from(schema.episodeSources)
          .where(inArray(schema.episodeSources.episodeId, episodeIds));

        sources.forEach((s) => {
          if (!sourcesByEpisode[s.episodeId]) {
            sourcesByEpisode[s.episodeId] = [];
          }
          sourcesByEpisode[s.episodeId].push(s);
        });
      }

      const formattedEpisodes = episodeRows.map((ep) => ({
        id: ep.id,
        animeId: ep.animeId,
        title: ep.title,
        episodeNumber: ep.episodeNumber,
        seasonNumber: ep.seasonNumber || 1,
        durationSeconds: ep.durationSeconds,
        sourceType: ep.sourceType,
        sourceUrl: ep.sourceUrl,
        thumbnailUrl: ep.thumbnailUrl,
        synopsis: ep.synopsis,
        sources: [
          {
            id: `src-${ep.id}-primary`,
            label: "Server Utama (HD)",
            quality: "1080p",
            sourceType: ep.sourceType,
            sourceUrl: ep.sourceUrl,
            isDefault: true,
          },
          ...(sourcesByEpisode[ep.id] || []),
        ],
      }));

      // Check if user has favorited
      const [fav] = await db
        .select()
        .from(schema.favorites)
        .where(
          and(
            eq(schema.favorites.userId, "user-default"),
            eq(schema.favorites.animeId, animeId)
          )
        )
        .limit(1);

      // Check watch progress
      const [progress] = await db
        .select()
        .from(schema.watchProgress)
        .where(
          and(
            eq(schema.watchProgress.userId, "user-default"),
            eq(schema.watchProgress.animeId, animeId)
          )
        )
        .orderBy(desc(schema.watchProgress.lastWatchedAt))
        .limit(1);

      // Similar Anime recommendations
      let similarAnime: any[] = [];
      if (categoryIds.length > 0) {
        const similarRows = await db
          .select({
            anime: schema.anime,
          })
          .from(schema.animeCategories)
          .innerJoin(
            schema.anime,
            eq(schema.animeCategories.animeId, schema.anime.id)
          )
          .where(inArray(schema.animeCategories.categoryId, categoryIds))
          .limit(10);

        const seen = new Set<string>([animeId]);
        similarAnime = similarRows
          .filter((row) => {
            if (seen.has(row.anime.id)) return false;
            seen.add(row.anime.id);
            return true;
          })
          .slice(0, 6)
          .map((row) => ({
            id: row.anime.id,
            title: row.anime.title,
            posterUrl: row.anime.posterUrl,
            coverUrl: row.anime.coverUrl,
            year: row.anime.year,
            rating: row.anime.rating,
            status: row.anime.status,
          }));
      }

      return NextResponse.json({
        success: true,
        data: {
          id: dbAnime.id,
          title: dbAnime.title,
          synopsis: dbAnime.synopsis,
          year: dbAnime.year,
          posterUrl: dbAnime.posterUrl,
          coverUrl: dbAnime.coverUrl,
          status: dbAnime.status,
          isFeatured: dbAnime.isFeatured,
          rating: dbAnime.rating || "8.5",
          genres,
          totalEpisodes: formattedEpisodes.length || 12,
          totalSeasons: (dbAnime as any).totalSeasons || 1,
          seasons: (dbAnime as any).seasonsJson ? JSON.parse((dbAnime as any).seasonsJson) : undefined,
          isFavorite: !!fav,
          progress: progress || null,
          episodes: formattedEpisodes,
          similarAnime,
        },
      });
    }

    // 2. Fallback to mock catalog
    const allMock: Anime[] = [
      ...MOCK_FEATURED_ANIMES,
      ...MOCK_CONTINUE_WATCHING,
      ...MOCK_CATALOG_DATA,
    ];
    MOCK_CATEGORIES.forEach((cat) => allMock.push(...cat.items));

    const mockItem = allMock.find((a) => a.id === animeId);

    if (!mockItem) {
      return NextResponse.json(
        { success: false, error: "Anime tidak ditemukan" },
        { status: 404 }
      );
    }

    const mockEps = MOCK_EPISODES[animeId] || [];
    const similar = allMock.filter((a) => a.id !== animeId).slice(0, 6);

    return NextResponse.json({
      success: true,
      data: {
        ...mockItem,
        episodes: mockEps,
        isFavorite: false,
        similarAnime: similar,
      },
    });
  } catch (error: any) {
    console.error("Error in GET /api/anime/[id]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal mengambil detail anime",
        detail: error?.message,
      },
      { status: 500 }
    );
  }
}
