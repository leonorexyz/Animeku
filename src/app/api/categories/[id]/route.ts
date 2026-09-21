import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/categories/[id]
 * Mengambil detail kategori tunggal beserta anime yang terhubung
 */
export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id } = await params;

    const [category] = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    const links = await db
      .select({
        anime: schema.anime,
      })
      .from(schema.animeCategories)
      .innerJoin(
        schema.anime,
        eq(schema.animeCategories.animeId, schema.anime.id)
      )
      .where(eq(schema.animeCategories.categoryId, id));

    const animeIds = links.map((l) => l.anime.id);
    const items = links.map((l) => l.anime);

    return NextResponse.json({
      success: true,
      data: {
        ...category,
        animeIds,
        itemsCount: items.length,
        items,
      },
    });
  } catch (error: any) {
    console.error("GET /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil data kategori" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories/[id]
 * Memperbarui data kategori (ganti nama, ubah tipe, warna, deskripsi, urutan, dan relasi anime)
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { name, type, description, colorTheme, sortOrder, animeIds } = body;

    const [existing] = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Kategori yang akan diperbarui tidak ditemukan" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = {
      updatedAt: now,
    };

    if (name && typeof name === "string") {
      updatePayload.name = name.trim();
    }
    if (type && ["category", "genre", "collection"].includes(type)) {
      updatePayload.type = type;
    }
    if (description !== undefined) {
      updatePayload.description = description;
    }
    if (colorTheme !== undefined) {
      updatePayload.colorTheme = colorTheme;
    }
    if (sortOrder !== undefined) {
      updatePayload.sortOrder = Number(sortOrder) || 0;
    }

    await db
      .update(schema.categories)
      .set(updatePayload)
      .where(eq(schema.categories.id, id));

    // Perbarui relasi anime jika animeIds disertakan
    if (Array.isArray(animeIds)) {
      // Hapus relasi lama
      await db
        .delete(schema.animeCategories)
        .where(eq(schema.animeCategories.categoryId, id));

      // Masukkan relasi baru
      for (const animeId of animeIds) {
        if (!animeId) continue;
        await db
          .insert(schema.animeCategories)
          .values({
            id: `ac-${animeId}-${id}`,
            animeId,
            categoryId: id,
          })
          .onConflictDoNothing();
      }
    }

    // Ambil data terbaru
    const [updated] = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    return NextResponse.json({
      success: true,
      message: `Kategori "${updated.name}" berhasil diperbarui`,
      data: updated,
    });
  } catch (error: any) {
    console.error("PUT /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/categories/[id]
 * Alias untuk PUT
 */
export async function PATCH(req: Request, { params }: RouteParams) {
  return PUT(req, { params });
}

/**
 * DELETE /api/categories/[id]
 * Menghapus kategori beserta relasi ke anime
 */
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id } = await params;

    const [existing] = await db
      .select()
      .from(schema.categories)
      .where(eq(schema.categories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Kategori tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hapus relasi animeCategories
    await db
      .delete(schema.animeCategories)
      .where(eq(schema.animeCategories.categoryId, id));

    // Hapus kategori
    await db
      .delete(schema.categories)
      .where(eq(schema.categories.id, id));

    return NextResponse.json({
      success: true,
      message: `Kategori "${existing.name}" berhasil dihapus`,
      deletedId: id,
    });
  } catch (error: any) {
    console.error("DELETE /api/categories/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
