import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, and, gt, asc } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: currentEpisodeId } = await params;

    if (!currentEpisodeId) {
      return NextResponse.json(
        { success: false, error: "ID episode saat ini wajib disertakan" },
        { status: 400 }
      );
    }

    // 1. Fetch current episode info
    const [currentEp] = await db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.id, currentEpisodeId))
      .limit(1);

    if (!currentEp) {
      return NextResponse.json(
        { success: false, error: "Episode saat ini tidak ditemukan" },
        { status: 404 }
      );
    }

    // 2. Query next episode with greater episode_number in the same anime
    const [nextEp] = await db
      .select()
      .from(schema.episodes)
      .where(
        and(
          eq(schema.episodes.animeId, currentEp.animeId),
          gt(schema.episodes.episodeNumber, currentEp.episodeNumber)
        )
      )
      .orderBy(asc(schema.episodes.episodeNumber))
      .limit(1);

    if (!nextEp) {
      return NextResponse.json({
        success: true,
        hasNext: false,
        data: null,
        message: "Ini adalah episode terakhir untuk judul anime ini",
      });
    }

    return NextResponse.json({
      success: true,
      hasNext: true,
      data: {
        id: nextEp.id,
        animeId: nextEp.animeId,
        title: nextEp.title,
        episodeNumber: nextEp.episodeNumber,
        durationSeconds: nextEp.durationSeconds,
        sourceType: nextEp.sourceType,
        sourceUrl: nextEp.sourceUrl,
        thumbnailUrl: nextEp.thumbnailUrl,
        synopsis: nextEp.synopsis,
      },
    });
  } catch (error: any) {
    console.error("GET /api/episodes/[id]/next error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal mendapatkan resolusi episode berikutnya",
      },
      { status: 500 }
    );
  }
}
