"use client";

import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AnimeCard from "./AnimeCard";
import { Anime } from "@/types/anime";

interface AnimeRowProps {
  title: string;
  items: Anime[];
  variant?: "portrait" | "continue";
  onPlay?: (anime: Anime) => void;
  onSelect?: (anime: Anime) => void;
}

export default function AnimeRow({
  title,
  items,
  variant = "portrait",
  onPlay,
  onSelect,
}: AnimeRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

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
      const scrollAmount = direction === "left" ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative group/row my-6 sm:my-8 px-4 sm:px-6 lg:px-8">
      {/* Row Title */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <span className="text-xs text-zinc-500 font-medium hover:text-zinc-300 cursor-pointer transition-colors">
          Lihat Semua ({items.length})
        </span>
      </div>

      {/* Row Carousel Area */}
      <div className="relative">
        {/* Left Scroll Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-30 w-10 sm:w-12 bg-gradient-to-r from-black/90 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
            aria-label="Geser ke kiri"
          >
            <div className="p-2 bg-black/60 hover:bg-black/90 rounded-full text-white backdrop-blur-sm border border-white/10">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Scrollable Container */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          className="flex items-center gap-3 sm:gap-4 overflow-x-auto no-scrollbar scroll-smooth py-2"
        >
          {items.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              variant={variant}
              onPlay={onPlay}
              onSelect={onSelect}
            />
          ))}
        </div>

        {/* Right Scroll Arrow */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-30 w-10 sm:w-12 bg-gradient-to-l from-black/90 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
            aria-label="Geser ke kanan"
          >
            <div className="p-2 bg-black/60 hover:bg-black/90 rounded-full text-white backdrop-blur-sm border border-white/10">
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        )}
      </div>
    </section>
  );
}
