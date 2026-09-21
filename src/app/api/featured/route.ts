import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    // Ensure initial database seed is in place
    await seedDatabase();

    // Query anime marked as featured
    let featuredList = await db
      .select()
      .from(schema.anime)
      .where(eq(schema.anime.isFeatured, true));

    // Fallback to latest anime if none explicitly marked
    if (featuredList.length === 0) {
      featuredList = await db
        .select()
        .from(schema.anime)
        .orderBy(desc(schema.anime.createdAt))
        .limit(3);
    }

    // Enrich with genres & total episode count
    const result = await Promise.all(
      featuredList.map(async (a) => {
        // Fetch categories for genres
        const cats = await db
          .select({
            name: schema.categories.name,
          })
          .from(schema.animeCategories)
          .innerJoin(
            schema.categories,
            eq(schema.animeCategories.categoryId, schema.categories.id)
          )
          .where(eq(schema.animeCategories.animeId, a.id));

        const genres = cats.map((c) => c.name);

        // Fetch episodes count
        const eps = await db
          .select()
          .from(schema.episodes)
          .where(eq(schema.episodes.animeId, a.id));

        return {
          id: a.id,
          title: a.title,
          synopsis: a.synopsis,
          year: a.year,
          posterUrl: a.posterUrl,
          coverUrl: a.coverUrl,
          status: (a.status as "belum" | "sedang" | "tamat") || "belum",
          isFeatured: a.isFeatured,
          rating: a.rating || "9.0",
          genres: genres.length > 0 ? genres : ["Petualangan", "Fantasi"],
          totalEpisodes: eps.length > 0 ? eps.length : 12,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("GET /api/featured error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal memuat anime sorotan utama",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { animeId, isFeatured = true } = body;

    if (!animeId || typeof animeId !== "string") {
      return NextResponse.json(
        { success: false, error: "animeId wajib disertakan" },
        { status: 400 }
      );
    }

    await db
      .update(schema.anime)
      .set({
        isFeatured: Boolean(isFeatured),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(schema.anime.id, animeId));

    return NextResponse.json({
      success: true,
      message: `Status sorotan utama anime ${animeId} berhasil diperbarui`,
    });
  } catch (error: any) {
    console.error("POST /api/featured error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memperbarui status sorotan" },
      { status: 500 }
    );
  }
}
