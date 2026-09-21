import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, and, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/categories/[id]/anime
 * Mengambil daftar anime yang terhubung ke kategori tertentu
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: categoryId } = await params;

    const rows = await db
      .select({ anime: schema.anime })
      .from(schema.animeCategories)
      .innerJoin(
        schema.anime,
        eq(schema.animeCategories.animeId, schema.anime.id)
      )
      .where(eq(schema.animeCategories.categoryId, categoryId));

    const animes = rows.map((r) => r.anime);

    return NextResponse.json({
      success: true,
      categoryId,
      totalAnime: animes.length,
      data: animes,
    });
  } catch (error: any) {
    console.error("GET /api/categories/[id]/anime error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil daftar anime dalam kategori" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories/[id]/anime
 * Menambahkan / meng-assign anime ke kategori
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: categoryId } = await params;
    const body = await req.json().catch(() => ({}));
    const { animeId, animeIds } = body;

    // Kumpulkan seluruh animeId yang akan di-assign
    const targetIds: string[] = [];
    if (animeId && typeof animeId === "string") {
      targetIds.push(animeId);
    }
    if (Array.isArray(animeIds)) {
      targetIds.push(...animeIds.filter((id) => typeof id === "string"));
    }

    if (targetIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "animeId atau animeIds wajib disertakan" },
        { status: 400 }
      );
    }

    // Pastikan kategori ada
    const [category] = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, categoryId))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    let assignedCount = 0;
    for (const aId of targetIds) {
      const relId = `ac-${aId}-${categoryId}`;
      await db
        .insert(schema.animeCategories)
        .values({
          id: relId,
          animeId: aId,
          categoryId,
        })
        .onConflictDoNothing();
      assignedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `${assignedCount} anime berhasil ditautkan ke kategori "${category.name}"`,
      categoryId,
      categoryName: category.name,
      assignedIds: targetIds,
    });
  } catch (error: any) {
    console.error("POST /api/categories/[id]/anime error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal meng-assign anime ke kategori" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]/anime
 * Melepas anime dari kategori
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: categoryId } = await params;

    const { searchParams } = new URL(req.url);
    const paramAnimeId = searchParams.get("animeId");

    const targetIds: string[] = [];
    if (paramAnimeId) {
      targetIds.push(paramAnimeId);
    } else {
      const body = await req.json().catch(() => ({}));
      if (body.animeId) targetIds.push(body.animeId);
      if (Array.isArray(body.animeIds)) targetIds.push(...body.animeIds);
    }

    if (targetIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "animeId atau animeIds wajib disertakan untuk dilepas dari kategori" },
        { status: 400 }
      );
    }

    await db
      .delete(schema.animeCategories)
      .where(
        and(
          eq(schema.animeCategories.categoryId, categoryId),
          inArray(schema.animeCategories.animeId, targetIds)
        )
      );

    return NextResponse.json({
      success: true,
      message: `${targetIds.length} anime berhasil dilepas dari kategori`,
      categoryId,
      removedIds: targetIds,
    });
  } catch (error: any) {
    console.error("DELETE /api/categories/[id]/anime error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal melepas anime dari kategori" },
      { status: 500 }
    );
  }
}
