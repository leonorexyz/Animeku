"use client";

import React from "react";
import {
  ArrowUpDown,
  Star,
  Calendar,
  ArrowDownAZ,
  ArrowUpZA,
  LayoutGrid,
  List,
  Sparkles,
} from "lucide-react";

export type SortKey =
  | "relevance"
  | "rating-desc"
  | "year-desc"
  | "year-asc"
  | "title-asc"
  | "title-desc";

export interface SortOption {
  key: SortKey;
  label: string;
  icon: React.ReactNode;
}

export const SORT_ITEMS: SortOption[] = [
  {
    key: "relevance",
    label: "Paling Relevan",
    icon: <Sparkles className="w-3.5 h-3.5 text-red-400" />,
  },
  {
    key: "rating-desc",
    label: "Skor Tertinggi",
    icon: <Star className="w-3.5 h-3.5 text-amber-400" />,
  },
  {
    key: "year-desc",
    label: "Tahun Terbaru",
    icon: <Calendar className="w-3.5 h-3.5 text-blue-400" />,
  },
  {
    key: "year-asc",
    label: "Tahun Terlama",
    icon: <Calendar className="w-3.5 h-3.5 text-zinc-400" />,
  },
  {
    key: "title-asc",
    label: "Judul (A - Z)",
    icon: <ArrowDownAZ className="w-3.5 h-3.5 text-emerald-400" />,
  },
  {
    key: "title-desc",
    label: "Judul (Z - A)",
    icon: <ArrowUpZA className="w-3.5 h-3.5 text-rose-400" />,
  },
];

interface SortControlProps {
  sortBy: string;
  onChangeSort: (sort: string) => void;
  viewMode?: "grid" | "list";
  onChangeViewMode?: (mode: "grid" | "list") => void;
  totalResults: number;
  className?: string;
}

export default function SortControl({
  sortBy,
  onChangeSort,
  viewMode = "grid",
  onChangeViewMode,
  totalResults,
  className = "",
}: SortControlProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl text-xs backdrop-blur-sm ${className}`}
    >
      {/* Left: Total Count & Current Sort Status */}
      <div className="flex items-center gap-2 text-zinc-400">
        <Sparkles className="w-4 h-4 text-red-500 shrink-0" />
        <span>
          Menampilkan <strong className="text-white">{totalResults}</strong> judul anime
        </span>
      </div>

      {/* Right: Sort Dropdown / Quick Buttons & View Mode */}
      <div className="flex items-center gap-2.5 flex-wrap">
        {/* Quick Sort Badges (Hidden on smallest screens, visible on md+) */}
        <div className="hidden lg:flex items-center gap-1">
          {SORT_ITEMS.slice(0, 3).map((item) => (
            <button
              key={item.key}
              onClick={() => onChangeSort(item.key)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                sortBy === item.key
                  ? "bg-red-600 text-white shadow-sm shadow-red-600/30"
                  : "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Full Sort Select Dropdown */}
        <div className="relative flex items-center">
          <ArrowUpDown className="absolute left-2.5 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => onChangeSort(e.target.value)}
            className="pl-8 pr-7 py-1.5 bg-zinc-800/90 hover:bg-zinc-800 border border-zinc-700 rounded-lg text-white font-medium text-xs focus:border-red-500 outline-none cursor-pointer"
          >
            {SORT_ITEMS.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Switcher (Grid vs List) */}
        {onChangeViewMode && (
          <div className="flex items-center bg-zinc-800/80 p-0.5 rounded-lg border border-zinc-700">
            <button
              onClick={() => onChangeViewMode("grid")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "grid"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Tampilan Kisi / Grid"
              aria-label="Tampilan Kisi"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onChangeViewMode("list")}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                viewMode === "list"
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
              title="Tampilan Daftar / List"
              aria-label="Tampilan Daftar"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
