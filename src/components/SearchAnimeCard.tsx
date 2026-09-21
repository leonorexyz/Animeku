"use client";

import React, { useState } from "react";
import { Play, Star, Info, HardDrive, Cloud, Link as LinkIcon, Film } from "lucide-react";
import { Anime } from "@/types/anime";
import FavoriteButton from "@/components/FavoriteButton";

interface SearchAnimeCardProps {
  anime: Anime;
  searchQuery?: string;
  onPlay?: (anime: Anime) => void;
  onSelect?: (anime: Anime) => void;
}

export default function SearchAnimeCard({
  anime,
  searchQuery = "",
  onPlay,
  onSelect,
}: SearchAnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  // Derive source type indicator
  const hasLocal = anime.title.toLowerCase().includes("lokal") || anime.id.includes("lokal");
  const hasDrive = anime.title.toLowerCase().includes("drive") || anime.id.includes("drive");

  // Helper to highlight query inside text
  const renderHighlighted = (text: string) => {
    if (!searchQuery.trim()) return text;
    const q = searchQuery.trim();
    const parts = text.split(new RegExp(`(${q})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === q.toLowerCase() ? (
            <mark
              key={i}
              className="bg-red-600/30 text-red-300 font-bold px-0.5 rounded"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div
      role="article"
      aria-label={`Anime: ${anime.title}`}
      className="group relative w-full rounded-xl overflow-hidden cursor-pointer transition-all duration-300 select-none border border-white/5 hover:border-red-500/50 bg-zinc-900/60 hover:scale-[1.03] hover:z-20 hover:shadow-2xl hover:shadow-black/90"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(anime)}
    >
      {/* Poster Image Container */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-zinc-800">
        {!imgError ? (
          <img
            src={anime.posterUrl || anime.coverUrl}
            alt={anime.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-zinc-900 text-center">
            <Film className="w-8 h-8 text-zinc-600 mb-1" />
            <span className="text-[11px] font-bold text-zinc-400 line-clamp-2">
              {anime.title}
            </span>
          </div>
        )}

        {/* Top Floating Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1 z-10">
          {anime.rating && (
            <span className="flex items-center gap-0.5 bg-black/80 backdrop-blur-md text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-400/20 shadow">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              {anime.rating}
            </span>
          )}
          <span className="bg-black/75 backdrop-blur-md text-zinc-300 text-[9px] px-1.5 py-0.5 rounded border border-white/10 uppercase font-semibold">
            {anime.status === "tamat" ? "Tamat" : "Tayang"}
          </span>
        </div>

        {/* Source Badge (Drive / Local / HD) */}
        <div className="absolute top-2 right-2 z-10">
          {hasDrive ? (
            <span className="flex items-center gap-0.5 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              <Cloud className="w-2.5 h-2.5" />
              Drive
            </span>
          ) : hasLocal ? (
            <span className="flex items-center gap-0.5 bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
              <HardDrive className="w-2.5 h-2.5" />
              Lokal
            </span>
          ) : (
            <span className="bg-black/70 backdrop-blur-md text-zinc-300 text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/10">
              HD
            </span>
          )}
        </div>

        {/* Hover Overlay with Quick Actions */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-3 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.(anime);
              }}
              className="p-2.5 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-lg shadow-red-600/50 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
              title="Putar Sekarang"
              aria-label={`Putar ${anime.title}`}
            >
              <Play className="w-4 h-4 fill-white" />
            </button>

            <div className="flex items-center gap-1.5">
              <FavoriteButton
                animeId={anime.id}
                animeTitle={anime.title}
                size="sm"
                showLabel={false}
                className="!rounded-full !p-2"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(anime);
                }}
                className="p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full border border-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer"
                title="Lihat Detail"
                aria-label="Detail Anime"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card Info Footer */}
      <div className="p-2.5 space-y-1">
        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
          {renderHighlighted(anime.title)}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-zinc-400">
          <span>{anime.year}</span>
          <span className="text-[10px] text-zinc-500">{anime.totalEpisodes} Ep</span>
        </div>
        <div className="flex flex-wrap gap-1 pt-0.5">
          {anime.genres.slice(0, 2).map((g) => (
            <span
              key={g}
              className="text-[9px] bg-zinc-800/80 px-1.5 py-0.2 rounded text-zinc-400"
            >
              {g}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
