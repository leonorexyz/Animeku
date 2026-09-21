import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { syncAnimeWatchStatusFromProgress } from "@/services/watchStatusService";

export async function GET(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    const animeId = searchParams.get("animeId");
    const episodeId = searchParams.get("episodeId");

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "Parameter animeId wajib disertakan" },
        { status: 400 }
      );
    }

    if (episodeId) {
      // Find exact progress for this episode
      const [record] = await db
        .select()
        .from(schema.watchProgress)
        .where(
          and(
            eq(schema.watchProgress.animeId, animeId),
            eq(schema.watchProgress.episodeId, episodeId)
          )
        )
        .limit(1);

      return NextResponse.json({
        success: true,
        data: record || null,
      });
    }

    // Return the most recent episode watched for this anime
    const [latest] = await db
      .select({
        progress: schema.watchProgress,
        episode: schema.episodes,
      })
      .from(schema.watchProgress)
      .innerJoin(
        schema.episodes,
        eq(schema.watchProgress.episodeId, schema.episodes.id)
      )
      .where(eq(schema.watchProgress.animeId, animeId))
      .orderBy(desc(schema.watchProgress.lastWatchedAt))
      .limit(1);

    if (!latest) {
      return NextResponse.json({
        success: true,
        data: null,
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...latest.progress,
        episodeNumber: latest.episode.episodeNumber,
        episodeTitle: latest.episode.title,
      },
    });
  } catch (error: any) {
    console.error("GET /api/player/progress error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat posisi tonton" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      animeId,
      episodeId,
      positionSeconds = 0,
      durationSeconds = 0,
      audioTrack,
      subtitleTrack,
    } = body;

    if (!animeId || !episodeId) {
      return NextResponse.json(
        { success: false, error: "animeId dan episodeId wajib diisi" },
        { status: 400 }
      );
    }

    const pos = Math.floor(positionSeconds);
    const dur = Math.floor(durationSeconds);
    const isCompleted = dur > 0 && pos / dur >= 0.9;
    const now = new Date().toISOString();
    const userId = "user-default";
    const id = `prog-${animeId}-${episodeId}`;

    // Check existing progress
    const existing = await db
      .select()
      .from(schema.watchProgress)
      .where(
        and(
          eq(schema.watchProgress.animeId, animeId),
          eq(schema.watchProgress.episodeId, episodeId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.watchProgress)
        .set({
          positionSeconds: pos,
          durationSeconds: dur,
          isCompleted,
          audioTrack: audioTrack || existing[0].audioTrack,
          subtitleTrack: subtitleTrack || existing[0].subtitleTrack,
          lastWatchedAt: now,
        })
        .where(eq(schema.watchProgress.id, existing[0].id));
    } else {
      await db.insert(schema.watchProgress).values({
        id,
        userId,
        animeId,
        episodeId,
        positionSeconds: pos,
        durationSeconds: dur,
        isCompleted,
        audioTrack,
        subtitleTrack,
        lastWatchedAt: now,
      });
    }

    // Auto-update status tontonan anime dari progres episode
    let updatedStatusInfo = null;
    try {
      updatedStatusInfo = await syncAnimeWatchStatusFromProgress(animeId, userId);
    } catch (statusErr) {
      console.warn("Auto-update watch status error:", statusErr);
    }

    return NextResponse.json({
      success: true,
      data: {
        animeId,
        episodeId,
        positionSeconds: pos,
        durationSeconds: dur,
        isCompleted,
        lastWatchedAt: now,
        watchStatus: updatedStatusInfo?.watchStatus,
        status: updatedStatusInfo?.newStatus,
      },
      message: "Posisi tonton berhasil disimpan",
    });
  } catch (error: any) {
    console.error("POST /api/player/progress error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menyimpan posisi tonton" },
      { status: 500 }
    );
  }
}
