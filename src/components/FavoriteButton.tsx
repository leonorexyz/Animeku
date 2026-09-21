"use client";

import React, { useState, useEffect } from "react";
import { Plus, Check, Heart } from "lucide-react";
import { isAnimeFavorite, toggleFavoriteAnime } from "@/utils/favorites";

interface FavoriteButtonProps {
  animeId: string;
  animeTitle?: string;
  variant?: "netflix-list" | "heart";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  onFavoriteChange?: (isFav: boolean) => void;
}

export default function FavoriteButton({
  animeId,
  animeTitle,
  variant = "netflix-list",
  size = "md",
  showLabel = true,
  className = "",
  onFavoriteChange,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    setIsFavorite(isAnimeFavorite(animeId));

    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<{
        animeId: string;
        isFavorite: boolean;
      }>;
      if (customEvent.detail && customEvent.detail.animeId === animeId) {
        setIsFavorite(customEvent.detail.isFavorite);
      }
    };

    window.addEventListener("animeku:favorites_updated", handleSync);
    return () => {
      window.removeEventListener("animeku:favorites_updated", handleSync);
    };
  }, [animeId]);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAnimating(true);
    const newStatus = toggleFavoriteAnime(animeId);
    setIsFavorite(newStatus);
    onFavoriteChange?.(newStatus);

    const titleText = animeTitle ? `"${animeTitle}"` : "Anime";
    setToastMsg(
      newStatus
        ? `${titleText} ditambahkan ke Daftar Saya`
        : `${titleText} dihapus dari Daftar Saya`
    );

    setTimeout(() => setIsAnimating(false), 350);
    setTimeout(() => setToastMsg(null), 2500);
  };

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-4 py-3 text-sm gap-2",
    lg: "px-5 py-3.5 text-base gap-2.5",
  };

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleToggle}
        aria-pressed={isFavorite}
        aria-label={
          isFavorite ? "Hapus dari Daftar Saya" : "Tambah ke Daftar Saya"
        }
        title={isFavorite ? "Hapus dari Daftar Saya" : "Tambah ke Daftar Saya"}
        className={`group flex items-center justify-center font-semibold rounded-xl border backdrop-blur-md transition-all duration-200 cursor-pointer select-none ${
          sizeClasses[size]
        } ${
          isFavorite
            ? "bg-red-600/15 border-red-500/60 text-red-400 hover:bg-red-600/25 hover:border-red-400 shadow-sm shadow-red-500/10"
            : "bg-zinc-900/90 border-white/10 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-white/20"
        } ${isAnimating ? "scale-95" : "hover:scale-[1.02]"} ${className}`}
      >
        {variant === "netflix-list" ? (
          <div
            className={`transition-all duration-300 transform flex items-center justify-center ${
              isAnimating ? "rotate-90 scale-125" : "rotate-0 scale-100"
            }`}
          >
            {isFavorite ? (
              <Check
                className={`${iconSizes[size]} text-red-400 stroke-[2.5]`}
              />
            ) : (
              <Plus
                className={`${iconSizes[size]} text-zinc-300 group-hover:text-white stroke-[2.5]`}
              />
            )}
          </div>
        ) : (
          <div
            className={`transition-all duration-300 transform flex items-center justify-center ${
              isAnimating ? "scale-130" : "scale-100"
            }`}
          >
            <Heart
              className={`${iconSizes[size]} ${
                isFavorite
                  ? "fill-red-500 text-red-500"
                  : "text-zinc-300 group-hover:text-white"
              }`}
            />
          </div>
        )}

        {showLabel && (
          <span className="font-semibold tracking-wide">
            {isFavorite ? "Tersimpan" : "Daftar Saya"}
          </span>
        )}
      </button>

      {/* Floating mini toast message */}
      {toastMsg && (
        <div
          role="status"
          className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 whitespace-nowrap px-2.5 py-1 bg-zinc-900/95 border border-zinc-700 text-zinc-200 text-[11px] font-medium rounded-md shadow-xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
