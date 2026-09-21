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
 * GET /api/anime/[id]/categories
 * Mengambil daftar kategori yang terhubung ke anime tertentu
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    const rows = await db
      .select({ category: schema.categories })
      .from(schema.animeCategories)
      .innerJoin(
        schema.categories,
        eq(schema.animeCategories.categoryId, schema.categories.id)
      )
      .where(eq(schema.animeCategories.animeId, animeId));

    const categoryList = rows.map((r) => r.category);

    return NextResponse.json({
      success: true,
      animeId,
      totalCategories: categoryList.length,
      data: categoryList,
    });
  } catch (error: any) {
    console.error("GET /api/anime/[id]/categories error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil kategori anime" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/anime/[id]/categories
 * Menambahkan / meng-assign anime ini ke satu atau lebih kategori
 */
export async function POST(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;
    const body = await req.json().catch(() => ({}));
    const { categoryId, categoryIds } = body;

    const targetIds: string[] = [];
    if (categoryId && typeof categoryId === "string") targetIds.push(categoryId);
    if (Array.isArray(categoryIds)) {
      targetIds.push(...categoryIds.filter((id) => typeof id === "string"));
    }

    if (targetIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "categoryId atau categoryIds wajib disertakan" },
        { status: 400 }
      );
    }

    for (const catId of targetIds) {
      await db
        .insert(schema.animeCategories)
        .values({
          id: `ac-${animeId}-${catId}`,
          animeId,
          categoryId: catId,
        })
        .onConflictDoNothing();
    }

    return NextResponse.json({
      success: true,
      message: `Anime berhasil ditambahkan ke ${targetIds.length} kategori`,
      animeId,
      assignedCategories: targetIds,
    });
  } catch (error: any) {
    console.error("POST /api/anime/[id]/categories error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menambahkan kategori ke anime" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/anime/[id]/categories
 * Melepas anime ini dari satu atau lebih kategori
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    const { searchParams } = new URL(req.url);
    const paramCatId = searchParams.get("categoryId");

    const targetIds: string[] = [];
    if (paramCatId) targetIds.push(paramCatId);
    else {
      const body = await req.json().catch(() => ({}));
      if (body.categoryId) targetIds.push(body.categoryId);
      if (Array.isArray(body.categoryIds)) targetIds.push(...body.categoryIds);
    }

    if (targetIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "categoryId atau categoryIds wajib disertakan" },
        { status: 400 }
      );
    }

    await db
      .delete(schema.animeCategories)
      .where(
        and(
          eq(schema.animeCategories.animeId, animeId),
          inArray(schema.animeCategories.categoryId, targetIds)
        )
      );

    return NextResponse.json({
      success: true,
      message: `Anime berhasil dilepas dari ${targetIds.length} kategori`,
      animeId,
      removedCategories: targetIds,
    });
  } catch (error: any) {
    console.error("DELETE /api/anime/[id]/categories error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal melepas kategori dari anime" },
      { status: 500 }
    );
  }
}
