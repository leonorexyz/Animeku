"use client";

import React, { useState } from "react";
import {
  SlidersHorizontal,
  RotateCcw,
  X,
  Calendar,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface FilterState {
  genre: string;
  category: string;
  year: string;
  status: string;
  sortBy: string;
  watchStatus?: string;
}

export const WATCH_STATUS_OPTIONS = [
  { label: "Semua Tontonan", value: "all" },
  { label: "Sedang Ditonton", value: "watching" },
  { label: "Selesai Ditonton", value: "completed" },
  { label: "Belum Ditonton", value: "unwatched" },
];

export const GENRE_OPTIONS = [
  "Semua",
  "Action",
  "Adventure",
  "Fantasy",
  "Sci-Fi",
  "Drama",
  "Comedy",
  "Romance",
  "Supernatural",
  "Mystery",
  "Slice of Life",
  "Shounen",
  "Seinen",
  "Isekai",
];

export const CATEGORY_OPTIONS = [
  { label: "Semua Kategori", value: "all" },
  { label: "Serial TV", value: "tv" },
  { label: "Movie / Film", value: "movie" },
  { label: "OVA / Special", value: "special" },
];

export const YEAR_OPTIONS = [
  { label: "Semua Tahun", value: "all" },
  { label: "2025", value: "2025" },
  { label: "2024", value: "2024" },
  { label: "2023", value: "2023" },
  { label: "2022", value: "2022" },
  { label: "2021", value: "2021" },
  { label: "2020", value: "2020" },
  { label: "2019 & Sebelumnya", value: "older" },
];

export const STATUS_OPTIONS = [
  { label: "Semua Status", value: "all" },
  { label: "Sedang Tayang", value: "ongoing" },
  { label: "Tamat", value: "tamat" },
];

export const SORT_OPTIONS = [
  { label: "Skor Tertinggi", value: "rating-desc" },
  { label: "Tahun Terbaru", value: "year-desc" },
  { label: "Tahun Terlama", value: "year-asc" },
  { label: "Judul (A-Z)", value: "title-asc" },
  { label: "Judul (Z-A)", value: "title-desc" },
];

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (updated: FilterState) => void;
  onReset: () => void;
  totalResults: number;
}

export default function SearchFilters({
  filters,
  onChange,
  onReset,
  totalResults,
}: SearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const hasActiveFilters =
    filters.genre !== "Semua" ||
    filters.category !== "all" ||
    filters.year !== "all" ||
    filters.status !== "all" ||
    (!!filters.watchStatus && filters.watchStatus !== "all") ||
    filters.sortBy !== "rating-desc";

  const handleUpdate = (key: keyof FilterState, val: string) => {
    onChange({
      ...filters,
      [key]: val,
    });
  };

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 backdrop-blur-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <SlidersHorizontal className="w-4 h-4 text-red-500" />
          <span>Filter & Pengurutan Katalog</span>
          <span className="text-xs text-zinc-500 font-normal ml-1">
            ({totalResults} hasil)
          </span>
        </div>

        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800/60 transition-colors"
            title={isExpanded ? "Sembunyikan filter" : "Tampilkan filter"}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-1 animate-in fade-in duration-200">
          {/* Active Filter Badges */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-zinc-800/60 text-xs">
              <span className="text-zinc-500 text-[11px] font-medium mr-1">
                Filter Aktif:
              </span>
              {filters.genre !== "Semua" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs">
                  Genre: {filters.genre}
                  <button
                    onClick={() => handleUpdate("genre", "Semua")}
                    className="hover:text-white cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.category !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs">
                  Kategori:{" "}
                  {CATEGORY_OPTIONS.find((c) => c.value === filters.category)
                    ?.label || filters.category}
                  <button
                    onClick={() => handleUpdate("category", "all")}
                    className="hover:text-white cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.year !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                  Tahun:{" "}
                  {YEAR_OPTIONS.find((y) => y.value === filters.year)?.label ||
                    filters.year}
                  <button
                    onClick={() => handleUpdate("year", "all")}
                    className="hover:text-white cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.status !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs">
                  Status:{" "}
                  {STATUS_OPTIONS.find((s) => s.value === filters.status)
                    ?.label || filters.status}
                  <button
                    onClick={() => handleUpdate("status", "all")}
                    className="hover:text-white cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {filters.watchStatus && filters.watchStatus !== "all" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs">
                  Tontonan:{" "}
                  {WATCH_STATUS_OPTIONS.find((w) => w.value === filters.watchStatus)
                    ?.label || filters.watchStatus}
                  <button
                    onClick={() => handleUpdate("watchStatus", "all")}
                    className="hover:text-white cursor-pointer ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* 1. Genre Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-red-500" />
              Genre
            </span>
            <div className="flex flex-wrap gap-1.5">
              {GENRE_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => handleUpdate("genre", g)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filters.genre === g
                      ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                      : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Tahun Rilis Chips */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800/60">
            <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
              <Calendar className="w-3 h-3 text-blue-400" />
              Tahun Rilis
            </span>
            <div className="flex flex-wrap gap-1.5">
              {YEAR_OPTIONS.map((y) => (
                <button
                  key={y.value}
                  onClick={() => handleUpdate("year", y.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    filters.year === y.value
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105"
                      : "bg-zinc-900/90 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800"
                  }`}
                >
                  {y.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Kategori, Status, Status Tontonan & Sort Selector Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-zinc-800/60">
            {/* Kategori Selector */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium flex items-center gap-1">
                <Layers className="w-3 h-3 text-amber-400" />
                Kategori
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleUpdate("category", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-red-500 outline-none cursor-pointer"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Tayang Selector */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">
                Status Tayang
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleUpdate("status", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-red-500 outline-none cursor-pointer"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Tontonan Selector */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">
                Status Tontonan
              </label>
              <select
                value={filters.watchStatus || "all"}
                onChange={(e) => handleUpdate("watchStatus", e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:border-red-500 outline-none cursor-pointer"
              >
                {WATCH_STATUS_OPTIONS.map((ws) => (
                  <option key={ws.value} value={ws.value}>
                    {ws.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="space-y-1">
              <label className="text-xs text-zinc-400 font-medium">
                Urutkan Berdasarkan
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleUpdate("sortBy", e.target.value)}
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
        </div>
      )}
    </div>
  );
}
