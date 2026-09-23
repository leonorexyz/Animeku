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

  let dbAnime: Anime | null = null;
  let dbEpisodes: ExtendedEpisode[] = [];

  try {
    const [row] = await db
      .select()
      .from(schema.anime)
      .where(eq(schema.anime.id, id))
      .limit(1);

    if (row) {
      dbAnime = {
        id: row.id,
        title: row.title,
        synopsis: row.synopsis,
        year: row.year,
        posterUrl: row.posterUrl,
        coverUrl: row.coverUrl,
        status: row.status,
        isFeatured: row.isFeatured,
        rating: row.rating || "8.5",
        genres: typeof row.genres === "string" ? row.genres.split(",").map((s) => s.trim()) : ["Serial Anime"],
        totalEpisodes: row.totalEpisodes || 12,
      };

      const episodeRows = await db
        .select()
        .from(schema.episodes)
        .where(eq(schema.episodes.animeId, id))
        .orderBy(asc(schema.episodes.episodeNumber));

      if (episodeRows.length > 0) {
        dbEpisodes = episodeRows.map((ep) => ({
          id: ep.id,
          animeId: ep.animeId,
          title: ep.title,
          episodeNumber: ep.episodeNumber,
          durationSeconds: ep.durationSeconds || 1440,
          sourceType: (ep.sourceType as any) || "local",
          sourceUrl: ep.sourceUrl,
          thumbnailUrl: ep.thumbnailUrl || row.coverUrl,
          synopsis: ep.synopsis || `Episode ${ep.episodeNumber} dari ${row.title}`,
        }));
      }
    }
  } catch (err) {
    console.error("PlayerPage DB query error:", err);
  }

  // Search across all mock anime
  const allAnime: Anime[] = [
    ...MOCK_FEATURED_ANIMES,
    ...MOCK_CONTINUE_WATCHING,
    ...MOCK_CATALOG_DATA,
  ];

  const anime = dbAnime || allAnime.find((a) => a.id === id) || allAnime[0];

  if (!anime) {
    notFound();
  }

  // Fetch episodes or generate mock episodes
  const episodes: ExtendedEpisode[] =
    dbEpisodes.length > 0
      ? dbEpisodes
      : MOCK_EPISODES[anime.id] || [
    {
      ...DEFAULT_EPISODE,
      id: `${anime.id}-ep-1`,
      animeId: anime.id,
      title: "Episode Perdana: Awal Mula Perjalanan",
      episodeNumber: 1,
      synopsis: `Episode pertama dari anime ${anime.title}. Memulai kisah petualangan seru.`,
    },
    {
      ...DEFAULT_EPISODE,
      id: `${anime.id}-ep-2`,
      animeId: anime.id,
      title: "Episode Kedua: Pertemuan Tak Terduga",
      episodeNumber: 2,
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      synopsis: `Kelanjutan dari petualangan seru di ${anime.title}.`,
    },
    {
      ...DEFAULT_EPISODE,
      id: `${anime.id}-ep-3`,
      animeId: anime.id,
      title: "Episode Ketiga: Ujian Kekuatan",
      episodeNumber: 3,
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      synopsis: `Pertarungan penting yang menentukan langkah selanjutnya bagi ${anime.title}.`,
    },
  ];

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
