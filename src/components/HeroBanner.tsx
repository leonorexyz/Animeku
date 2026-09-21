"use client";

import React from "react";
import { Play, Info, Plus, Star, Sparkles } from "lucide-react";
import { Anime } from "@/types/anime";

interface HeroBannerProps {
  anime: Anime;
  onPlay?: (anime: Anime) => void;
  onInfo?: (anime: Anime) => void;
}

export default function HeroBanner({ anime, onPlay, onInfo }: HeroBannerProps) {
  const hasProgress = !!anime.progress;
  const progressPercent = hasProgress
    ? Math.round((anime.progress!.positionSeconds / anime.progress!.durationSeconds) * 100)
    : 0;

  return (
    <section className="relative w-full h-[75vh] min-h-[520px] max-h-[750px] flex items-end">
      {/* Background Cover Image with responsive scaling */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-1000 scale-105"
        style={{
          backgroundImage: `url('${anime.coverUrl}')`,
        }}
      >
        {/* Dark Netflix-style gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent w-full md:w-3/4" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-32 w-full">
        <div className="max-w-2xl space-y-4">
          {/* Badge: Sorotan & Rating */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Sorotan Utama
            </span>
            <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {anime.rating}
            </span>
            <span className="text-zinc-400 px-1 font-normal">•</span>
            <span className="text-zinc-300">{anime.year}</span>
            <span className="text-zinc-400 px-1 font-normal">•</span>
            <span className="text-zinc-300">{anime.totalEpisodes} Episode</span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white drop-shadow-md">
            {anime.title}
          </h1>

          {/* Genre list */}
          <div className="flex flex-wrap gap-2 pt-1">
            {anime.genres.map((genre) => (
              <span
                key={genre}
                className="text-xs text-zinc-300 bg-white/10 hover:bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/10 transition-colors"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Synopsis */}
          <p className="text-zinc-300 text-sm sm:text-base line-clamp-3 max-w-xl leading-relaxed drop-shadow">
            {anime.synopsis}
          </p>

          {/* Progress bar reminder if in-progress */}
          {hasProgress && (
            <div className="bg-black/50 backdrop-blur-md p-3 rounded-lg border border-white/10 max-w-md">
              <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                <span className="font-medium text-white">
                  Lanjutkan: Episode {anime.progress!.episodeNumber} — {anime.progress!.episodeTitle}
                </span>
                <span className="text-red-400 font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-zinc-700/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-600 h-full rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* CTA Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onPlay?.(anime)}
              className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-md font-bold text-sm sm:text-base transition-colors shadow-lg shadow-white/10 hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              {hasProgress ? `Lanjut Ep ${anime.progress!.episodeNumber}` : "Mulai Nonton"}
            </button>

            <button
              onClick={() => onInfo?.(anime)}
              className="flex items-center gap-2 bg-zinc-700/80 hover:bg-zinc-600/90 text-white backdrop-blur-sm px-5 py-2.5 rounded-md font-medium text-sm sm:text-base transition-colors"
            >
              <Info className="w-5 h-5 text-zinc-300" />
              Detail Info
            </button>

            <button
              className="p-2.5 rounded-md bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-200 hover:text-white border border-white/10 transition-colors"
              title="Tambah ke Favorit"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
