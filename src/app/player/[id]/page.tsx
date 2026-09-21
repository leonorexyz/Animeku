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

interface PlayerPageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayerPage({ params }: PlayerPageProps) {
  const { id } = await params;

  // Search across all mock anime
  const allAnime: Anime[] = [
    ...MOCK_FEATURED_ANIMES,
    ...MOCK_CONTINUE_WATCHING,
    ...MOCK_CATALOG_DATA,
  ];

  const anime = allAnime.find((a) => a.id === id) || allAnime[0];

  if (!anime) {
    notFound();
  }

  // Fetch episodes or generate mock episodes
  const episodes: ExtendedEpisode[] = MOCK_EPISODES[anime.id] || [
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

  // If anime has continue watching progress, use that episode
  const initialEp = anime.progress
    ? episodes.find((e) => e.episodeNumber === anime.progress!.episodeNumber) || episodes[0]
    : episodes[0];

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
