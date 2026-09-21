"use client";

import { WatchProgress } from "@/types/anime";
import { getAllWatchProgress } from "./watchProgress";

export type UserWatchStatus = "unwatched" | "watching" | "completed";

export interface WatchStatusMeta {
  status: UserWatchStatus;
  label: string;
  badgeClass: string;
  dotColor: string;
  episodeNumber?: number;
  percent?: number;
}

const STATUS_STORAGE_KEY = "animeku_user_watch_status";

/**
 * Get all manual watch status overrides saved by the user
 */
export function getAllUserWatchStatuses(): Record<string, UserWatchStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STATUS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Failed to load watch status from localStorage", err);
    return {};
  }
}

/**
 * Calculate the effective watch status for an anime:
 * 1. Checks explicit user choice first.
 * 2. If none, calculates from watchProgress (localStorage or prop).
 * 3. Falls back to anime.status or "unwatched".
 */
export function getAnimeWatchStatus(
  animeId: string,
  progressProp?: WatchProgress | null,
  fallbackStatus?: string
): WatchStatusMeta {
  const manualStatuses = getAllUserWatchStatuses();
  const explicit = manualStatuses[animeId];

  // If user explicitly marked it
  if (explicit) {
    return formatWatchStatusMeta(explicit, progressProp);
  }

  // Calculate from watch progress
  const allProgress = getAllWatchProgress();
  const prog = progressProp || allProgress[animeId];

  if (prog) {
    if (prog.isCompleted) {
      return formatWatchStatusMeta("completed", prog);
    }
    if (prog.positionSeconds > 0) {
      return formatWatchStatusMeta("watching", prog);
    }
  }

  // Fallback to anime catalog status if applicable
  if (fallbackStatus === "tamat" && !prog) {
    // Release is finished, but user hasn't watched yet
    return formatWatchStatusMeta("unwatched");
  }

  return formatWatchStatusMeta("unwatched");
}

/**
 * Formats status enum into user-friendly Indonesian labels and styles
 */
export function formatWatchStatusMeta(
  status: UserWatchStatus,
  prog?: WatchProgress | null
): WatchStatusMeta {
  const percent =
    prog && prog.durationSeconds > 0
      ? Math.round((prog.positionSeconds / prog.durationSeconds) * 100)
      : undefined;

  switch (status) {
    case "completed":
      return {
        status: "completed",
        label: "Selesai Ditonton",
        badgeClass:
          "bg-emerald-950/80 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/90",
        dotColor: "bg-emerald-400",
        episodeNumber: prog?.episodeNumber,
        percent: 100,
      };
    case "watching":
      return {
        status: "watching",
        label: prog?.episodeNumber
          ? `Sedang Ditonton (Ep ${prog.episodeNumber})`
          : "Sedang Ditonton",
        badgeClass:
          "bg-amber-950/80 text-amber-400 border-amber-500/30 hover:bg-amber-900/90",
        dotColor: "bg-amber-400",
        episodeNumber: prog?.episodeNumber,
        percent,
      };
    case "unwatched":
    default:
      return {
        status: "unwatched",
        label: "Belum Ditonton",
        badgeClass:
          "bg-zinc-900/80 text-zinc-400 border-zinc-700/50 hover:bg-zinc-800/90",
        dotColor: "bg-zinc-500",
      };
  }
}

/**
 * Explicitly update the user's watch status for an anime
 */
export function setAnimeWatchStatus(
  animeId: string,
  status: UserWatchStatus
): WatchStatusMeta {
  if (typeof window === "undefined") {
    return formatWatchStatusMeta(status);
  }

  try {
    const current = getAllUserWatchStatuses();
    current[animeId] = status;
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(current));

    const meta = formatWatchStatusMeta(status);

    // Dispatch global event so all cards & details update simultaneously
    window.dispatchEvent(
      new CustomEvent("animeku:watch_status_updated", {
        detail: { animeId, status, meta },
      })
    );

    return meta;
  } catch (err) {
    console.error("Failed to save watch status", err);
    return formatWatchStatusMeta(status);
  }
}
