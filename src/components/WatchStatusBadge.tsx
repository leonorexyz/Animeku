"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CheckCircle2,
  PlayCircle,
  EyeOff,
  ChevronDown,
  Check,
  RotateCcw,
} from "lucide-react";
import {
  UserWatchStatus,
  WatchStatusMeta,
  getAnimeWatchStatus,
  setAnimeWatchStatus,
} from "@/utils/watchStatus";
import { WatchProgress } from "@/types/anime";

interface WatchStatusBadgeProps {
  animeId: string;
  progress?: WatchProgress | null;
  fallbackStatus?: string;
  size?: "xs" | "sm" | "md" | "lg";
  interactive?: boolean;
  showDropdown?: boolean;
  className?: string;
  onStatusChange?: (status: UserWatchStatus) => void;
}

const STATUS_OPTIONS: { status: UserWatchStatus; label: string; desc: string }[] = [
  {
    status: "unwatched",
    label: "Belum Ditonton",
    desc: "Tandai anime ini belum pernah ditonton",
  },
  {
    status: "watching",
    label: "Sedang Ditonton",
    desc: "Tandai anime sedang aktif ditonton",
  },
  {
    status: "completed",
    label: "Selesai Ditonton",
    desc: "Tandai semua episode telah selesai ditonton",
  },
];

export default function WatchStatusBadge({
  animeId,
  progress,
  fallbackStatus,
  size = "sm",
  interactive = false,
  showDropdown = false,
  className = "",
  onStatusChange,
}: WatchStatusBadgeProps) {
  const [meta, setMeta] = useState<WatchStatusMeta>(() =>
    getAnimeWatchStatus(animeId, progress, fallbackStatus)
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMeta(getAnimeWatchStatus(animeId, progress, fallbackStatus));

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent<{
        animeId: string;
        status?: UserWatchStatus;
        progress?: WatchProgress | null;
      }>;
      if (custom.detail && custom.detail.animeId === animeId) {
        const liveProg =
          custom.detail.progress !== undefined ? custom.detail.progress : progress;
        setMeta(getAnimeWatchStatus(animeId, liveProg, fallbackStatus));
      }
    };

    window.addEventListener("animeku:watch_status_updated", handleUpdate);
    window.addEventListener("animeku:progress_updated", handleUpdate);

    return () => {
      window.removeEventListener("animeku:watch_status_updated", handleUpdate);
      window.removeEventListener("animeku:progress_updated", handleUpdate);
    };
  }, [animeId, progress, fallbackStatus]);

  // Handle outside click to close dropdown menu
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleSelectStatus = (newStatus: UserWatchStatus, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const updated = setAnimeWatchStatus(animeId, newStatus);
    setMeta(updated);
    setIsMenuOpen(false);
    onStatusChange?.(newStatus);
  };

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (showDropdown) {
      setIsMenuOpen((prev) => !prev);
      return;
    }
    // Simple 3-state cycle on single click if interactive without dropdown
    const order: UserWatchStatus[] = ["unwatched", "watching", "completed"];
    const currentIndex = order.indexOf(meta.status);
    const nextStatus = order[(currentIndex + 1) % order.length];
    handleSelectStatus(nextStatus);
  };

  const getStatusIcon = (status: UserWatchStatus, sz: string) => {
    const iconClass = sz === "xs" ? "w-2.5 h-2.5" : sz === "sm" ? "w-3 h-3" : "w-3.5 h-3.5";
    switch (status) {
      case "completed":
        return <CheckCircle2 className={`${iconClass} text-emerald-400`} />;
      case "watching":
        return <PlayCircle className={`${iconClass} text-amber-400 animate-pulse`} />;
      case "unwatched":
      default:
        return <EyeOff className={`${iconClass} text-zinc-400`} />;
    }
  };

  const sizeStyles = {
    xs: "text-[9px] px-1.5 py-0.5 gap-1 font-semibold",
    sm: "text-[10px] sm:text-xs px-2 py-0.5 gap-1.5 font-semibold",
    md: "text-xs px-2.5 py-1 gap-2 font-bold",
    lg: "text-sm px-3.5 py-1.5 gap-2.5 font-bold",
  };

  return (
    <div className={`relative inline-block ${className}`} ref={menuRef}>
      <button
        type="button"
        disabled={!interactive && !showDropdown}
        onClick={interactive || showDropdown ? cycleStatus : undefined}
        title={
          interactive || showDropdown
            ? `Status Tontonan: ${meta.label} (Klik untuk mengubah)`
            : `Status Tontonan: ${meta.label}`
        }
        className={`inline-flex items-center rounded-md border backdrop-blur-md transition-all select-none ${
          sizeStyles[size]
        } ${meta.badgeClass} ${
          interactive || showDropdown
            ? "cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
            : "cursor-default"
        }`}
      >
        {getStatusIcon(meta.status, size)}
        <span className="truncate">{meta.label}</span>
        {showDropdown && (
          <ChevronDown
            className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
              isMenuOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {/* Interactive Status Selector Dropdown */}
      {showDropdown && isMenuOpen && (
        <div
          role="menu"
          aria-label="Pilih Status Tontonan"
          className="absolute left-0 mt-1.5 w-56 bg-zinc-900/95 border border-zinc-700/80 rounded-xl shadow-2xl backdrop-blur-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-2 py-1.5 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            Ubah Status Tontonan
          </div>
          <div className="py-1 space-y-0.5">
            {STATUS_OPTIONS.map((opt) => {
              const isSelected = meta.status === opt.status;
              return (
                <button
                  key={opt.status}
                  role="menuitem"
                  type="button"
                  onClick={(e) => handleSelectStatus(opt.status, e)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected
                      ? "bg-red-600/20 text-white font-bold border border-red-500/40"
                      : "text-zinc-300 hover:bg-zinc-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {getStatusIcon(opt.status, "sm")}
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[10px] text-zinc-400 font-normal">
                        {opt.desc}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-red-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
