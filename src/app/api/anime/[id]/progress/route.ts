import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";
import { syncAnimeWatchStatusFromProgress } from "@/services/watchStatusService";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId diperlukan" },
        { status: 400 }
      );
    }

    const [record] = await db
      .select({
        progress: schema.watchProgress,
        anime: schema.anime,
        episode: schema.episodes,
      })
      .from(schema.watchProgress)
      .innerJoin(schema.anime, eq(schema.watchProgress.animeId, schema.anime.id))
      .innerJoin(
        schema.episodes,
        eq(schema.watchProgress.episodeId, schema.episodes.id)
      )
      .where(eq(schema.watchProgress.animeId, animeId))
      .orderBy(desc(schema.watchProgress.lastWatchedAt))
      .limit(1);

    // Ambil daftar episode untuk menghitung episode berikutnya bila episode terakhir sudah selesai
    const allEpisodes = await db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.animeId, animeId))
      .orderBy(schema.episodes.episodeNumber);

    // Ambil seluruh rekaman progres untuk anime ini
    const allProgressRecords = await db
      .select()
      .from(schema.watchProgress)
      .where(eq(schema.watchProgress.animeId, animeId));

    if (!record) {
      const firstEp = allEpisodes[0];
      return NextResponse.json({
        success: true,
        data: null,
        resumeEpisode: firstEp
          ? {
              episodeId: firstEp.id,
              episodeNumber: firstEp.episodeNumber,
              title: firstEp.title,
              positionSeconds: 0,
              durationSeconds: firstEp.durationSeconds,
              progressPercent: 0,
              isCompleted: false,
              isNextEpisode: false,
            }
          : null,
      });
    }

    let resumeEpisode = {
      episodeId: record.episode.id,
      episodeNumber: record.episode.episodeNumber,
      title: record.episode.title,
      positionSeconds: record.progress.positionSeconds,
      durationSeconds: record.progress.durationSeconds || record.episode.durationSeconds,
      progressPercent:
        (record.progress.durationSeconds || record.episode.durationSeconds) > 0
          ? Math.round(
              (record.progress.positionSeconds /
                (record.progress.durationSeconds || record.episode.durationSeconds)) *
                100
            )
          : 0,
      isCompleted: record.progress.isCompleted,
      isNextEpisode: false,
    };

    // Jika episode terakhir yang ditonton sudah tamat (isCompleted = true), arahkan ke episode selanjutnya
    if (record.progress.isCompleted) {
      const nextEp = allEpisodes.find(
        (ep) => ep.episodeNumber === record.episode.episodeNumber + 1
      );
      if (nextEp) {
        resumeEpisode = {
          episodeId: nextEp.id,
          episodeNumber: nextEp.episodeNumber,
          title: nextEp.title,
          positionSeconds: 0,
          durationSeconds: nextEp.durationSeconds,
          progressPercent: 0,
          isCompleted: false,
          isNextEpisode: true,
        };
      }
    }

    const data = {
      id: record.progress.id,
      animeId: record.progress.animeId,
      animeTitle: record.anime.title,
      animePoster: record.anime.posterUrl,
      episodeId: record.progress.episodeId,
      episodeNumber: record.episode.episodeNumber,
      episodeTitle: record.episode.title,
      positionSeconds: record.progress.positionSeconds,
      durationSeconds: record.progress.durationSeconds,
      isCompleted: record.progress.isCompleted,
      lastWatchedAt: record.progress.lastWatchedAt,
      resumeEpisode,
      allProgress: allProgressRecords.map((p) => ({
        id: p.id,
        episodeId: p.episodeId,
        positionSeconds: p.positionSeconds,
        durationSeconds: p.durationSeconds,
        isCompleted: p.isCompleted,
        lastWatchedAt: p.lastWatchedAt,
      })),
    };

    return NextResponse.json({
      success: true,
      data,
      resumeEpisode,
    });
  } catch (error: any) {
    console.error("GET /api/anime/[id]/progress error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat progres anime" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: animeId } = await params;
    const body = await req.json();
    let {
      episodeId,
      episodeNumber,
      positionSeconds = 0,
      durationSeconds = 0,
      isCompleted,
    } = body;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId wajib diisi" },
        { status: 400 }
      );
    }

    // Resolusi episodeId bila hanya episodeNumber yang dikirim
    if (!episodeId && episodeNumber !== undefined) {
      const epRecord = await db
        .select()
        .from(schema.episodes)
        .where(
          and(
            eq(schema.episodes.animeId, animeId),
            eq(schema.episodes.episodeNumber, Number(episodeNumber))
          )
        )
        .limit(1);

      if (epRecord.length > 0) {
        episodeId = epRecord[0].id;
        if (!durationSeconds) {
          durationSeconds = epRecord[0].durationSeconds;
        }
      }
    }

    if (!episodeId) {
      return NextResponse.json(
        { success: false, error: "episodeId atau episodeNumber yang valid wajib diisi" },
        { status: 400 }
      );
    }

    // Otomatis tandai selesai jika tontonan melebihi 90% durasi bila tidak dispesifikasikan eksplisit
    const completedFlag =
      isCompleted !== undefined
        ? Boolean(isCompleted)
        : durationSeconds > 0 && positionSeconds / durationSeconds >= 0.9;

    const userId = "user-default";
    const now = new Date().toISOString();
    const progressId = `prog-${animeId}-${episodeId}`;

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
          positionSeconds: Math.floor(positionSeconds),
          durationSeconds: Math.floor(durationSeconds),
          isCompleted: completedFlag,
          lastWatchedAt: now,
        })
        .where(eq(schema.watchProgress.id, existing[0].id));
    } else {
      await db.insert(schema.watchProgress).values({
        id: progressId,
        userId,
        animeId,
        episodeId,
        positionSeconds: Math.floor(positionSeconds),
        durationSeconds: Math.floor(durationSeconds),
        isCompleted: completedFlag,
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
      message: "Progres tontonan judul berhasil disimpan",
      progress: {
        animeId,
        episodeId,
        positionSeconds: Math.floor(positionSeconds),
        durationSeconds: Math.floor(durationSeconds),
        isCompleted: completedFlag,
        lastWatchedAt: now,
      },
      watchStatus: updatedStatusInfo?.watchStatus,
      status: updatedStatusInfo?.newStatus,
    });
  } catch (error: any) {
    console.error("POST /api/anime/[id]/progress error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menyimpan progres tontonan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id: animeId } = await params;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId wajib disertakan" },
        { status: 400 }
      );
    }

    await db
      .delete(schema.watchProgress)
      .where(eq(schema.watchProgress.animeId, animeId));

    // Reset status tontonan anime setelah progres dihapus
    try {
      await syncAnimeWatchStatusFromProgress(animeId);
    } catch (err) {
      console.warn("Reset watch status error after delete:", err);
    }

    return NextResponse.json({
      success: true,
      message: `Progres tontonan untuk anime ${animeId} berhasil dihapus`,
    });
  } catch (error: any) {
    console.error("DELETE /api/anime/[id]/progress error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus progres" },
      { status: 500 }
    );
  }
}
