"use client";

import React from "react";
import { CheckCircle2, PlayCircle, EyeOff, Layers } from "lucide-react";
import { UserWatchStatus } from "@/utils/watchStatus";

export type FilterWatchStatus = "all" | UserWatchStatus;

interface WatchStatusFilterProps {
  activeStatus: FilterWatchStatus;
  onChange: (status: FilterWatchStatus) => void;
  counts?: {
    all?: number;
    unwatched?: number;
    watching?: number;
    completed?: number;
  };
  size?: "sm" | "md";
  className?: string;
}

const FILTER_ITEMS: {
  status: FilterWatchStatus;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  activeColor: string;
  badgeDot: string;
}[] = [
  {
    status: "all",
    label: "Semua Status Tontonan",
    shortLabel: "Semua",
    icon: Layers,
    activeColor: "bg-red-600 text-white shadow-lg shadow-red-600/30 border-red-500",
    badgeDot: "bg-red-400",
  },
  {
    status: "watching",
    label: "Sedang Ditonton",
    shortLabel: "Sedang Nonton",
    icon: PlayCircle,
    activeColor: "bg-amber-600/90 text-white shadow-lg shadow-amber-600/30 border-amber-500",
    badgeDot: "bg-amber-400",
  },
  {
    status: "completed",
    label: "Selesai Ditonton",
    shortLabel: "Selesai",
    icon: CheckCircle2,
    activeColor: "bg-emerald-600/90 text-white shadow-lg shadow-emerald-600/30 border-emerald-500",
    badgeDot: "bg-emerald-400",
  },
  {
    status: "unwatched",
    label: "Belum Ditonton",
    shortLabel: "Belum Nonton",
    icon: EyeOff,
    activeColor: "bg-zinc-700 text-white shadow-lg shadow-black/40 border-zinc-500",
    badgeDot: "bg-zinc-400",
  },
];

export default function WatchStatusFilter({
  activeStatus,
  onChange,
  counts,
  size = "md",
  className = "",
}: WatchStatusFilterProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-xs sm:text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
  };

  return (
    <div
      role="radiogroup"
      aria-label="Filter status tontonan"
      className={`flex flex-wrap items-center gap-2 ${className}`}
    >
      {FILTER_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeStatus === item.status;
        const count = counts ? counts[item.status] : undefined;

        return (
          <button
            key={item.status}
            role="radio"
            aria-checked={isActive}
            type="button"
            onClick={() => onChange(item.status)}
            className={`group inline-flex items-center font-bold rounded-xl border transition-all duration-200 cursor-pointer select-none ${
              sizeClasses[size]
            } ${
              isActive
                ? `${item.activeColor} scale-[1.02]`
                : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/20"
            }`}
          >
            <Icon className={`${iconSizes[size]} ${isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-200"}`} />
            <span className="hidden sm:inline">{item.label}</span>
            <span className="sm:hidden">{item.shortLabel}</span>

            {typeof count === "number" && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? "bg-black/40 text-white"
                    : "bg-zinc-800 text-zinc-400 group-hover:bg-zinc-700 group-hover:text-zinc-200"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
