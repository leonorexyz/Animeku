import { db } from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type AnimeStatus = "belum" | "sedang" | "tamat";
export type UserWatchStatus = "unwatched" | "watching" | "completed";

export interface AutoUpdateStatusResult {
  animeId: string;
  previousStatus: AnimeStatus;
  newStatus: AnimeStatus;
  watchStatus: UserWatchStatus;
  completedEpisodesCount: number;
  totalEpisodesCount: number;
}

/**
 * Konversi UserWatchStatus (inggris) ke status katalog (indonesia)
 */
export function mapWatchStatusToAnimeStatus(ws: UserWatchStatus): AnimeStatus {
  switch (ws) {
    case "completed":
      return "tamat";
    case "watching":
      return "sedang";
    case "unwatched":
    default:
      return "belum";
  }
}

/**
 * Konversi status katalog (indonesia) ke UserWatchStatus (inggris)
 */
export function mapAnimeStatusToWatchStatus(status: AnimeStatus): UserWatchStatus {
  switch (status) {
    case "tamat":
      return "completed";
    case "sedang":
      return "watching";
    case "belum":
    default:
      return "unwatched";
  }
}

/**
 * Service untuk memperbarui status tontonan anime secara otomatis
 * berdasarkan agregasi progres dari setiap episode.
 * 
 * Aturan kalkulasi:
 * 1. Jika seluruh episode telah selesai (isCompleted = true) -> "tamat" / "completed"
 * 2. Jika ada episode yang sedang ditonton (posisi > 0) atau selesai sebagian -> "sedang" / "watching"
 * 3. Jika belum ada satupun episode yang ditonton -> "belum" / "unwatched"
 */
export async function syncAnimeWatchStatusFromProgress(
  animeId: string,
  userId: string = "user-default"
): Promise<AutoUpdateStatusResult> {
  const [animeRecord] = await db
    .select()
    .from(schema.anime)
    .where(eq(schema.anime.id, animeId))
    .limit(1);

  if (!animeRecord) {
    throw new Error(`Anime dengan ID ${animeId} tidak ditemukan`);
  }

  const previousStatus = (animeRecord.status as AnimeStatus) || "belum";

  // Ambil seluruh episode dari anime ini
  const animeEpisodes = await db
    .select()
    .from(schema.episodes)
    .where(eq(schema.episodes.animeId, animeId));

  // Ambil rekaman progres tontonan user untuk anime ini
  const progressList = await db
    .select()
    .from(schema.watchProgress)
    .where(
      and(
        eq(schema.watchProgress.animeId, animeId),
        eq(schema.watchProgress.userId, userId)
      )
    );

  const totalEpisodes = animeEpisodes.length || animeRecord.totalEpisodes || 1;
  const completedEpisodes = progressList.filter((p) => p.isCompleted);
  const anyWatched = progressList.some(
    (p) => p.isCompleted || (p.positionSeconds && p.positionSeconds > 0)
  );

  let newStatus: AnimeStatus = "belum";
  let watchStatus: UserWatchStatus = "unwatched";

  if (animeEpisodes.length > 0 && completedEpisodes.length >= animeEpisodes.length) {
    newStatus = "tamat";
    watchStatus = "completed";
  } else if (anyWatched) {
    newStatus = "sedang";
    watchStatus = "watching";
  } else {
    newStatus = "belum";
    watchStatus = "unwatched";
  }

  // Update field status dan watchStatus di database
  const now = new Date().toISOString();
  await db
    .update(schema.anime)
    .set({
      status: newStatus,
      watchStatus: watchStatus,
      updatedAt: now,
    })
    .where(eq(schema.anime.id, animeId));

  return {
    animeId,
    previousStatus,
    newStatus,
    watchStatus,
    completedEpisodesCount: completedEpisodes.length,
    totalEpisodesCount: animeEpisodes.length,
  };
}

/**
 * Memperbarui status tontonan anime secara manual
 */
export async function setManualAnimeStatus(
  animeId: string,
  status: AnimeStatus | UserWatchStatus
): Promise<{ success: boolean; status: AnimeStatus; watchStatus: UserWatchStatus }> {
  let animeStatus: AnimeStatus;
  let watchStatus: UserWatchStatus;

  if (status === "unwatched" || status === "watching" || status === "completed") {
    watchStatus = status;
    animeStatus = mapWatchStatusToAnimeStatus(status);
  } else {
    animeStatus = status;
    watchStatus = mapAnimeStatusToWatchStatus(status);
  }

  const now = new Date().toISOString();
  await db
    .update(schema.anime)
    .set({
      status: animeStatus,
      watchStatus: watchStatus,
      updatedAt: now,
    })
    .where(eq(schema.anime.id, animeId));

  return {
    success: true,
    status: animeStatus,
    watchStatus,
  };
}

/**
 * Sinkronisasi seluruh status tontonan katalog anime
 */
export async function syncAllAnimeWatchStatuses(
  userId: string = "user-default"
): Promise<AutoUpdateStatusResult[]> {
  const allAnime = await db.select({ id: schema.anime.id }).from(schema.anime);
  const results: AutoUpdateStatusResult[] = [];

  for (const item of allAnime) {
    try {
      const res = await syncAnimeWatchStatusFromProgress(item.id, userId);
      results.push(res);
    } catch (err) {
      console.error(`Gagal sinkronisasi status anime ${item.id}:`, err);
    }
  }

  return results;
}
