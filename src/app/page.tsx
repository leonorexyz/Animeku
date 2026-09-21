"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import HeroBanner from "@/components/HeroBanner";
import AnimeRow from "@/components/AnimeRow";
import ContinueWatchingRow from "@/components/ContinueWatchingRow";
import AnimeDetailModal from "@/components/AnimeDetailModal";
import EmptyCatalogState from "@/components/EmptyCatalogState";
import MobileBottomNav from "@/components/MobileBottomNav";
import Footer from "@/components/Footer";
import {
  MOCK_FEATURED_ANIME,
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
} from "@/data/mockAnime";
import { Anime } from "@/types/anime";
import { SlidersHorizontal } from "lucide-react";

export default function Home() {
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [playingAnime, setPlayingAnime] = useState<Anime | null>(null);
  const [isEmptyCatalog, setIsEmptyCatalog] = useState(false);

  const handlePlay = (anime: Anime) => {
    setPlayingAnime(anime);
    alert(
      `Memutar ${anime.title} ${
        anime.progress
          ? `(Melanjutkan Episode ${anime.progress.episodeNumber})`
          : "Episode 1"
      }`
    );
  };

  const handleSelectAnime = (anime: Anime) => {
    setSelectedAnime(anime);
  };

  const handleAddLocalFiles = (files: FileList) => {
    alert(
      `Berhasil mengimpor ${files.length} file lokal. Katalog Anda sekarang aktif!`
    );
    setIsEmptyCatalog(false);
  };

  const handleConnectDrive = () => {
    alert("Akun Google Drive terhubung! Menyelaraskan folder anime...");
    setIsEmptyCatalog(false);
  };

  const handleAddLink = (url: string, title: string) => {
    alert(`Anime dari link "${title}" berhasil ditambahkan ke katalog!`);
    setIsEmptyCatalog(false);
  };

  return (
    <main className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white">
      {/* Netflix Top Navigation Bar */}
      <Navbar />

      {/* Floating View Mode Switcher (Katalog Berisi vs Katalog Kosong) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsEmptyCatalog(!isEmptyCatalog)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white border border-white/10 shadow-2xl backdrop-blur-md transition-transform hover:scale-105 cursor-pointer"
          title="Beralih antara tampilan katalog terisi dan ajakan tambah sumber"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-red-500" />
          <span>
            {isEmptyCatalog ? "Tampilkan Katalog Terisi" : "Lihat Tampilan Kosong"}
          </span>
        </button>
      </div>

      {isEmptyCatalog ? (
        /* Empty State with Source Connectors */
        <div className="pt-24 pb-12 flex-1 flex items-center justify-center">
          <EmptyCatalogState
            onAddLocal={handleAddLocalFiles}
            onConnectDrive={handleConnectDrive}
            onAddLink={handleAddLink}
          />
        </div>
      ) : (
        /* Normal Populated Netflix Layout */
        <>
          {/* Sorotan Utama (Hero Banner) */}
          <HeroBanner
            animes={MOCK_FEATURED_ANIMES}
            onPlay={handlePlay}
            onInfo={handleSelectAnime}
          />

          {/* Rows Container */}
          <div className="relative z-20 -mt-12 sm:-mt-20 space-y-6 flex-1">
            {/* Row: Lanjut Nonton (Continue Watching) */}
            <div id="continue-watching">
              <ContinueWatchingRow
                items={MOCK_CONTINUE_WATCHING}
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
        </>
      )}

      {/* Quick Anime Detail Modal */}
      <AnimeDetailModal
        anime={selectedAnime}
        onClose={() => setSelectedAnime(null)}
        onPlay={handlePlay}
      />

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar (Ala Netflix Mobile) */}
      <MobileBottomNav onAddClick={() => setIsEmptyCatalog(true)} />
    </main>
  );
}
