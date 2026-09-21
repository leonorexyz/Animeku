import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: episodeId } = await params;

    if (!episodeId) {
      return NextResponse.json(
        { success: false, error: "episodeId diperlukan" },
        { status: 400 }
      );
    }

    // Fetch episode with parent anime
    const [ep] = await db
      .select({
        episode: schema.episodes,
        anime: schema.anime,
      })
      .from(schema.episodes)
      .innerJoin(schema.anime, eq(schema.episodes.animeId, schema.anime.id))
      .where(eq(schema.episodes.id, episodeId))
      .limit(1);

    if (!ep) {
      return NextResponse.json(
        { success: false, error: "Episode tidak ditemukan" },
        { status: 404 }
      );
    }

    // Fetch alternative mirror sources
    const sources = await db
      .select()
      .from(schema.episodeSources)
      .where(eq(schema.episodeSources.episodeId, episodeId));

    const allSources = [
      {
        id: `src-${ep.episode.id}-primary`,
        label: "Server Utama (HD)",
        quality: "1080p",
        sourceType: ep.episode.sourceType,
        sourceUrl: ep.episode.sourceUrl,
        isDefault: true,
      },
      ...sources.map((s) => ({
        id: s.id,
        label: s.label || "Server Cadangan",
        quality: s.quality || "720p",
        sourceType: s.sourceType,
        sourceUrl: s.sourceUrl,
        isDefault: false,
      })),
    ];

    // Subtitle tracks configuration
    const subtitles = [
      { id: "off", label: "Nonaktif", language: "off" },
      {
        id: "id",
        label: "Bahasa Indonesia (Resmi)",
        language: "id",
        isDefault: true,
      },
      { id: "en", label: "English", language: "en" },
      { id: "ja-romaji", label: "Romaji / Karaoke", language: "ja" },
    ];

    // Audio tracks configuration
    const audioTracks = [
      {
        id: "ja-51",
        label: "Jepang (Original Dolby 5.1)",
        badge: "JP 5.1",
        isDefault: true,
      },
      { id: "ja-stereo", label: "Jepang (Stereo AAC)", badge: "JP 2.0" },
      { id: "en-dub", label: "English Dub (Stereo)", badge: "EN Dub" },
      { id: "id-dub", label: "Indonesia Dub (Stereo)", badge: "ID Dub" },
    ];

    // Fetch existing progress
    const [progress] = await db
      .select()
      .from(schema.watchProgress)
      .where(eq(schema.watchProgress.episodeId, episodeId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        id: ep.episode.id,
        animeId: ep.episode.animeId,
        animeTitle: ep.anime.title,
        animePoster: ep.anime.posterUrl,
        title: ep.episode.title,
        episodeNumber: ep.episode.episodeNumber,
        durationSeconds: ep.episode.durationSeconds,
        thumbnailUrl: ep.episode.thumbnailUrl,
        synopsis: ep.episode.synopsis,
        sourceType: ep.episode.sourceType,
        sourceUrl: ep.episode.sourceUrl,
        sources: allSources,
        subtitles,
        audioTracks,
        progress: progress
          ? {
              positionSeconds: progress.positionSeconds,
              durationSeconds: progress.durationSeconds,
              isCompleted: progress.isCompleted,
              audioTrack: progress.audioTrack,
              subtitleTrack: progress.subtitleTrack,
              lastWatchedAt: progress.lastWatchedAt,
            }
          : null,
      },
    });
  } catch (error: any) {
    console.error("GET /api/episodes/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat detail episode" },
      { status: 500 }
    );
  }
}
