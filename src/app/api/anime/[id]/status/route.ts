import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  syncAnimeWatchStatusFromProgress,
  setManualAnimeStatus,
  AnimeStatus,
  UserWatchStatus,
} from "@/services/watchStatusService";

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

    const [anime] = await db
      .select({
        id: schema.anime.id,
        title: schema.anime.title,
        status: schema.anime.status,
        watchStatus: schema.anime.watchStatus,
        updatedAt: schema.anime.updatedAt,
      })
      .from(schema.anime)
      .where(eq(schema.anime.id, animeId))
      .limit(1);

    if (!anime) {
      return NextResponse.json(
        { success: false, error: "Anime tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: anime,
    });
  } catch (error: any) {
    console.error("GET /api/anime/[id]/status error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat status tontonan" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId diperlukan" },
        { status: 400 }
      );
    }

    // Auto-update status from episode watch progress
    const result = await syncAnimeWatchStatusFromProgress(animeId);

    return NextResponse.json({
      success: true,
      message: "Status tontonan berhasil disinkronkan dari progres episode",
      data: result,
    });
  } catch (error: any) {
    console.error("POST /api/anime/[id]/status error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menyinkronkan status tontonan" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;
    const body = await req.json();
    const { status } = body;

    if (!animeId || !status) {
      return NextResponse.json(
        { success: false, error: "animeId dan status wajib diisi" },
        { status: 400 }
      );
    }

    const result = await setManualAnimeStatus(
      animeId,
      status as AnimeStatus | UserWatchStatus
    );

    return NextResponse.json({
      success: true,
      message: `Status anime berhasil diperbarui menjadi ${result.status} (${result.watchStatus})`,
      data: result,
    });
  } catch (error: any) {
    console.error("PATCH /api/anime/[id]/status error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengubah status tontonan" },
      { status: 500 }
    );
  }
}
