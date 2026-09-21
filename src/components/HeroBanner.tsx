"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Info,
  Plus,
  Check,
  Star,
  Sparkles,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Anime } from "@/types/anime";
import FavoriteButton from "@/components/FavoriteButton";

interface HeroBannerProps {
  anime?: Anime;
  animes?: Anime[];
  onPlay?: (anime: Anime) => void;
  onInfo?: (anime: Anime) => void;
}

export default function HeroBanner({
  anime,
  animes = [],
  onPlay,
  onInfo,
}: HeroBannerProps) {
  // Use list if provided, otherwise fallback to single anime
  const featuredList = animes.length > 0 ? animes : anime ? [anime] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const currentAnime = featuredList[currentIndex];

  // Auto cycle featured anime every 8 seconds
  useEffect(() => {
    if (featuredList.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredList.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [featuredList.length]);

  if (!currentAnime) return null;

  const hasProgress = !!currentAnime.progress;
  const progressPercent = hasProgress
    ? Math.round(
        (currentAnime.progress!.positionSeconds /
          currentAnime.progress!.durationSeconds) *
          100
      )
    : 0;

  return (
    <section className="relative w-full h-[75vh] min-h-[540px] max-h-[760px] flex items-end overflow-hidden">
      {/* Background Cover Images with Smooth Transition */}
      {featuredList.map((item, index) => (
        <div
          key={item.id}
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 transform ${
            index === currentIndex
              ? "opacity-100 scale-100"
              : "opacity-0 scale-105 pointer-events-none"
          }`}
          style={{
            backgroundImage: `url('${item.coverUrl}')`,
          }}
        >
          {/* Dark Netflix-style gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/80 to-transparent w-full md:w-3/4" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-transparent" />
        </div>
      ))}

      {/* Main Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-28 w-full">
        <div className="max-w-2xl space-y-4">
          {/* Badges: Sorotan, Rating, Usia & Format */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <span className="flex items-center gap-1.5 bg-red-600/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-md tracking-wider uppercase shadow-md shadow-red-600/30">
              <Sparkles className="w-3.5 h-3.5" />
              Sorotan Utama
            </span>
            {currentAnime.rating && (
              <span className="flex items-center gap-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-md">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {currentAnime.rating}
              </span>
            )}
            <span className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded border border-white/10 text-[11px]">
              16+
            </span>
            <span className="bg-zinc-800/80 text-zinc-300 px-2 py-0.5 rounded border border-white/10 text-[11px]">
              Ultra HD 4K
            </span>
            <span className="text-zinc-400 px-1 font-normal">•</span>
            <span className="text-zinc-300">{currentAnime.year}</span>
            <span className="text-zinc-400 px-1 font-normal">•</span>
            <span className="text-zinc-300">
              {currentAnime.totalEpisodes} Episode
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
            {currentAnime.title}
          </h1>

          {/* Genre list */}
          <div className="flex flex-wrap gap-2 pt-1">
            {currentAnime.genres.map((genre) => (
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
            {currentAnime.synopsis}
          </p>

          {/* Progress bar reminder if in-progress */}
          {hasProgress && (
            <div className="bg-black/60 backdrop-blur-md p-3.5 rounded-lg border border-white/15 max-w-md shadow-lg">
              <div className="flex justify-between text-xs text-zinc-300 mb-1.5">
                <span className="font-medium text-white">
                  Lanjutkan: Episode {currentAnime.progress!.episodeNumber} —{" "}
                  {currentAnime.progress!.episodeTitle}
                </span>
                <span className="text-red-400 font-bold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-zinc-700/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-red-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onPlay?.(currentAnime)}
              className="flex items-center gap-2 bg-white text-black hover:bg-zinc-200 px-6 py-2.5 rounded-md font-bold text-sm sm:text-base transition-all shadow-lg shadow-white/10 hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              {hasProgress
                ? `Lanjut Ep ${currentAnime.progress!.episodeNumber}`
                : "Mulai Nonton"}
            </button>

            <button
              onClick={() => onInfo?.(currentAnime)}
              className="flex items-center gap-2 bg-zinc-800/90 hover:bg-zinc-700 text-white backdrop-blur-sm px-5 py-2.5 rounded-md font-medium text-sm sm:text-base transition-colors border border-white/10 cursor-pointer"
            >
              <Info className="w-5 h-5 text-zinc-300" />
              Detail Info
            </button>

            <FavoriteButton
              animeId={currentAnime.id}
              animeTitle={currentAnime.title}
              size="md"
              variant="netflix-list"
              showLabel={true}
              className="!py-2.5 !rounded-md"
            />
            <FavoriteButton
              animeId={currentAnime.id}
              animeTitle={currentAnime.title}
              size="md"
              variant="heart"
              showLabel={false}
              className="!p-2.5 !rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Right Controls: Mute Toggle & Featured Switcher Dots */}
      <div className="absolute right-4 sm:right-8 bottom-16 z-20 flex items-center gap-4">
        {/* Mute / Audio Toggle Button */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110"
          title={isMuted ? "Bunyikan Ambiance" : "Bisukan"}
          aria-label="Toggle Ambiance Sound"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-zinc-300" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Carousel Indicators */}
        {featuredList.length > 1 && (
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/10">
            {featuredList.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`transition-all duration-300 rounded-full ${
                  idx === currentIndex
                    ? "w-6 h-2 bg-red-600"
                    : "w-2 h-2 bg-white/40 hover:bg-white/80"
                }`}
                aria-label={`Pilih sorotan ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
