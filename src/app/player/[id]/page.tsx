import React from "react";
import AnimePlayer from "@/components/AnimePlayer";
import {
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATALOG_DATA,
} from "@/data/mockAnime";
import { MOCK_EPISODES, DEFAULT_EPISODE, ExtendedEpisode } from "@/data/mockEpisodes";
import { Anime } from "@/types/anime";
import { notFound } from "next/navigation";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, asc } from "drizzle-orm";

interface PlayerPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ ep?: string }>;
}

export default async function PlayerPage({ params, searchParams }: PlayerPageProps) {
  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const requestedEpNum = resolvedSearchParams.ep ? parseInt(resolvedSearchParams.ep, 10) : undefined;

  // Search across in-memory catalog first (instant 0ms response)
  const allAnime: Anime[] = [
    ...MOCK_FEATURED_ANIMES,
    ...MOCK_CONTINUE_WATCHING,
    ...MOCK_CATALOG_DATA,
  ];

  let anime: Anime | undefined = allAnime.find((a) => a.id === id);
  let episodes: ExtendedEpisode[] = MOCK_EPISODES[id] || [];

  // If not found in in-memory catalog, try database with fast timeout
  if (!anime || episodes.length === 0) {
    try {
      const dbPromise = (async () => {
        const [row] = await db
          .select()
          .from(schema.anime)
          .where(eq(schema.anime.id, id))
          .limit(1);

        if (!row) return null;

        const episodeRows = await db
          .select()
          .from(schema.episodes)
          .where(eq(schema.episodes.animeId, id))
          .orderBy(asc(schema.episodes.episodeNumber));

        return { row, episodeRows };
      })();

      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 1500)
      );

      const result = await Promise.race([dbPromise, timeoutPromise]);

      if (result) {
        if (!anime) {
          anime = {
            id: result.row.id,
            title: result.row.title,
            synopsis: result.row.synopsis,
            year: result.row.year,
            posterUrl: result.row.posterUrl,
            coverUrl: result.row.coverUrl,
            status: result.row.status,
            isFeatured: result.row.isFeatured,
            rating: result.row.rating || "8.5",
            genres:
              typeof result.row.genres === "string"
                ? result.row.genres.split(",").map((s) => s.trim())
                : ["Serial Anime"],
            totalEpisodes: result.row.totalEpisodes || 12,
          };
        }

        if (episodes.length === 0 && result.episodeRows.length > 0) {
          episodes = result.episodeRows.map((ep) => ({
            id: ep.id,
            animeId: ep.animeId,
            title: ep.title,
            episodeNumber: ep.episodeNumber,
            durationSeconds: ep.durationSeconds || 1440,
            sourceType: (ep.sourceType as any) || "local",
            sourceUrl: ep.sourceUrl,
            thumbnailUrl: ep.thumbnailUrl || result.row.coverUrl,
            synopsis: ep.synopsis || `Episode ${ep.episodeNumber} dari ${result.row.title}`,
          }));
        }
      }
    } catch (err) {
      console.error("PlayerPage DB query error:", err);
    }
  }

  // Absolute fallback
  if (!anime) {
    anime = allAnime[0];
  }
  if (!anime) {
    notFound();
  }

  // Fallback episodes if still none
  if (episodes.length === 0) {
    episodes = [
      {
        ...DEFAULT_EPISODE,
        id: `${anime.id}-ep-1`,
        animeId: anime.id,
        title: "Episode Perdana: Awal Mula Perjalanan",
        episodeNumber: 1,
        synopsis: `Episode pertama dari anime ${anime.title}. Memulai kisah petualangan seru.`,
      },
    ];
  }

  // If specific episode requested via query param, use it; otherwise check continue watching progress
  let initialEp = episodes[0];
  if (requestedEpNum) {
    const matched = episodes.find((e) => e.episodeNumber === requestedEpNum);
    if (matched) initialEp = matched;
  } else if (anime.progress) {
    const matched = episodes.find((e) => e.episodeNumber === anime.progress!.episodeNumber);
    if (matched) initialEp = matched;
  }

  return (
    <main className="w-full h-screen bg-black overflow-hidden">
      <AnimePlayer
        anime={anime}
        episodes={episodes}
        initialEpisode={initialEp}
      />
    </main>
  );
}
