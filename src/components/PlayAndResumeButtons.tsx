"use client";

import React from "react";
import Link from "next/link";
import { Play, RotateCcw, Share2, Clock } from "lucide-react";
import { WatchProgress } from "@/types/anime";
import FavoriteButton from "@/components/FavoriteButton";

interface PlayAndResumeButtonsProps {
  animeId: string;
  animeTitle?: string;
  totalEpisodes?: number;
  savedProgress: WatchProgress | null;
  onShare: () => void;
  onPlay: (episodeNumber?: number) => void;
}

export default function PlayAndResumeButtons({
  animeId,
  animeTitle,
  totalEpisodes = 12,
  savedProgress,
  onShare,
  onPlay,
}: PlayAndResumeButtonsProps) {
  const hasProgress =
    savedProgress &&
    savedProgress.positionSeconds > 0 &&
    !savedProgress.isCompleted;

  const currentEpNum = savedProgress?.episodeNumber || 1;
  const progressPercent =
    savedProgress && savedProgress.durationSeconds > 0
      ? Math.min(
          100,
          Math.round(
            (savedProgress.positionSeconds / savedProgress.durationSeconds) * 100
          )
        )
      : 0;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const remainingMinutes =
    savedProgress && savedProgress.durationSeconds > savedProgress.positionSeconds
      ? Math.ceil(
          (savedProgress.durationSeconds - savedProgress.positionSeconds) / 60
        )
      : 0;

  return (
    <div className="space-y-3">
      {/* Active Watch Progress Pill if in progress */}
      {hasProgress && (
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-black/40 border border-zinc-800/80 px-3 py-1.5 rounded-full w-fit backdrop-blur-md">
          <Clock className="w-3.5 h-3.5 text-red-500 animate-pulse" />
          <span>
            Terakhir ditonton:{" "}
            <strong className="text-zinc-200">
              Episode {currentEpNum}
            </strong>{" "}
            ({formatTime(savedProgress.positionSeconds)} /{" "}
            {formatTime(savedProgress.durationSeconds)})
          </span>
          <span className="text-zinc-500">•</span>
          <span className="text-red-400 font-medium">
            {remainingMinutes} menit tersisa
          </span>
        </div>
      )}

      {/* Primary and Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {hasProgress ? (
          <>
            {/* Continue Watching Button */}
            <Link
              href={`/player/${animeId}?ep=${currentEpNum}`}
              prefetch={true}
              className="group relative flex items-center gap-3 px-6 py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer overflow-hidden"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-red-600 shadow-sm group-hover:scale-110 transition-transform">
                <Play className="w-4 h-4 fill-red-600 ml-0.5" />
              </div>
              <div className="text-left">
                <div className="text-xs uppercase tracking-wider font-semibold text-red-100/90 leading-tight">
                  Lanjutkan Menonton
                </div>
                <div className="text-sm sm:text-base font-extrabold leading-tight">
                  Episode {currentEpNum}
                </div>
              </div>

              {/* Progress bar inside button */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
                <div
                  className="h-full bg-white/90"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </Link>

            {/* Restart from beginning / Play Ep 1 */}
            <Link
              href={`/player/${animeId}?ep=1`}
              prefetch={true}
              className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white font-semibold text-sm border border-white/10 hover:border-white/20 backdrop-blur-md transition-all cursor-pointer"
              title="Mulai tonton dari Episode 1"
            >
              <RotateCcw className="w-4 h-4 text-zinc-400 group-hover:rotate-[-45deg] transition-transform" />
              <span>Putar dari Ep 1</span>
            </Link>
          </>
        ) : (
          /* Start Watching Episode 1 Button */
          <Link
            href={`/player/${animeId}?ep=1`}
            prefetch={true}
            className="flex items-center gap-3 px-7 py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-lg hover:shadow-red-600/30 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-red-600 shadow-sm">
              <Play className="w-4 h-4 fill-red-600 ml-0.5" />
            </div>
            <span>Mulai Nonton Episode 1</span>
          </Link>
        )}

        {/* My List / Favorit */}
        <FavoriteButton animeId={animeId} animeTitle={animeTitle} size="md" variant="netflix-list" showLabel={true} />
        <FavoriteButton animeId={animeId} animeTitle={animeTitle} size="md" variant="heart" showLabel={false} />

        {/* Share Button */}
        <button
          onClick={onShare}
          className="p-3.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-white/10 text-white backdrop-blur-md transition-colors cursor-pointer"
          title="Bagikan Anime"
          aria-label="Bagikan Tautan Anime"
        >
          <Share2 className="w-4 h-4 text-zinc-300" />
        </button>
      </div>
    </div>
  );
}
