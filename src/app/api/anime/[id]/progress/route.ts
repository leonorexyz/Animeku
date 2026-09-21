import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";

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

    if (!record) {
      return NextResponse.json({
        success: true,
        data: null,
      });
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
    };

    return NextResponse.json({
      success: true,
      data,
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
    const {
      episodeId,
      positionSeconds = 0,
      durationSeconds = 0,
      isCompleted = false,
    } = body;

    if (!animeId || !episodeId) {
      return NextResponse.json(
        { success: false, error: "animeId dan episodeId wajib diisi" },
        { status: 400 }
      );
    }

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
          isCompleted: Boolean(isCompleted),
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
        isCompleted: Boolean(isCompleted),
        lastWatchedAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Progres tontonan judul berhasil disimpan",
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
