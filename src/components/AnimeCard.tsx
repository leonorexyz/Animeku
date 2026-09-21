"use client";

import React, { useState } from "react";
import { Play, Star, Plus, Check, Info, Film, Sparkles } from "lucide-react";
import { Anime } from "@/types/anime";
import FavoriteButton from "@/components/FavoriteButton";
import WatchStatusBadge from "@/components/WatchStatusBadge";

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
  const [imgError, setImgError] = useState(false);

  const hasProgress = !!anime.progress;
  const progressPercent = hasProgress
    ? Math.round(
        (anime.progress!.positionSeconds / anime.progress!.durationSeconds) * 100
      )
    : 0;

  const imageUrl = variant === "continue" ? anime.coverUrl : anime.posterUrl;

  return (
    <div
      role="article"
      aria-label={`Anime: ${anime.title}`}
      className={`group relative flex-none rounded-xl overflow-hidden cursor-pointer transition-all duration-300 select-none border border-white/5 hover:border-red-500/40 ${
        variant === "continue"
          ? "w-[260px] sm:w-[310px]"
          : "w-[155px] sm:w-[190px] md:w-[215px]"
      } hover:scale-105 hover:z-20 hover:shadow-2xl hover:shadow-black/90`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect?.(anime)}
    >
      {/* Media Wrapper */}
      <div
        className={`relative w-full bg-gradient-to-br from-zinc-800 to-zinc-900 ${
          variant === "continue" ? "aspect-video" : "aspect-[2/3]"
        } overflow-hidden`}
      >
        {!imgError ? (
          <img
            src={imageUrl}
            alt={anime.title}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          /* Fallback Poster Placeholder */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-zinc-800 via-zinc-900 to-black text-center">
            <Film className="w-10 h-10 text-zinc-600 mb-2" />
            <span className="text-xs font-bold text-zinc-300 line-clamp-2">
              {anime.title}
            </span>
          </div>
        )}

        {/* Status / Rating & Watch Status Badge */}
        <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5 z-10 max-w-[70%]">
          {anime.rating && (
            <span className="flex items-center gap-1 bg-black/75 backdrop-blur-md text-amber-400 text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded border border-white/10 shadow">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              {anime.rating}
            </span>
          )}
          <WatchStatusBadge
            animeId={anime.id}
            progress={anime.progress}
            fallbackStatus={anime.status}
            size="xs"
            interactive={true}
          />
        </div>

        {/* Resolution / Quality Badge & Quick Favorite Toggle */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <FavoriteButton
            animeId={anime.id}
            animeTitle={anime.title}
            variant="heart"
            size="sm"
            showLabel={false}
            className="!p-1.5 !rounded-full !bg-black/60 hover:!bg-black/80 !border-white/10"
          />
          <span className="bg-black/60 backdrop-blur-md text-zinc-300 text-[9px] px-1.5 py-0.5 rounded border border-white/10 font-bold tracking-wider">
            1080P
          </span>
        </div>

        {/* Hover Overlay with Action Buttons */}
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-3 transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlay?.(anime);
              }}
              className="p-2.5 bg-red-600 hover:bg-red-500 rounded-full text-white shadow-lg shadow-red-600/40 transition-transform hover:scale-115 active:scale-95 cursor-pointer"
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
                title="Detail Anime"
                aria-label="Lihat Detail"
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
              className="h-full bg-red-600 rounded-r-sm transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {/* Card Info Below Image */}
      <div className="p-3 bg-zinc-900/95 border-t border-white/5">
        <h3 className="text-white text-xs sm:text-sm font-bold truncate group-hover:text-red-400 transition-colors">
          {anime.title}
        </h3>

        {/* Variant detail */}
        {variant === "continue" && anime.progress ? (
          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="truncate text-zinc-300 font-medium">
              Ep {anime.progress.episodeNumber}: {anime.progress.episodeTitle}
            </span>
            <span className="text-red-400 shrink-0 font-bold ml-1.5">
              {progressPercent}%
            </span>
          </div>
        ) : (
          <div className="mt-1 flex items-center justify-between text-[11px] text-zinc-400">
            <span className="font-medium text-zinc-300">{anime.year}</span>
            <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-white/5">
              {anime.totalEpisodes} Ep
            </span>
            <span className="truncate max-w-[80px] text-zinc-400">
              {anime.genres[0]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
