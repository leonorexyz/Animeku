"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import AnimeDetailModal from "@/components/AnimeDetailModal";
import {
  MOCK_FEATURED_ANIME,
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATALOG_DATA,
  MOCK_CATEGORIES,
} from "@/data/mockAnime";
import { Anime } from "@/types/anime";
import {
  getFavoriteAnimeIds,
  toggleFavoriteAnime,
  syncFavoritesFromApi,
} from "@/utils/favorites";
import {
  Heart,
  FolderHeart,
  Play,
  Trash2,
  Search,
  SlidersHorizontal,
  Grid,
  List,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  Compass,
  Star,
  Film,
  RotateCcw,
} from "lucide-react";

// Default mock favorites to populate if empty on first load
const DEFAULT_MOCK_FAVORITE_IDS = ["anime-1", "anime-2", "anime-5", "anime-7"];

export default function FavoritesPage() {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "sedang" | "tamat">("all");
  const [sortBy, setSortBy] = useState<"recent" | "rating" | "title" | "year">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastRemovedId, setLastRemovedId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Build full anime lookup dictionary
  const allKnownAnimes = new Map<string, Anime>();
  [
    MOCK_FEATURED_ANIME,
    ...MOCK_FEATURED_ANIMES,
    ...MOCK_CONTINUE_WATCHING,
    ...MOCK_CATALOG_DATA,
  ].forEach((a) => allKnownAnimes.set(a.id, a));
  MOCK_CATEGORIES.forEach((cat) =>
    cat.items.forEach((a) => allKnownAnimes.set(a.id, a))
  );

  // Load favorites from local storage & API
  useEffect(() => {
    let currentFavs = getFavoriteAnimeIds();
    if (currentFavs.length === 0) {
      // First visit initialization with rich mock favorites
      localStorage.setItem(
        "animeku_user_favorites",
        JSON.stringify(DEFAULT_MOCK_FAVORITE_IDS)
      );
      currentFavs = DEFAULT_MOCK_FAVORITE_IDS;
    }
    setFavoriteIds(currentFavs);

    // Sync from API if running
    syncFavoritesFromApi().then((ids) => {
      if (ids && ids.length > 0) {
        setFavoriteIds(ids);
      }
    });

    const handleFavUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail.allFavorites)) {
        setFavoriteIds(e.detail.allFavorites);
      }
    };

    window.addEventListener("animeku:favorites_updated", handleFavUpdated);
    return () =>
      window.removeEventListener("animeku:favorites_updated", handleFavUpdated);
  }, []);

  // Map IDs to anime items
  const favoriteAnimes: Anime[] = favoriteIds
    .map((id) => allKnownAnimes.get(id))
    .filter((a): a is Anime => a !== undefined);

  // Available genre filter chips
  const allGenres = Array.from(
    new Set(favoriteAnimes.flatMap((a) => a.genres || []))
  );

  // Filter and sort items
  const filteredAnimes = favoriteAnimes
    .filter((a) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchSynopsis = a.synopsis.toLowerCase().includes(q);
        const matchGenre = a.genres?.some((g) => g.toLowerCase().includes(q));
        if (!matchTitle && !matchSynopsis && !matchGenre) return false;
      }

      if (selectedGenre !== "all") {
        if (!a.genres?.includes(selectedGenre)) return false;
      }

      if (selectedStatus !== "all") {
        if (a.status !== selectedStatus) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "rating") {
        return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === "year") {
        return (b.year || 0) - (a.year || 0);
      }
      // "recent" preserves user favorite order (newest first)
      return favoriteIds.indexOf(b.id) - favoriteIds.indexOf(a.id);
    });

  const handleRemoveFavorite = (animeId: string, title: string) => {
    toggleFavoriteAnime(animeId);
    setLastRemovedId(animeId);
    showToast(`"${title}" dihapus dari favorit.`);
  };

  const handleUndoRemove = () => {
    if (lastRemovedId) {
      toggleFavoriteAnime(lastRemovedId);
      const restored = allKnownAnimes.get(lastRemovedId);
      setLastRemovedId(null);
      showToast(`"${restored?.title || "Anime"}" berhasil dikembalikan ke favorit.`);
    }
  };

  const handleAddSampleFavorite = (anime: Anime) => {
    toggleFavoriteAnime(anime.id);
    showToast(`"${anime.title}" ditambahkan ke favorit!`);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white">
      <Navbar />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-red-500/50 text-white text-sm font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          {lastRemovedId && (
            <button
              onClick={handleUndoRemove}
              className="ml-2 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs text-red-400 hover:text-white rounded-lg font-bold transition-colors cursor-pointer"
            >
              Urungkan
            </button>
          )}
        </div>
      )}

      {/* Hero Header Section */}
      <section className="relative pt-28 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
              <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              <span>Daftar Tontonan Pribadi</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Daftar Favorit Saya
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Koleksi serial anime yang telah Anda tandai sebagai favorit untuk ditonton
              kapan saja tanpa perlu mencari ulang.
            </p>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 text-center min-w-[95px] backdrop-blur-sm">
              <span className="text-2xl font-black text-red-500 block">
                {favoriteAnimes.length}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Judul Favorit
              </span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 text-center min-w-[95px] backdrop-blur-sm">
              <span className="text-2xl font-black text-amber-400 block">
                {favoriteAnimes.reduce((acc, a) => acc + (a.totalEpisodes || 12), 0)}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Total Episode
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        {favoriteAnimes.length > 0 && (
          <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Left: Genre and Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedGenre("all");
                  setSelectedStatus("all");
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 ${
                  selectedGenre === "all" && selectedStatus === "all"
                    ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                    : "bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800"
                }`}
              >
                Semua ({favoriteAnimes.length})
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus(selectedStatus === "sedang" ? "all" : "sedang")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
                  selectedStatus === "sedang"
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Sedang Tayang
              </button>

              <button
                type="button"
                onClick={() => setSelectedStatus(selectedStatus === "tamat" ? "all" : "tamat")}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
                  selectedStatus === "tamat"
                    ? "bg-blue-600/20 border-blue-500 text-blue-300"
                    : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                Tamat
              </button>

              {allGenres.slice(0, 6).map((genre) => (
                <button
                  key={genre}
                  type="button"
                  onClick={() => setSelectedGenre(selectedGenre === genre ? "all" : genre)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 border ${
                    selectedGenre === genre
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>

            {/* Right: Search, Sort & View Mode */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-56">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari favorit..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-300 focus:border-red-500 outline-none cursor-pointer"
              >
                <option value="recent">Terbaru Ditandai</option>
                <option value="rating">Rating Tertinggi</option>
                <option value="title">Judul (A-Z)</option>
                <option value="year">Tahun Rilis</option>
              </select>

              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "grid" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Tampilan Grid Poster"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    viewMode === "list" ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                  title="Tampilan Daftar Ringkas"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20">
        {favoriteAnimes.length === 0 ? (
          /* Empty State */
          <div className="py-20 text-center bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-8 max-w-xl mx-auto space-y-5">
            <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500">
              <FolderHeart className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Daftar Favorit Anda Masih Kosong</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-2 max-w-md mx-auto leading-relaxed">
                Anda belum menandai anime apa pun. Temukan anime yang Anda sukai dan klik
                ikon hati pada kartu atau halaman detail untuk menyimpannya di sini.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-red-600/30 transition-transform hover:scale-105"
              >
                <span>Jelajahi Beranda Animeku</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Quick Sample Recommendations */}
            <div className="pt-8 border-t border-zinc-800/80 text-left space-y-3">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Rekomendasi Cepat Untuk Ditambahkan:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_CATALOG_DATA.slice(0, 4).map((sample) => (
                  <div
                    key={sample.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                      <img
                        src={sample.posterUrl}
                        alt={sample.title}
                        className="w-8 h-11 object-cover rounded shadow"
                      />
                      <div className="truncate">
                        <span className="font-bold text-white block truncate">
                          {sample.title}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          {sample.year} • ⭐ {sample.rating || "8.5"}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSampleFavorite(sample)}
                      className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                      title="Tambah ke Favorit"
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : filteredAnimes.length === 0 ? (
          /* Filtered No Results */
          <div className="py-16 text-center bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-8 max-w-md mx-auto">
            <Compass className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white">Tidak ada anime yang cocok</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Tidak ada judul dalam favorit yang memenuhi kriteria filter atau pencarian Anda.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedGenre("all");
                setSelectedStatus("all");
              }}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* Grid View Mode */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredAnimes.map((anime) => (
              <div key={anime.id} className="relative group">
                <AnimeCard
                  anime={anime}
                  onPlay={() => router.push(`/player/${anime.id}`)}
                  onSelect={() => router.push(`/anime/${anime.id}`)}
                />
                {/* Delete button floating overlay */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFavorite(anime.id, anime.title);
                  }}
                  className="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-lg cursor-pointer"
                  title="Hapus dari Favorit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          /* List View Mode */
          <div className="space-y-3">
            {filteredAnimes.map((anime) => (
              <div
                key={anime.id}
                onClick={() => router.push(`/anime/${anime.id}`)}
                className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4 truncate max-w-[70%]">
                  <img
                    src={anime.posterUrl}
                    alt={anime.title}
                    className="w-14 sm:w-16 h-20 sm:h-24 object-cover rounded-xl shadow-md shrink-0 border border-white/5"
                  />
                  <div className="space-y-1 truncate">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm sm:text-base text-white group-hover:text-red-400 transition-colors truncate">
                        {anime.title}
                      </h3>
                      {anime.rating && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shrink-0">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {anime.rating}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 max-w-xl">
                      {anime.synopsis}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                      <span>{anime.year}</span>
                      <span>•</span>
                      <span>{anime.totalEpisodes} Episode</span>
                      <span>•</span>
                      <span className="uppercase text-emerald-400 font-semibold">
                        {anime.status === "tamat" ? "Tamat" : "Ongoing"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/player/${anime.id}`);
                    }}
                    className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span className="hidden sm:inline">Putar</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFavorite(anime.id, anime.title);
                    }}
                    className="p-2 text-zinc-400 hover:text-red-400 bg-zinc-800/80 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                    title="Hapus dari Favorit"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Quick Detail Modal */}
      {selectedAnime && (
        <AnimeDetailModal
          anime={selectedAnime}
          onClose={() => setSelectedAnime(null)}
          onPlay={(a) => router.push(`/player/${a.id}`)}
        />
      )}

      <Footer />
    </div>
  );
}
