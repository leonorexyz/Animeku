"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import AnimeRow from "@/components/AnimeRow";
import AnimeDetailModal from "@/components/AnimeDetailModal";
import Footer from "@/components/Footer";
import {
  MOCK_FEATURED_ANIME,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
} from "@/data/mockAnime";
import { Anime } from "@/types/anime";

export default function Home() {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [playingAnime, setPlayingAnime] = useState<Anime | null>(null);

  const handlePlay = (anime: Anime) => {
    // In later tasks of Phase 1, this will route to /player/[id] or open full player
    setPlayingAnime(anime);
    // For now, provide an alert/notification feedback
    alert(
      `Memutar ${anime.title} ${
        anime.progress ? `(Melanjutkan Episode ${anime.progress.episodeNumber})` : "Episode 1"
      }`
    );
  };

  const handleSelectAnime = (anime: Anime) => {
    setSelectedAnime(anime);
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white">
      {/* Netflix Top Navigation Bar */}
      <Navbar />

      {/* Sorotan Utama (Hero Banner) */}
      <HeroBanner
        anime={MOCK_FEATURED_ANIME}
        onPlay={handlePlay}
        onInfo={handleSelectAnime}
      />

      {/* Rows Container (Negative top margin to overlap smoothly with hero gradient) */}
      <div className="relative z-20 -mt-12 sm:-mt-20 space-y-6">
        {/* Row: Lanjut Nonton (Continue Watching) */}
        <div id="continue-watching">
          <AnimeRow
            title="▶ Lanjut Nonton"
            items={MOCK_CONTINUE_WATCHING}
            variant="continue"
            onPlay={handlePlay}
            onSelect={handleSelectAnime}
          />
        </div>

        {/* Rak-Rak Kategori (Shelves by Category & Genre) */}
        <div id="kategori" className="space-y-6">
          {MOCK_CATEGORIES.map((category) => (
            <AnimeRow
              key={category.id}
              title={category.name}
              items={category.items}
              variant="portrait"
              onPlay={handlePlay}
              onSelect={handleSelectAnime}
            />
          ))}
        </div>
      </div>

      {/* Quick Anime Detail Modal */}
      <AnimeDetailModal
        anime={selectedAnime}
        onClose={() => setSelectedAnime(null)}
        onPlay={handlePlay}
      />

      {/* Footer */}
      <Footer />
    </main>
  );
}
