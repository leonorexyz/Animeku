"use client";

import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronRight as ChevronSmall } from "lucide-react";
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
  const [scrollProgress, setScrollProgress] = useState(0);

  // Mouse drag-to-scroll states
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftPos, setScrollLeftPos] = useState(0);

  const checkScroll = () => {
    if (rowRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = rowRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);

      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        setScrollProgress(scrollLeft / maxScroll);
      }
    }
  };

  useEffect(() => {
    checkScroll();
  }, [items]);

  const handleScroll = (direction: "left" | "right") => {
    if (rowRef.current) {
      const { clientWidth } = rowRef.current;
      const scrollAmount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScroll, 350);
    }
  };

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rowRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - rowRef.current.offsetLeft);
    setScrollLeftPos(rowRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsMouseDown(false);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !rowRef.current) return;
    e.preventDefault();
    const x = e.pageX - rowRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    rowRef.current.scrollLeft = scrollLeftPos - walk;
    checkScroll();
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="relative group/row my-6 sm:my-8 px-4 sm:px-6 lg:px-8">
      {/* Row Header with Title, Pagination Bar & Explore Link */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2 group-hover/row:text-red-400 transition-colors">
            {title}
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-zinc-800/80 text-[11px] font-medium text-zinc-400 border border-white/5">
            {items.length} Judul
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Scroll progress mini indicator */}
          <div className="hidden md:flex items-center gap-1 w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-600 rounded-full transition-all duration-200"
              style={{
                width: `${Math.max(20, Math.round(scrollProgress * 100))}%`,
              }}
            />
          </div>

          {/* Explore all link */}
          <button className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-0.5 transition-colors group/link cursor-pointer">
            <span>Jelajahi</span>
            <ChevronSmall className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Row Carousel Area */}
      <div className="relative">
        {/* Left Scroll Navigation Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-0 bottom-0 z-30 w-12 sm:w-14 bg-gradient-to-r from-[#141414]/95 via-[#141414]/70 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
            aria-label="Geser ke kiri"
          >
            <div className="p-2.5 bg-black/70 hover:bg-red-600/90 rounded-full text-white backdrop-blur-md border border-white/10 shadow-lg transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </div>
          </button>
        )}

        {/* Scrollable / Draggable Container */}
        <div
          ref={rowRef}
          onScroll={checkScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex items-center gap-3 sm:gap-4.5 overflow-x-auto no-scrollbar scroll-smooth py-2.5 px-0.5 ${
            isMouseDown ? "cursor-grabbing" : "cursor-grab"
          }`}
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

        {/* Right Scroll Navigation Button */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-0 bottom-0 z-30 w-12 sm:w-14 bg-gradient-to-l from-[#141414]/95 via-[#141414]/70 to-transparent flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 hover:scale-105 cursor-pointer"
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
