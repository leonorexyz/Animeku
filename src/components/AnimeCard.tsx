"use client";

import React, { useState } from "react";
import { Play, Star, Plus, Check, Info } from "lucide-react";
import { Anime } from "@/types/anime";

interface AnimeCardProps {
  anime: Anime;
  onPlay?: (anime: Anime) => void;
  onSelect?: (anime: Anime) => void;
  variant?: "portrait" | "continue";
}

export default function AnimeCard({
  anime,
  onPlay,
  onSelect,
  variant = "portrait",
}: AnimeCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const hasProgress = !!anime.progress;
  const progressPercent = hasProgress
    ? Math.round((anime.progress!.positionSeconds / anime.progress!.durationSeconds) * 100)
    : 0;

  return (
    <div
      className={`group relative flex-none rounded-lg overflow-hidden cursor-pointer transition-all duration-300 select-none ${
        variant === "continue"
          ? "w-[260px] sm:w-[300px]"
          : "w-[155px] sm:w-[190px] md:w-[215px]"
      } hover:scale-105 hover:z-20 hover:shadow-2xl hover:shadow-black/80`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(anime)}
    >
      {/* Media Wrapper */}
      <div
        className={`relative w-full bg-zinc-800 ${
          variant === "continue" ? "aspect-video" : "aspect-[2/3]"
        } overflow-hidden`}
      >
        <img
          src={variant === "continue" ? anime.coverUrl : anime.posterUrl}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* Status / Rating Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          {anime.rating && (
            <span className="flex items-center gap-1 bg-black/70 backdrop-blur-md text-amber-400 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded border border-white/10">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              {anime.rating}
            </span>
          )}
          <span className="bg-zinc-900/80 backdrop-blur-md text-zinc-300 text-[10px] px-1.5 py-0.5 rounded border border-white/10 uppercase font-medium">
            {anime.status === "tamat" ? "Tamat" : "Ongoing"}
          </span>
        </div>

        {/* Hover Overlay with Quick Play Button */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-3 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.(anime);
              }}
              className="p-2.5 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-lg transition-transform hover:scale-110"
              title="Putar Sekarang"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFavorited(!isFavorited);
                }}
                className={`p-2 rounded-full border transition-colors ${
                  isFavorited
                    ? "bg-emerald-600/80 border-emerald-500 text-white"
                    : "bg-zinc-800/80 hover:bg-zinc-700 border-zinc-600 text-zinc-200"
                }`}
                title="Favorit"
              >
                {isFavorited ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(anime);
                }}
                className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-full border border-zinc-600 text-zinc-200"
                title="Detail"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Watch Progress Bar (Penanda progres tontonan) */}
        {hasProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800/90 overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-r-sm transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info Below Image */}
      <div className="p-2.5 bg-zinc-900/95 border-t border-white/5">
        <h3 className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-red-400 transition-colors">
          {anime.title}
        </h3>

        {/* Variant detail (continue watching shows episode info) */}
        {variant === "continue" && anime.progress ? (
          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate text-zinc-300">
              Ep {anime.progress.episodeNumber}: {anime.progress.episodeTitle}
            </span>
            <span className="text-red-400 shrink-0 font-medium ml-1.5">{progressPercent}%</span>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
            <span>{anime.year}</span>
            <span className="truncate max-w-[100px] text-zinc-500">
              {anime.genres.slice(0, 2).join(", ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
