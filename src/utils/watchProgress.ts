import { WatchProgress } from "@/types/anime";

const STORAGE_KEY = "animeku_watch_progress";
const STATUS_STORAGE_KEY = "animeku_user_watch_status";

export function getAllWatchProgress(): Record<string, WatchProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error("Failed to load watch progress from localStorage", err);
    return {};
  }
}

export function getWatchProgressForAnime(animeId: string): WatchProgress | null {
  const all = getAllWatchProgress();
  return all[animeId] || null;
}

export function saveWatchProgress(progress: {
  animeId: string;
  animeTitle: string;
  animePoster?: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  positionSeconds: number;
  durationSeconds: number;
  isCompleted?: boolean;
}): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllWatchProgress();
    const isCompleted =
      progress.isCompleted !== undefined
        ? progress.isCompleted
        : progress.durationSeconds > 0 &&
          progress.positionSeconds / progress.durationSeconds >= 0.9;

    const item: WatchProgress = {
      id: `prog-${progress.animeId}-${progress.episodeId}`,
      animeId: progress.animeId,
      animeTitle: progress.animeTitle,
      animePoster: progress.animePoster || "",
      episodeId: progress.episodeId,
      episodeNumber: progress.episodeNumber,
      episodeTitle: progress.episodeTitle,
      positionSeconds: Math.floor(progress.positionSeconds),
      durationSeconds: Math.floor(progress.durationSeconds),
      isCompleted,
      lastWatchedAt: new Date().toISOString(),
    };

    all[progress.animeId] = item;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // Automatically transition watch status based on progress
    const autoStatus: "completed" | "watching" = isCompleted ? "completed" : "watching";
    try {
      const statusRaw = localStorage.getItem(STATUS_STORAGE_KEY);
      const statuses = statusRaw ? JSON.parse(statusRaw) : {};
      statuses[progress.animeId] = autoStatus;
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(statuses));
    } catch (e) {
      console.warn("Failed to auto-update watch status", e);
    }

    // Dispatch global events for instant reactivity across cards, badges, and modals
    window.dispatchEvent(
      new CustomEvent("animeku:progress_updated", {
        detail: {
          animeId: progress.animeId,
          progress: item,
          episodeId: progress.episodeId,
        },
      })
    );

    window.dispatchEvent(
      new CustomEvent("animeku:watch_status_updated", {
        detail: {
          animeId: progress.animeId,
          status: autoStatus,
          autoUpdated: true,
          progress: item,
        },
      })
    );

    // Sync with backend API asynchronously
    fetch(`/api/anime/${progress.animeId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        episodeId: progress.episodeId,
        episodeNumber: progress.episodeNumber,
        positionSeconds: item.positionSeconds,
        durationSeconds: item.durationSeconds,
        isCompleted: item.isCompleted,
      }),
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to save watch progress to localStorage", err);
  }
}

export function removeWatchProgress(animeId: string): void {
  if (typeof window === "undefined") return;
  try {
    const all = getAllWatchProgress();
    delete all[animeId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    // Reset watch status to unwatched
    try {
      const statusRaw = localStorage.getItem(STATUS_STORAGE_KEY);
      const statuses = statusRaw ? JSON.parse(statusRaw) : {};
      delete statuses[animeId];
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(statuses));
    } catch (e) {}

    // Dispatch global events
    window.dispatchEvent(
      new CustomEvent("animeku:progress_updated", {
        detail: { animeId, progress: null },
      })
    );

    window.dispatchEvent(
      new CustomEvent("animeku:watch_status_updated", {
        detail: {
          animeId,
          status: "unwatched",
          autoUpdated: true,
          progress: null,
        },
      })
    );

    // Sync deletion with backend API asynchronously
    fetch(`/api/anime/${animeId}/progress`, {
      method: "DELETE",
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to remove watch progress from localStorage", err);
  }
}
