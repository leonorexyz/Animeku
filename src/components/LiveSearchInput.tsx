"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Star,
  Film,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { Anime } from "@/types/anime";
import {
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
  MOCK_CATALOG_DATA,
} from "@/data/mockAnime";

interface LiveSearchInputProps {
  value?: string;
  onChange?: (val: string) => void;
  onSubmit?: (query: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  showDropdown?: boolean;
  className?: string;
  inputClassName?: string;
}

export default function LiveSearchInput({
  value: controlledValue,
  onChange,
  onSubmit,
  placeholder = "Cari judul anime, genre, karakter...",
  autoFocus = false,
  showDropdown = true,
  className = "",
  inputClassName = "",
}: LiveSearchInputProps) {
  const router = useRouter();
  const [internalValue, setInternalValue] = useState(controlledValue || "");
  const [debouncedQuery, setDebouncedQuery] = useState(controlledValue || "");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with controlled value if provided
  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue);
      setDebouncedQuery(controlledValue);
    }
  }, [controlledValue]);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(internalValue);
    }, 200);

    return () => clearTimeout(handler);
  }, [internalValue]);

  // Gather unique anime list for live lookup
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

  // Filtered live results
  const liveResults = useMemo(() => {
    if (!debouncedQuery.trim()) return [];
    const q = debouncedQuery.toLowerCase().trim();
    return allAnimeList
      .filter((anime) => {
        const matchTitle = anime.title.toLowerCase().includes(q);
        const matchSynopsis = anime.synopsis?.toLowerCase().includes(q);
        const matchGenre = anime.genres?.some((g) => g.toLowerCase().includes(q));
        return matchTitle || matchSynopsis || matchGenre;
      })
      .slice(0, 6);
  }, [debouncedQuery, allAnimeList]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global hotkey: '/' focuses the input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    onChange?.(val);
    setSelectedIndex(-1);
    if (!isOpen) setIsOpen(true);
  };

  const handleClear = () => {
    setInternalValue("");
    setDebouncedQuery("");
    onChange?.("");
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && liveResults[selectedIndex]) {
      // Navigate to selected suggestion
      router.push(`/anime/${liveResults[selectedIndex].id}`);
      setIsOpen(false);
    } else {
      if (onSubmit) {
        onSubmit(internalValue);
      } else {
        router.push(`/search?q=${encodeURIComponent(internalValue.trim())}`);
      }
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || liveResults.length === 0) {
      if (e.key === "Enter") {
        handleSubmit();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < liveResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : liveResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <Search className="absolute left-3.5 sm:left-4 w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 pointer-events-none" />

        <input
          ref={inputRef}
          type="text"
          value={internalValue}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className={`w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-700/80 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded-xl text-white placeholder-zinc-500 text-xs sm:text-sm outline-none transition-all shadow-inner ${inputClassName}`}
        />

        {internalValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3.5 p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Hapus pencarian"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </form>

      {/* Live Suggestion Dropdown */}
      {showDropdown && isOpen && internalValue.trim().length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl backdrop-blur-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {liveResults.length > 0 ? (
            <div className="py-2">
              <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-500 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Saran Langsung ({liveResults.length})
                </span>
                <span className="hidden sm:inline text-[9px] text-zinc-600">
                  Gunakan ↑ ↓ untuk navigasi
                </span>
              </div>

              <div className="divide-y divide-zinc-900">
                {liveResults.map((anime, idx) => (
                  <div
                    key={anime.id}
                    onClick={() => {
                      router.push(`/anime/${anime.id}`);
                      setIsOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${
                      selectedIndex === idx
                        ? "bg-zinc-800/90 text-white"
                        : "hover:bg-zinc-900 text-zinc-300"
                    }`}
                  >
                    {/* Poster thumbnail */}
                    <div className="w-10 h-14 sm:w-11 sm:h-16 rounded-md overflow-hidden bg-zinc-800 shrink-0">
                      <img
                        src={anime.posterUrl || anime.coverUrl}
                        alt={anime.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Anime info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                        {anime.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400 mt-0.5">
                        {anime.rating && (
                          <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                            <Star className="w-2.5 h-2.5 fill-amber-400" />
                            {anime.rating}
                          </span>
                        )}
                        <span>{anime.year}</span>
                        <span>•</span>
                        <span className="capitalize">{anime.status}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {anime.genres.slice(0, 3).map((g) => (
                          <span
                            key={g}
                            className="text-[9px] bg-zinc-800 px-1.5 py-0.2 rounded text-zinc-400"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action icon */}
                    <div className="shrink-0 pl-2">
                      <div className="p-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600 hover:text-white transition-colors">
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* View all search results footer */}
              <div
                onClick={() => handleSubmit()}
                className="px-4 py-2.5 border-t border-zinc-800/80 bg-zinc-900/60 hover:bg-zinc-900 flex items-center justify-between text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer transition-colors"
              >
                <span>Lihat semua hasil untuk "{internalValue}"</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400">
              Tidak ada saran instan untuk "<strong>{internalValue}</strong>".
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="block mx-auto mt-2 text-red-400 hover:underline font-semibold"
              >
                Tekan Enter untuk mencari di katalog penuh →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
