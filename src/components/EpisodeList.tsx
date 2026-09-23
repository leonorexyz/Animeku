"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Play, CheckCircle2, Clock, Check, RotateCcw } from "lucide-react";
import { ExtendedEpisode } from "@/data/mockEpisodes";
import { WatchProgress } from "@/types/anime";

interface EpisodeListProps {
  episodes: ExtendedEpisode[];
  progressMap?: Record<string, WatchProgress>;
  currentEpisodeId?: string;
  animeId?: string;
  onPlayEpisode?: (episode: ExtendedEpisode) => void;
  onToggleCompleted?: (episodeId: string) => void;
}

export default function EpisodeList({
  episodes,
  progressMap = {},
  currentEpisodeId,
  animeId,
  onPlayEpisode,
  onToggleCompleted,
}: EpisodeListProps) {
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [filterStatus, setFilterStatus] = useState<"all" | "unwatched" | "watching" | "completed">("all");

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} mnt`;
  };

  const filteredEpisodes = episodes.filter((ep) => {
    const prog = progressMap[ep.id];
    if (filterStatus === "completed") return prog?.isCompleted;
    if (filterStatus === "watching") return prog && !prog.isCompleted && prog.positionSeconds > 0;
    if (filterStatus === "unwatched") return !prog || prog.positionSeconds === 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Season and Filter Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2">
            <span>Daftar Episode</span>
            <span className="text-xs bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded-full border border-white/10">
              {episodes.length} Total
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Klik episode untuk memutar langsung di pemutar
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800 text-xs">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterStatus === "all"
                  ? "bg-red-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilterStatus("watching")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterStatus === "watching"
                  ? "bg-red-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Sedang Nonton
            </button>
            <button
              onClick={() => setFilterStatus("completed")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors cursor-pointer ${
                filterStatus === "completed"
                  ? "bg-red-600 text-white shadow"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Selesai
            </button>
          </div>

          {/* Season Selector */}
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-red-500 cursor-pointer"
          >
            <option value={1}>Musim 1</option>
            <option value={2}>Musim 2 (Segera)</option>
          </select>
        </div>
      </div>

      {/* Episodes Grid */}
      {filteredEpisodes.length === 0 ? (
        <div className="py-12 text-center text-zinc-500 text-xs sm:text-sm">
          Tidak ada episode dengan filter yang dipilih.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredEpisodes.map((ep) => {
            const prog = progressMap[ep.id];
            const isCompleted = !!prog?.isCompleted;
            const hasProgress = !!prog && !isCompleted && prog.positionSeconds > 0;
            const percent =
              hasProgress && prog.durationSeconds > 0
                ? Math.min(100, Math.round((prog.positionSeconds / prog.durationSeconds) * 100))
                : 0;

            const isCurrentPlaying = currentEpisodeId === ep.id;
            const targetUrl = `/player/${animeId || ep.animeId}?ep=${ep.episodeNumber}`;

            return (
              <a
                key={ep.id}
                href={targetUrl}
                onClick={(e) => {
                  e.preventDefault();
                  if (onPlayEpisode) {
                    onPlayEpisode(ep);
                  } else {
                    window.location.href = targetUrl;
                  }
                }}
                className={`group relative bg-zinc-900/80 hover:bg-zinc-800/90 border rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer flex flex-col ${
                  isCurrentPlaying
                    ? "border-red-500 ring-2 ring-red-500/30"
                    : isCompleted
                    ? "border-emerald-500/40"
                    : "border-zinc-800/80 hover:border-red-500/50"
                }`}
              >
                {/* Thumbnail with Overlay & Progress Bar */}
                <div className="relative aspect-video w-full overflow-hidden bg-zinc-950 pointer-events-none select-none">
                  <img
                    src={ep.thumbnailUrl}
                    alt={ep.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                    <div className="w-10 h-10 rounded-full bg-red-600/90 group-hover:bg-red-600 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                      <Play className="w-5 h-5 fill-white text-white ml-0.5" />
                    </div>
                  </div>

                  {/* Duration Badge */}
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[11px] font-mono text-zinc-300">
                    {formatDuration(ep.durationSeconds || 1440)}
                  </span>

                  {/* Status Badges on Thumbnail */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5">
                    {isCompleted && (
                      <span className="flex items-center gap-1 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                        <CheckCircle2 className="w-3 h-3" />
                        Selesai
                      </span>
                    )}
                    {hasProgress && (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                        {percent}%
                      </span>
                    )}
                  </div>

                  {/* Red Progress Bar at Bottom of Thumbnail */}
                  {hasProgress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700/80">
                      <div
                        className="h-full bg-red-600 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Episode Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between pointer-events-none select-none">
                  <div>
                    <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                      <span className="font-bold text-red-400">
                        Episode {ep.episodeNumber}
                      </span>
                      <span className="text-[10px] uppercase bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-white/5">
                        {ep.sourceType === "drive"
                          ? "Drive"
                          : ep.sourceType === "local"
                          ? "Lokal"
                          : "HD Stream"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">
                      {ep.title}
                    </h4>

                    <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">
                      {ep.synopsis}
                    </p>
                  </div>

                  {/* Watch Status Footer */}
                  {hasProgress && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-400">
                      <span className="text-red-400 font-mono">
                        Menit {Math.floor(prog.positionSeconds / 60)} / {Math.floor(prog.durationSeconds / 60)}
                      </span>
                      <span className="text-[10px] text-zinc-500">Lanjutkan</span>
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
