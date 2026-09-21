import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, desc, and } from "drizzle-orm";

export async function GET() {
  try {
    await seedDatabase();

    // Query active watch progress records (order by lastWatchedAt desc)
    const progressList = await db
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
      .where(eq(schema.watchProgress.isCompleted, false))
      .orderBy(desc(schema.watchProgress.lastWatchedAt));

    const result = progressList.map(({ progress, anime, episode }) => ({
      id: anime.id,
      title: anime.title,
      synopsis: anime.synopsis,
      year: anime.year,
      posterUrl: anime.posterUrl,
      coverUrl: anime.coverUrl,
      status: (anime.status as "belum" | "sedang" | "tamat") || "sedang",
      isFeatured: anime.isFeatured,
      rating: anime.rating || undefined,
      genres: ["Anime"],
      totalEpisodes: 12,
      progress: {
        id: progress.id,
        animeId: progress.animeId,
        animeTitle: anime.title,
        animePoster: anime.posterUrl,
        episodeId: progress.episodeId,
        episodeNumber: episode.episodeNumber,
        episodeTitle: episode.title,
        positionSeconds: progress.positionSeconds,
        durationSeconds: progress.durationSeconds,
        isCompleted: progress.isCompleted,
        lastWatchedAt: progress.lastWatchedAt,
      },
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("GET /api/continue-watching error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil lanjut nonton" },
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
      isCompleted = false,
    } = body;

    if (!animeId || !episodeId) {
      return NextResponse.json(
        { success: false, error: "animeId dan episodeId wajib disertakan" },
        { status: 400 }
      );
    }

    const userId = "user-default";
    const now = new Date().toISOString();
    const progressId = `prog-${animeId}-${episodeId}`;

    // Upsert watch progress
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
      message: "Progres tontonan berhasil disimpan",
    });
  } catch (error: any) {
    console.error("POST /api/continue-watching error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menyimpan progres tontonan" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const animeId = searchParams.get("animeId");

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "Parameter animeId wajib diisi" },
        { status: 400 }
      );
    }

    await db
      .delete(schema.watchProgress)
      .where(eq(schema.watchProgress.animeId, animeId));

    return NextResponse.json({
      success: true,
      message: `Progres tontonan anime ${animeId} berhasil dihapus`,
    });
  } catch (error: any) {
    console.error("DELETE /api/continue-watching error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus progres tontonan" },
      { status: 500 }
    );
  }
}
