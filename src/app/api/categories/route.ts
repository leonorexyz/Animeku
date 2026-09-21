import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

export async function GET() {
  try {
    // Ensure initial database seed is in place
    await seedDatabase();

    // Query categories sorted by sortOrder
    const categoriesList = await db
      .select()
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder));

    // For each category, fetch linked anime
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
          totalEpisodes: 12,
        }));

        return {
          id: cat.id,
          name: cat.name,
          type: (cat.type as "category" | "genre") || "category",
          items,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: sections,
    });
  } catch (error: any) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error fetching categories",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, type = "category", sortOrder = 0 } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Nama kategori wajib diisi" },
        { status: 400 }
      );
    }

    const newId = `cat-${Date.now()}`;
    const newCategory = {
      id: newId,
      userId: "user-default",
      name: name.trim(),
      type: (type as "category" | "genre") || "category",
      sortOrder: Number(sortOrder) || 0,
    };

    await db.insert(schema.categories).values(newCategory);

    return NextResponse.json(
      {
        success: true,
        data: newCategory,
        message: "Kategori berhasil dibuat",
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
