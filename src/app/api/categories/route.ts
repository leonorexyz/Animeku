import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/categories
 * Mengambil seluruh daftar kategori dan koleksi beserta anime yang ditautkan
 */
export async function GET() {
  try {
    await seedDatabase();

    const categoriesList = await db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder));

    const sections = await Promise.all(
      categoriesList.map(async (cat) => {
        const links = await db
          .select({
            anime: schema.anime,
          })
          .from(schema.animeCategories)
          .innerJoin(
            schema.anime,
            eq(schema.animeCategories.animeId, schema.anime.id)
          )
          .where(eq(schema.animeCategories.categoryId, cat.id));

        const animeIds = links.map(({ anime }) => anime.id);
        const items = links.map(({ anime }) => ({
          id: anime.id,
          title: anime.title,
          synopsis: anime.synopsis,
          year: anime.year,
          posterUrl: anime.posterUrl,
          coverUrl: anime.coverUrl,
          status: (anime.status as "belum" | "sedang" | "tamat") || "belum",
          isFeatured: anime.isFeatured,
          rating: anime.rating || "8.5",
          genres: [cat.name],
          totalEpisodes: anime.totalEpisodes || 12,
        }));

        return {
          id: cat.id,
          name: cat.name,
          type: (cat.type as "category" | "genre" | "collection") || "category",
          description: cat.description || "",
          colorTheme: cat.colorTheme || "red",
          sortOrder: cat.sortOrder,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
          animeIds,
          itemCount: items.length,
          items,
        };
      })
    );

    return NextResponse.json({
      success: true,
      totalCategories: sections.length,
      data: sections,
    });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal mengambil daftar kategori",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Membuat kategori atau koleksi baru
 */
export async function POST(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json();
    const {
      name,
      type = "category",
      description = "",
      colorTheme = "red",
      sortOrder = 0,
      animeIds = [],
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama kategori wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const cleanSlug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const newId = `cat-${cleanSlug || Date.now()}`;
    const now = new Date().toISOString();

    const newCategory = {
      id: newId,
      userId: "user-default",
      name: trimmedName,
      type: (type as "category" | "genre" | "collection") || "category",
      description: description || `Kategori ${trimmedName}`,
      colorTheme: colorTheme || "red",
      sortOrder: Number(sortOrder) || 0,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.categories).values(newCategory).onConflictDoNothing();

    // Tautkan anime ke kategori bila animeIds disertakan
    if (Array.isArray(animeIds) && animeIds.length > 0) {
      for (const animeId of animeIds) {
        if (!animeId) continue;
        await db
          .insert(schema.animeCategories)
          .values({
            id: `ac-${animeId}-${newId}`,
            animeId,
            categoryId: newId,
          })
          .onConflictDoNothing();
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Kategori "${trimmedName}" berhasil dibuat`,
        data: {
          ...newCategory,
          animeIds,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal membuat kategori" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/categories
 * Memperbarui atau mengganti nama kategori (menggunakan id dari body)
 */
export async function PUT(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json();
    const { id, name, type, description, colorTheme, sortOrder, animeIds } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID kategori wajib disertakan" },
        { status: 400 }
      );
    }

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

    const now = new Date().toISOString();
    const updatePayload: Record<string, any> = { updatedAt: now };

    if (name && typeof name === "string") updatePayload.name = name.trim();
    if (type && ["category", "genre", "collection"].includes(type)) updatePayload.type = type;
    if (description !== undefined) updatePayload.description = description;
    if (colorTheme !== undefined) updatePayload.colorTheme = colorTheme;
    if (sortOrder !== undefined) updatePayload.sortOrder = Number(sortOrder) || 0;

    await db
      .update(schema.categories)
      .set(updatePayload)
      .where(eq(schema.categories.id, id));

    if (Array.isArray(animeIds)) {
      await db
        .delete(schema.animeCategories)
        .where(eq(schema.animeCategories.categoryId, id));

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
    console.error("PUT /api/categories error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memperbarui kategori" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories
 * Menghapus kategori berdasarkan id dari query param atau body
 */
export async function DELETE(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      const body = await req.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID kategori wajib disertakan" },
        { status: 400 }
      );
    }

    await db
      .delete(schema.animeCategories)
      .where(eq(schema.animeCategories.categoryId, id));

    await db
      .delete(schema.categories)
      .where(eq(schema.categories.id, id));

    return NextResponse.json({
      success: true,
      message: "Kategori berhasil dihapus",
      deletedId: id,
    });
  } catch (error: any) {
    console.error("DELETE /api/categories error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus kategori" },
      { status: 500 }
    );
  }
}
