"use client";

import React, { useState } from "react";
import { Star, Check, Sparkles, Film, Heart } from "lucide-react";

export type CardSizeOption = "small" | "medium" | "large";

interface CardSizeSelectorProps {
  currentSize: CardSizeOption;
  onChange: (size: CardSizeOption) => void;
  className?: string;
}

export default function CardSizeSelector({
  currentSize,
  onChange,
  className = "",
}: CardSizeSelectorProps) {
  const [hoveredSize, setHoveredSize] = useState<CardSizeOption | null>(null);

  const activeSize = hoveredSize || currentSize;

  const sizeOptions: {
    id: CardSizeOption;
    label: string;
    badge: string;
    desc: string;
    widthClass: string;
    previewWidth: number;
    previewHeight: number;
  }[] = [
    {
      id: "small",
      label: "Kecil (Ringkas)",
      badge: "Kompak",
      desc: "Menampilkan lebih banyak judul sekaligus di satu baris layar.",
      widthClass: "w-[140px] sm:w-[160px]",
      previewWidth: 140,
      previewHeight: 210,
    },
    {
      id: "medium",
      label: "Sedang (Standar)",
      badge: "Bawaan",
      desc: "Proporsi seimbang sinematik ala antarmuka resmi Netflix.",
      widthClass: "w-[175px] sm:w-[200px]",
      previewWidth: 175,
      previewHeight: 260,
    },
    {
      id: "large",
      label: "Besar (Lebar)",
      badge: "Visual Maksimal",
      desc: "Detail poster lebih tajam, jelas, dan memukau.",
      widthClass: "w-[210px] sm:w-[245px]",
      previewWidth: 215,
      previewHeight: 320,
    },
  ];

  const currentOption = sizeOptions.find((s) => s.id === activeSize) || sizeOptions[1];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Selection Option Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sizeOptions.map((opt) => {
          const isSelected = currentSize === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange(opt.id)}
              onMouseEnter={() => setHoveredSize(opt.id)}
              onMouseLeave={() => setHoveredSize(null)}
              className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "border-red-500 bg-red-950/20 shadow-md shadow-red-900/20"
                  : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  {opt.label}
                </span>
                {isSelected ? (
                  <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                ) : (
                  <span className="text-[10px] font-medium text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
                    {opt.badge}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Live Card Preview Box */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 shadow-inner flex flex-col items-center justify-center overflow-hidden min-h-[360px]">
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/10 text-red-400 border border-red-500/20 text-xs font-semibold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pratinjau Langsung (Live Preview)</span>
          </div>
          <p className="text-xs text-zinc-400">
            Berikut simulasi ukuran kartu poster anime di rak beranda saat ini ({currentOption.label}):
          </p>
        </div>

        {/* Dynamic Card Container with smooth resizing */}
        <div className="transition-all duration-300 ease-out flex items-center justify-center">
          <div
            style={{ width: `${currentOption.previewWidth}px` }}
            className="group relative rounded-xl overflow-hidden cursor-pointer select-none border border-white/10 shadow-2xl bg-zinc-900 transition-all duration-300 hover:scale-105 hover:border-red-500/50"
          >
            {/* Poster Image */}
            <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-800">
              <img
                src="https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600"
                alt="Pratinjau Anime"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />

              {/* Rating Badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/80 backdrop-blur-sm text-amber-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                8.9
              </div>

              {/* Favorite Button Icon */}
              <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-red-500 border border-white/10">
                <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              </div>

              {/* Title & Info overlay at bottom */}
              <div className="absolute bottom-2 left-2 right-2">
                <div className="text-xs font-bold text-white truncate drop-shadow-md">
                  Demon Slayer: Swordsmith
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-300 mt-0.5">
                  <span className="text-emerald-400 font-bold">98% Match</span>
                  <span>•</span>
                  <span>2024</span>
                  <span>•</span>
                  <span className="border border-zinc-600 px-1 py-0.2 rounded text-[9px]">1080p</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dimension indicator badge */}
        <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500 font-mono">
          <span>Lebar: ~{currentOption.previewWidth}px</span>
          <span>•</span>
          <span>Tinggi: ~{currentOption.previewHeight}px</span>
        </div>
      </div>
    </div>
  );
}