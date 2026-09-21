import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, asc } from "drizzle-orm";

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

    const episodesList = await db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.animeId, animeId))
      .orderBy(asc(schema.episodes.episodeNumber));

    return NextResponse.json({
      success: true,
      data: episodesList,
    });
  } catch (error: any) {
    console.error("GET /api/anime/[id]/episodes error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat daftar episode" },
      { status: 500 }
    );
  }
}
