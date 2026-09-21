"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  X,
  Trash2,
  TrendingUp,
  Sparkles,
  Search,
} from "lucide-react";
import {
  getSearchHistory,
  removeSearchHistoryItem,
  clearSearchHistory,
} from "@/utils/searchHistory";

const TRENDING_SEARCHES = [
  "Attack on Titan",
  "Jujutsu Kaisen",
  "Kimetsu no Yaiba",
  "Solo Leveling",
  "Sousou no Frieren",
  "One Piece",
  "Chainsaw Man",
  "Spy x Family",
];

interface SearchHistoryProps {
  onSelectQuery: (query: string) => void;
  className?: string;
  showTrendingFallback?: boolean;
}

export default function SearchHistory({
  onSelectQuery,
  className = "",
  showTrendingFallback = true,
}: SearchHistoryProps) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    setHistory(getSearchHistory());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ history: string[] }>;
      if (customEvent.detail?.history) {
        setHistory(customEvent.detail.history);
      } else {
        setHistory(getSearchHistory());
      }
    };

    window.addEventListener("animeku:search_history_updated", handleUpdate);
    return () => {
      window.removeEventListener("animeku:search_history_updated", handleUpdate);
    };
  }, []);

  const handleRemoveItem = (e: React.MouseEvent, item: string) => {
    e.stopPropagation();
    const updated = removeSearchHistoryItem(item);
    setHistory(updated);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearSearchHistory();
    setHistory([]);
  };

  if (history.length === 0 && !showTrendingFallback) {
    return null;
  }

  return (
    <div
      className={`bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 space-y-4 ${className}`}
    >
      {/* Search History Section */}
      {history.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-bold text-zinc-300">
              <Clock className="w-3.5 h-3.5 text-red-500" />
              <span>Riwayat Pencarian Terakhir</span>
            </div>

            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
              title="Hapus seluruh riwayat pencarian"
            >
              <Trash2 className="w-3 h-3" />
              <span>Hapus Semua</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {history.map((item) => (
              <div
                key={item}
                onClick={() => onSelectQuery(item)}
                className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/80 hover:border-red-500/40 rounded-full text-xs text-zinc-300 hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <Clock className="w-3 h-3 text-zinc-500 group-hover:text-red-400 transition-colors" />
                <span className="font-medium">{item}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveItem(e, item)}
                  className="p-0.5 rounded-full hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors cursor-pointer"
                  title={`Hapus "${item}" dari riwayat`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Trending / Recommended Queries */}
      {showTrendingFallback && (
        <div className="space-y-2.5 pt-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Paling Sering Dicari</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {TRENDING_SEARCHES.map((query) => (
              <button
                key={query}
                onClick={() => onSelectQuery(query)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <Search className="w-3 h-3 text-zinc-500" />
                <span>{query}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
