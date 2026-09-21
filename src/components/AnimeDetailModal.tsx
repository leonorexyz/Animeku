"use client";

import React from "react";
import { X, Play, Plus, Star, Calendar, Clock, Film } from "lucide-react";
import { Anime } from "@/types/anime";

interface AnimeDetailModalProps {
  anime: Anime | null;
  onClose: () => void;
  onPlay?: (anime: Anime) => void;
}

export default function AnimeDetailModal({
  anime,
  onClose,
  onPlay,
}: AnimeDetailModalProps) {
  if (!anime) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-zinc-900 rounded-xl overflow-hidden shadow-2xl border border-zinc-800 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/10 transition-transform hover:scale-110"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Banner Header */}
        <div className="relative h-64 sm:h-72 w-full shrink-0">
          <img
            src={anime.coverUrl}
            alt={anime.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent" />

          {/* Floating Actions on Header */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white drop-shadow-md">
                {anime.title}
              </h2>
              <div className="flex items-center gap-3 mt-2 text-xs font-medium">
                {anime.rating && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {anime.rating}
                  </span>
                )}
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-300">{anime.year}</span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-300">{anime.totalEpisodes} Episode</span>
                <span className="text-zinc-400">•</span>
                <span className="text-emerald-400 font-semibold uppercase">
                  {anime.status === "tamat" ? "Tamat" : "Sedang Tayang"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                onPlay?.(anime);
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold shadow-lg shadow-red-600/30 transition-transform hover:scale-105"
            >
              <Play className="w-4 h-4 fill-white" />
              Putar
            </button>
          </div>
        </div>

        {/* Modal Content Scrollable Area */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Synopsis */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
              Sinopsis
            </h4>
            <p className="text-zinc-300 text-sm sm:text-base leading-relaxed">
              {anime.synopsis}
            </p>
          </div>

          {/* Genres */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-2">
              Genre & Kategori
            </h4>
            <div className="flex flex-wrap gap-2">
              {anime.genres.map((g) => (
                <span
                  key={g}
                  className="text-xs bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full border border-zinc-700"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>

          {/* Mock Episode List preview */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold mb-3">
              Daftar Episode ({anime.totalEpisodes})
            </h4>
            <div className="space-y-2">
              {[1, 2, 3].map((epNum) => (
                <div
                  key={epNum}
                  onClick={() => {
                    onClose();
                    onPlay?.(anime);
                  }}
                  className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/50 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-zinc-500 group-hover:text-red-400 w-6">
                      {epNum}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-red-400">
                        Episode {epNum}
                      </p>
                      <p className="text-xs text-zinc-400">24 Menit • 1080p</p>
                    </div>
                  </div>
                  <Play className="w-4 h-4 text-zinc-400 group-hover:text-white" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
