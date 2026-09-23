"use client";

import React, { useState, useEffect } from "react";
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
import { Anime, CategorySection } from "@/types/anime";
import { getAllWatchProgress } from "@/utils/watchProgress";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [isEmptyCatalog, setIsEmptyCatalog] = useState(false);
  const [continueWatching, setContinueWatching] = useState<Anime[]>(MOCK_CONTINUE_WATCHING);
  const [categories, setCategories] = useState<CategorySection[]>(MOCK_CATEGORIES);
  const [featuredAnimes, setFeaturedAnimes] = useState<Anime[]>(MOCK_FEATURED_ANIMES);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setCategories(res.data);
        }
      })
      .catch((err) => console.warn("Failed to fetch /api/categories:", err));

    fetch("/api/featured")
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setFeaturedAnimes(res.data);
        }
      })
      .catch((err) => console.warn("Failed to fetch /api/featured:", err));
  }, []);

  useEffect(() => {
    const saved = getAllWatchProgress();
    const savedEntries = Object.values(saved);
    if (savedEntries.length === 0) return;

    const allKnownAnimes = new Map<string, Anime>();
    MOCK_FEATURED_ANIMES.forEach((a) => allKnownAnimes.set(a.id, a));
    MOCK_CONTINUE_WATCHING.forEach((a) => allKnownAnimes.set(a.id, a));
    MOCK_CATEGORIES.forEach((cat) =>
      cat.items.forEach((a) => allKnownAnimes.set(a.id, a))
    );

    const mergedList: Anime[] = [];
    const sortedSaved = [...savedEntries].sort(
      (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
    );

    const handledIds = new Set<string>();

    for (const item of sortedSaved) {
      const known = allKnownAnimes.get(item.animeId);
      if (known) {
        mergedList.push({
          ...known,
          progress: item,
        });
      } else {
        mergedList.push({
          id: item.animeId,
          title: item.animeTitle,
          synopsis: "Tontonan anime yang sedang berjalan.",
          year: new Date().getFullYear(),
          posterUrl: item.animePoster || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
          coverUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
          status: item.isCompleted ? "tamat" : "sedang",
          genres: ["Anime"],
          totalEpisodes: item.episodeNumber || 12,
          progress: item,
        });
      }
      handledIds.add(item.animeId);
    }

    for (const mockItem of MOCK_CONTINUE_WATCHING) {
      if (!handledIds.has(mockItem.id)) {
        mergedList.push(mockItem);
      }
    }

    setContinueWatching(mergedList);
  }, []);

  const handlePlay = (anime: Anime) => {
    window.location.href = `/player/${anime.id}`;
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
            animes={featuredAnimes}
            onPlay={handlePlay}
            onInfo={handleSelectAnime}
          />

          {/* Rows Container */}
          <div className="relative z-20 -mt-12 sm:-mt-20 space-y-6 flex-1">
            {/* Row: Lanjut Nonton (Continue Watching) */}
            <div id="continue-watching">
              <ContinueWatchingRow
                items={continueWatching}
                onPlay={handlePlay}
                onSelect={handleSelectAnime}
              />
            </div>

            {/* Rak-Rak Kategori (Shelves by Category & Genre sesuai urutan dengan mock) */}
            <div id="kategori" className="space-y-6">
              {[...categories]
                .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
                .map((category) => {
                  const badgeLabel =
                    category.type === "genre"
                      ? "Genre"
                      : category.type === "collection"
                      ? "Koleksi Khusus"
                      : "Kategori";

                  return (
                    <AnimeRow
                      key={category.id}
                      title={category.name}
                      items={category.items}
                      variant="portrait"
                      badge={badgeLabel}
                      type={category.type}
                      sortOrder={category.sortOrder}
                      categoryHref="/categories"
                      onPlay={handlePlay}
                      onSelect={handleSelectAnime}
                    />
                  );
                })}
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
