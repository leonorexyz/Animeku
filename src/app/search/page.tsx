"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import {
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
  MOCK_CATALOG_DATA,
} from "@/data/mockAnime";
import { Anime } from "@/types/anime";
import {
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  Film,
  RotateCcw,
  Star,
  Check,
} from "lucide-react";

const ALL_GENRES = [
  "Semua",
  "Action",
  "Adventure",
  "Fantasy",
  "Sci-Fi",
  "Drama",
  "Supernatural",
  "Mystery",
  "Shounen",
];

const ALL_STATUSES = [
  { label: "Semua Status", value: "all" },
  { label: "Sedang Tayang", value: "ongoing" },
  { label: "Tamat", value: "tamat" },
];

const SORT_OPTIONS = [
  { label: "Skor Tertinggi", value: "rating-desc" },
  { label: "Tahun Terbaru", value: "year-desc" },
  { label: "Judul (A-Z)", value: "title-asc" },
  { label: "Judul (Z-A)", value: "title-desc" },
];

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState<string>("Semua");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("rating-desc");
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Combine and deduplicate all anime from mock sources
  const allAnimeList = useMemo(() => {
    const map = new Map<string, Anime>();
    const all = [
      ...MOCK_FEATURED_ANIMES,
      ...MOCK_CONTINUE_WATCHING,
      ...MOCK_CATALOG_DATA,
    ];
    MOCK_CATEGORIES.forEach((cat) => all.push(...cat.items));

    all.forEach((item) => {
      if (item && item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }, []);

  // Filter and Sort logic
  const filteredAnime = useMemo(() => {
    return allAnimeList
      .filter((item) => {
        // Text search match
        if (query.trim()) {
          const q = query.toLowerCase().trim();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSynopsis = item.synopsis?.toLowerCase().includes(q);
          const matchGenre = item.genres?.some((g) =>
            g.toLowerCase().includes(q)
          );
          if (!matchTitle && !matchSynopsis && !matchGenre) return false;
        }

        // Genre filter
        if (selectedGenre !== "Semua") {
          if (!item.genres || !item.genres.includes(selectedGenre)) {
            return false;
          }
        }

        // Status filter
        if (selectedStatus !== "all") {
          if (item.status !== selectedStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "rating-desc":
            return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
          case "year-desc":
            return (b.year || 0) - (a.year || 0);
          case "title-asc":
            return a.title.localeCompare(b.title);
          case "title-desc":
            return b.title.localeCompare(a.title);
          default:
            return 0;
        }
      });
  }, [allAnimeList, query, selectedGenre, selectedStatus, sortBy]);

  const handleResetFilters = () => {
    setQuery("");
    setSelectedGenre("Semua");
    setSelectedStatus("all");
    setSortBy("rating-desc");
  };

  const handleSelectAnime = (anime: Anime) => {
    router.push(`/anime/${anime.id}`);
  };

  const handlePlayAnime = (anime: Anime) => {
    router.push(`/player/${anime.id}`);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16 space-y-8">
        {/* Search Header Bar */}
        <section className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                <Search className="w-6 h-6 text-red-500" />
                Pencarian & Eksplorasi
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Temukan anime favorit Anda dari berkas lokal, Google Drive, atau tautan streaming.
              </p>
            </div>

            {/* Total Results Count */}
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{filteredAnime.length} Anime Ditemukan</span>
            </div>
          </div>

          {/* Search Input Box */}
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Ketik judul anime, genre (misal: Action, Fantasy), atau kata kunci sinopsis..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3.5 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-700/80 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-zinc-500 text-sm sm:text-base outline-none transition-all shadow-inner"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-4 p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* Filter and Sorting Controls */}
        <section className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-zinc-300">
              <SlidersHorizontal className="w-4 h-4 text-red-500" />
              <span>Filter & Urutkan</span>
            </div>

            {(query || selectedGenre !== "Semua" || selectedStatus !== "all" || sortBy !== "rating-desc") && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>

          {/* Genre Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block">
              Genre:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => setSelectedGenre(genre)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    selectedGenre === genre
                      ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Secondary Controls: Status & Sort */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800/60">
            {/* Status Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 shrink-0 font-medium">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-red-500 outline-none cursor-pointer"
              >
                {ALL_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 shrink-0 font-medium">Urutkan:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-red-500 outline-none cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="space-y-4">
          {filteredAnime.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
              {filteredAnime.map((anime) => (
                <div key={anime.id} className="flex justify-center">
                  <AnimeCard
                    anime={anime}
                    variant="portrait"
                    onSelect={handleSelectAnime}
                    onPlay={handlePlayAnime}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-zinc-900/30 border border-zinc-800/80 rounded-2xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-500">
                <Film className="w-8 h-8" />
              </div>
              <div className="space-y-1 max-w-md">
                <h3 className="text-lg font-bold text-white">
                  Tidak Ditemukan Anime yang Sesuai
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400">
                  {query
                    ? `Tidak ada hasil untuk kata kunci "${query}". Coba periksa ejaan atau gunakan kata kunci lain.`
                    : "Tidak ada judul anime yang sesuai dengan kombinasi filter saat ini."}
                </p>
              </div>

              <button
                onClick={handleResetFilters}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Filter & Lihat Semua</span>
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#141414] flex items-center justify-center text-white">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-zinc-400">
              Memuat pencarian...
            </span>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
