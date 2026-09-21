"use client";

import React from "react";
import Link from "next/link";
import {
  SearchX,
  RotateCcw,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Film,
} from "lucide-react";
import { Anime } from "@/types/anime";
import AnimeCard from "@/components/AnimeCard";

interface SearchEmptyStateProps {
  query?: string;
  hasActiveFilters?: boolean;
  onResetFilters: () => void;
  recommendations: Anime[];
  onSelectAnime: (anime: Anime) => void;
}

export default function SearchEmptyState({
  query,
  hasActiveFilters,
  onResetFilters,
  recommendations,
  onSelectAnime,
}: SearchEmptyStateProps) {
  return (
    <div className="space-y-10 py-6">
      {/* Empty State Banner */}
      <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 border border-zinc-800/80 rounded-2xl space-y-6 shadow-xl backdrop-blur-md">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-zinc-400 shadow-inner">
            <SearchX className="w-10 h-10 text-red-500" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="space-y-2 max-w-lg">
          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Tidak Ditemukan Judul Anime yang Cocok
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            {query ? (
              <>
                Pencarian untuk <strong className="text-white">"{query}"</strong>{" "}
                tidak membuahkan hasil.
              </>
            ) : hasActiveFilters ? (
              "Kombinasi filter genre, tahun, atau status yang Anda tentukan belum memiliki anime yang sesuai."
            ) : (
              "Katalog saat ini belum memiliki konten untuk kriteria yang dipilih."
            )}
          </p>
        </div>

        {/* Tips Box */}
        <div className="bg-black/40 border border-zinc-800/80 rounded-xl p-4 text-left max-w-md w-full space-y-2 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 font-bold text-zinc-300">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Saran Pencarian:</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[11px] text-zinc-400 leading-relaxed">
            <li>Periksa kembali kemungkinan salah ketik (typo) pada judul anime.</li>
            <li>Gunakan nama umum, singkatan, atau kata kunci genre (misal: "Action", "Titan").</li>
            <li>Coba kurangi atau reset filter tahun dan genre untuk memperluas hasil.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={onResetFilters}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-lg hover:shadow-red-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Semua Filter</span>
          </button>

          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs sm:text-sm font-semibold rounded-xl border border-zinc-700/80 transition-colors"
          >
            <span>Kembali ke Beranda</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recommended Alternative Anime */}
      {recommendations.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-white">
              <Film className="w-4 h-4 text-red-500" />
              <span>Mungkin Anda Tertarik Menonton Ini:</span>
            </div>
            <span className="text-xs text-zinc-500 font-medium">
              Pilihan Populer
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {recommendations.slice(0, 6).map((anime) => (
              <div key={anime.id} className="flex justify-center">
                <AnimeCard
                  anime={anime}
                  variant="portrait"
                  onSelect={onSelectAnime}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
