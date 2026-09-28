"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import LiveSearchInput from "@/components/LiveSearchInput";
import SearchFilters, { FilterState, normalizeGenre } from "@/components/SearchFilters";
import SortControl from "@/components/SortControl";
import SearchHistory from "@/components/SearchHistory";
import SearchAnimeCard from "@/components/SearchAnimeCard";
import SearchEmptyState from "@/components/SearchEmptyState";
import {
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
  MOCK_CATALOG_DATA,
} from "@/data/mockAnime";
import { Anime } from "@/types/anime";
import { getAnimeWatchStatus } from "@/utils/watchStatus";
import {
  Search,
  Compass,
  SlidersHorizontal,
  X,
  Sparkles,
  Film,
  RotateCcw,
  Star,
  Check,
  Play,
  Tv,
  Layers,
} from "lucide-react";

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const paramCategory = searchParams.get("category") || searchParams.get("type") || "all";
  const initialCategory = paramCategory === "series" ? "tv" : paramCategory;

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<FilterState>({
    genre: "Semua",
    category: initialCategory,
    year: "all",
    status: "all",
    watchStatus: "all",
    sortBy: "title-asc",
  });
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Keep category in sync if URL parameter changes (e.g. from navbar clicks)
  React.useEffect(() => {
    const rawCat = searchParams.get("category") || searchParams.get("type");
    if (rawCat) {
      const normalized = rawCat === "series" ? "tv" : rawCat;
      setFilters((prev) => ({ ...prev, category: normalized }));
    }
  }, [searchParams]);

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
          const qNorm = normalizeGenre(q).toLowerCase();
          const matchGenre = item.genres?.some((g) => {
            const gLower = g.toLowerCase();
            const gNorm = normalizeGenre(g).toLowerCase();
            return (
              gLower.includes(q) ||
              gNorm.includes(q) ||
              gLower === qNorm ||
              gNorm === qNorm
            );
          });
          if (!matchTitle && !matchSynopsis && !matchGenre) return false;
        }

        // Genre filter (Bilingual & Synonym Normalized)
        if (filters.genre !== "Semua") {
          const target = normalizeGenre(filters.genre).toLowerCase();
          const matchGenre = item.genres?.some((g) => {
            return (
              g.toLowerCase() === target ||
              normalizeGenre(g).toLowerCase() === target
            );
          });
          if (!matchGenre) {
            return false;
          }
        }

        // Category filter
        if (filters.category !== "all") {
          const isMovie =
            item.type === "movie" ||
            item.genres?.includes("Movie") ||
            item.title.toLowerCase().includes("movie");

          if (filters.category === "movie") {
            if (!isMovie) return false;
          } else if (filters.category === "special") {
            const isSpecial =
              item.title.toLowerCase().includes("ova") ||
              item.title.toLowerCase().includes("special");
            if (!isSpecial) return false;
          } else if (filters.category === "tv" || filters.category === "series") {
            const isSpecial =
              item.title.toLowerCase().includes("ova") ||
              item.title.toLowerCase().includes("special");
            if (isMovie || isSpecial) return false;
          }
        }

        // Year filter
        if (filters.year !== "all") {
          if (filters.year === "older") {
            if ((item.year || 0) > 2019) return false;
          } else {
            const targetYear = parseInt(filters.year, 10);
            if (item.year !== targetYear) return false;
          }
        }

        // Status Tayang filter
        if (filters.status !== "all") {
          if (item.status !== filters.status) {
            return false;
          }
        }

        // Status Tontonan filter (Belum Ditonton, Sedang Ditonton, Selesai Ditonton)
        if (filters.watchStatus && filters.watchStatus !== "all") {
          const ws = getAnimeWatchStatus(item.id, item.progress, item.status);
          if (ws.status !== filters.watchStatus) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case "title-asc":
            return a.title.localeCompare(b.title, "id", { sensitivity: "base" });
          case "title-desc":
            return b.title.localeCompare(a.title, "id", { sensitivity: "base" });
          case "rating-desc":
            return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
          case "rating-asc":
            return parseFloat(a.rating || "0") - parseFloat(b.rating || "0");
          case "year-desc":
            return (b.year || 0) - (a.year || 0);
          case "year-asc":
            return (a.year || 0) - (b.year || 0);
          default:
            return a.title.localeCompare(b.title, "id", { sensitivity: "base" });
        }
      });
  }, [allAnimeList, query, filters]);

  const formatCounts = useMemo(() => {
    let movies = 0;
    let series = 0;
    allAnimeList.forEach((item) => {
      const isMovie =
        item.type === "movie" ||
        item.genres?.includes("Movie") ||
        item.title?.toLowerCase().includes("movie");
      if (isMovie) movies++;
      else series++;
    });
    return { all: allAnimeList.length, series, movies };
  }, [allAnimeList]);

  const handleResetFilters = () => {
    setQuery("");
    setFilters({
      genre: "Semua",
      category: "all",
      year: "all",
      status: "all",
      watchStatus: "all",
      sortBy: "title-asc",
    });
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
                <Compass className="w-6 h-6 text-red-500" />
                Katalog & Eksplorasi Anime
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Jelajahi seluruh koleksi anime, filter berdasarkan genre & kategori, atau cari judul favorit Anda.
              </p>
            </div>

            {/* Total Results Count */}
            <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{filteredAnime.length} Anime Ditemukan</span>
            </div>
          </div>

          {/* Live Search Input with Instant Suggestions */}
          <LiveSearchInput
            value={query}
            onChange={setQuery}
            placeholder="Ketik judul anime, genre (misal: Action, Fantasy), atau kata kunci sinopsis..."
            showDropdown={true}
          />

          {/* Search History & Trending Suggestions */}
          <SearchHistory onSelectQuery={(selectedQuery) => setQuery(selectedQuery)} />
        </section>

        {/* Quick Format Selector Pills (Semua / Serial / Film) */}
        <div className="flex flex-wrap items-center gap-2 pt-1 pb-1">
          <button
            onClick={() => setFilters((prev) => ({ ...prev, category: "all" }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
              filters.category === "all"
                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800/80"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Semua Anime ({formatCounts.all})</span>
          </button>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, category: "tv" }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
              filters.category === "tv" || filters.category === "series"
                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800/80"
            }`}
          >
            <Tv className="w-4 h-4 text-sky-400" />
            <span>Serial TV ({formatCounts.series})</span>
          </button>
          <button
            onClick={() => setFilters((prev) => ({ ...prev, category: "movie" }))}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer border ${
              filters.category === "movie"
                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30"
                : "bg-zinc-900/80 text-zinc-400 hover:text-white border-zinc-800 hover:bg-zinc-800/80"
            }`}
          >
            <Film className="w-4 h-4 text-amber-400" />
            <span>Film / Movie ({formatCounts.movies})</span>
          </button>
        </div>

        {/* Filter and Sorting Controls Component */}
        <SearchFilters
          filters={filters}
          onChange={setFilters}
          onReset={handleResetFilters}
          totalResults={filteredAnime.length}
        />

        {/* Dedicated Sort and View Mode Control */}
        <SortControl
          sortBy={filters.sortBy}
          onChangeSort={(newSort) =>
            setFilters((prev) => ({ ...prev, sortBy: newSort }))
          }
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          totalResults={filteredAnime.length}
        />

        {/* Results Section */}
        <section className="space-y-4">
          {filteredAnime.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
                {filteredAnime.map((anime) => (
                  <div key={anime.id} className="flex justify-center">
                    <SearchAnimeCard
                      anime={anime}
                      searchQuery={query}
                      onSelect={handleSelectAnime}
                      onPlay={handlePlayAnime}
                    />
                  </div>
                ))}
              </div>
            ) : (
              /* List View Mode */
              <div className="space-y-3">
                {filteredAnime.map((anime) => (
                  <div
                    key={anime.id}
                    onClick={() => handleSelectAnime(anime)}
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 sm:p-4 bg-zinc-900/50 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-red-500/40 rounded-xl transition-all cursor-pointer group"
                  >
                    {/* Poster Thumbnail */}
                    <div className="w-20 sm:w-24 aspect-[2/3] rounded-lg overflow-hidden bg-zinc-800 shrink-0 shadow-md">
                      <img
                        src={anime.posterUrl || anime.coverUrl}
                        alt={anime.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Information */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        {anime.rating && (
                          <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-bold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {anime.rating}
                          </span>
                        )}
                        <span className="text-zinc-400">{anime.year}</span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-emerald-400 capitalize">
                          {anime.status === "tamat" ? "Tamat" : "Tayang"}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="text-zinc-400">
                          {anime.totalEpisodes} Episode
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                        {anime.title}
                      </h3>

                      <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 leading-relaxed">
                        {anime.synopsis}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {anime.genres.map((g) => (
                          <span
                            key={g}
                            className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePlayAnime(anime);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-transform active:scale-95 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Tonton</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <SearchEmptyState
              query={query}
              hasActiveFilters={
                filters.genre !== "Semua" ||
                filters.category !== "all" ||
                filters.year !== "all" ||
                filters.status !== "all"
              }
              onResetFilters={handleResetFilters}
              recommendations={allAnimeList}
              onSelectAnime={handleSelectAnime}
            />
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
