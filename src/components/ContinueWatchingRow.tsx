"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, PlayCircle, Sparkles } from "lucide-react";
import ContinueWatchingCard from "./ContinueWatchingCard";
import { Anime } from "@/types/anime";

interface ContinueWatchingRowProps {
  items: Anime[];
  onPlay?: (anime: Anime) => void;
  onSelect?: (anime: Anime) => void;
}

export default function ContinueWatchingRow({
  items: initialItems,
  onPlay,
  onSelect,
}: ContinueWatchingRowProps) {
  const [items, setItems] = useState<Anime[]>(initialItems);
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Sync state if props change
  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  const handleRemove = (animeId: string) => {
    setItems((prev) => prev.filter((a) => a.id !== animeId));
  };

  if (items.length === 0) return null;

  return (
    <section className="relative group/continue my-6 sm:my-8 px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
            </span>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              Lanjut Nonton untuk Kamu
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-[11px] font-bold text-red-400 border border-red-500/20">
            {items.length} Episode Menunggu
          </span>
        </div>

        <span className="text-xs text-zinc-400 font-medium">
          Tersimpan otomatis
        </span>
      </div>

      {/* Row Carousel Area */}
      <div className="relative">
        {/* Left Scroll Navigation */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-30 w-12 sm:w-14 bg-gradient-to-r from-[#141414]/95 via-[#141414]/70 to-transparent flex items-center justify-center opacity-0 group-hover/continue:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
            aria-label="Geser ke kiri"
          >
            <div className="p-2.5 bg-black/70 hover:bg-red-600/90 rounded-full text-white backdrop-blur-md border border-white/10 shadow-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2 px-0.5"
        >
          {items.map((anime) => (
            <ContinueWatchingCard
              key={anime.id}
              anime={anime}
              onPlay={onPlay}
              onSelect={onSelect}
              onRemove={handleRemove}
            />
          ))}
        </div>

        {/* Right Scroll Navigation */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-30 w-12 sm:w-14 bg-gradient-to-l from-[#141414]/95 via-[#141414]/70 to-transparent flex items-center justify-center opacity-0 group-hover/continue:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
            aria-label="Geser ke kanan"
          >
            <div className="p-2.5 bg-black/70 hover:bg-red-600/90 rounded-full text-white backdrop-blur-md border border-white/10 shadow-lg transition-colors">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
