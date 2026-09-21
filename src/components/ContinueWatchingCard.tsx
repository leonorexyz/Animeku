"use client";

import React, { useState } from "react";
import { Play, X, Info, Clock } from "lucide-react";
import { Anime } from "@/types/anime";

interface ContinueWatchingCardProps {
  anime: Anime;
  onPlay?: (anime: Anime) => void;
  onSelect?: (anime: Anime) => void;
  onRemove?: (animeId: string) => void;
}

export default function ContinueWatchingCard({
  anime,
  onPlay,
  onSelect,
  onRemove,
}: ContinueWatchingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const progress = anime.progress;

  if (!progress) return null;

  const currentSeconds = progress.positionSeconds;
  const totalSeconds = progress.durationSeconds;
  const percent = Math.min(100, Math.round((currentSeconds / totalSeconds) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const remainingMinutes = Math.max(1, Math.round((totalSeconds - currentSeconds) / 60));

  return (
    <div
      className="group relative flex-none w-[270px] sm:w-[320px] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-red-500/50 transition-all duration-300 select-none hover:shadow-2xl hover:shadow-black/90 hover:scale-[1.03] cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onPlay?.(anime)}
    >
      {/* 16:9 Thumbnail Cover */}
      <div className="relative aspect-video w-full bg-zinc-800 overflow-hidden">
        <img
          src={anime.coverUrl}
          alt={anime.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />

        {/* Gradient dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Remove button (X) */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(anime.id);
            }}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-red-600 text-zinc-300 hover:text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 cursor-pointer"
            title="Hapus dari Lanjut Nonton"
            aria-label="Hapus dari daftar lanjut nonton"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Big Center Play Icon on Hover */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg shadow-red-600/50 backdrop-blur-sm transform group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </div>
        </div>

        {/* Remaining Time Badge */}
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-md text-[11px] text-zinc-200 px-2 py-0.5 rounded border border-white/10">
          <Clock className="w-3 h-3 text-red-400" />
          <span>Sisa {remainingMinutes} mnt</span>
        </div>

        {/* Netflix Red Progress Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-zinc-800/90">
          <div
            className="h-full bg-red-600 transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Episode & Title Info Footer */}
      <div className="p-3.5 flex flex-col justify-between gap-2">
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-white text-sm font-bold truncate group-hover:text-red-400 transition-colors">
              {anime.title}
            </h3>
            <span className="text-[11px] font-semibold text-red-400 shrink-0">
              {percent}%
            </span>
          </div>

          <p className="text-xs text-zinc-300 font-medium truncate mt-0.5">
            Ep {progress.episodeNumber}: {progress.episodeTitle}
          </p>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/5">
          <span>
            {formatTime(currentSeconds)} / {formatTime(totalSeconds)}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.(anime);
              }}
              className="hover:text-white transition-colors p-1"
              title="Detail Anime"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
            <span className="text-red-400 font-bold hover:underline">
              Putar →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
