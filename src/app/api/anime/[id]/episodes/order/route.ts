import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PUT /api/anime/[id]/episodes/order
 * Mengatur ulang nomor dan urutan episode untuk anime tertentu
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;
    const body = await req.json().catch(() => ({}));
    const { episodes, orderedIds } = body;

    if (!Array.isArray(episodes) && !Array.isArray(orderedIds)) {
      return NextResponse.json(
        {
          success: false,
          error: "Daftar episodes atau orderedIds wajib disertakan",
        },
        { status: 400 }
      );
    }

    // 1. Jika dikirim dalam format orderedIds: ["ep-1", "ep-2", ...]
    if (Array.isArray(orderedIds)) {
      for (let i = 0; i < orderedIds.length; i++) {
        const epId = orderedIds[i];
        const newNumber = i + 1;
        await db
          .update(schema.episodes)
          .set({ episodeNumber: newNumber })
          .where(and(eq(schema.episodes.id, epId), eq(schema.episodes.animeId, animeId)));
      }
    }

    // 2. Jika dikirim dalam format episodes: [{ id: "...", episodeNumber: 1 }]
    if (Array.isArray(episodes)) {
      for (const item of episodes) {
        if (!item.id || item.episodeNumber === undefined) continue;
        const newNumber = Number(item.episodeNumber);
        const updateFields: Record<string, any> = { episodeNumber: newNumber };
        if (item.title) updateFields.title = item.title;
        if (item.synopsis) updateFields.synopsis = item.synopsis;

        await db
          .update(schema.episodes)
          .set(updateFields)
          .where(
            and(
              eq(schema.episodes.id, item.id),
              eq(schema.episodes.animeId, animeId)
            )
          );
      }
    }

    // Ambil daftar episode setelah pengurutan ulang
    const updatedEpisodes = await db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.animeId, animeId))
      .orderBy(asc(schema.episodes.episodeNumber));

    return NextResponse.json({
      success: true,
      message: "Urutan episode berhasil diperbarui",
      animeId,
      totalEpisodes: updatedEpisodes.length,
      episodes: updatedEpisodes,
    });
  } catch (error: any) {
    console.error("PUT /api/anime/[id]/episodes/order error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memperbarui urutan episode" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/anime/[id]/episodes/order
 * Alias untuk metode PUT
 */
export async function POST(req: Request, { params }: RouteParams) {
  return PUT(req, { params });
}
