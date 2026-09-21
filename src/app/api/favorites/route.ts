import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";

const DEFAULT_USER_ID = "user-default";

export async function GET(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    const animeId = searchParams.get("animeId");

    // Jika ada query animeId spesifik, cek status favorit anime tersebut
    if (animeId) {
      const [existing] = await db
        .select()
        .from(schema.favorites)
        .where(
          and(
            eq(schema.favorites.userId, DEFAULT_USER_ID),
            eq(schema.favorites.animeId, animeId)
          )
        )
        .limit(1);

      return NextResponse.json({
        success: true,
        animeId,
        isFavorite: !!existing,
      });
    }

    // Ambil seluruh daftar anime favorit pengguna beserta informasi animenya
    const favoriteRows = await db
      .select({
        favoriteId: schema.favorites.id,
        animeId: schema.favorites.animeId,
        createdAt: schema.favorites.createdAt,
        anime: schema.anime,
      })
      .from(schema.favorites)
      .innerJoin(schema.anime, eq(schema.favorites.animeId, schema.anime.id))
      .where(eq(schema.favorites.userId, DEFAULT_USER_ID))
      .orderBy(desc(schema.favorites.createdAt));

    const data = favoriteRows.map((row) => ({
      favoriteId: row.favoriteId,
      animeId: row.animeId,
      createdAt: row.createdAt,
      anime: {
        id: row.anime.id,
        title: row.anime.title,
        synopsis: row.anime.synopsis,
        year: row.anime.year,
        posterUrl: row.anime.posterUrl,
        coverUrl: row.anime.coverUrl,
        status: row.anime.status,
        rating: row.anime.rating,
      },
    }));

    return NextResponse.json({
      success: true,
      data,
      total: data.length,
      favoriteIds: data.map((d) => d.animeId),
    });
  } catch (error: any) {
    console.error("GET /api/favorites error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat daftar favorit" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json();
    const { animeId, action = "toggle" } = body;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId wajib disertakan" },
        { status: 400 }
      );
    }

    const [existing] = await db
      .select()
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, DEFAULT_USER_ID),
          eq(schema.favorites.animeId, animeId)
        )
      )
      .limit(1);

    if (action === "remove" || (action === "toggle" && existing)) {
      if (existing) {
        await db
          .delete(schema.favorites)
          .where(eq(schema.favorites.id, existing.id));
      }
      return NextResponse.json({
        success: true,
        isFavorite: false,
        message: "Anime berhasil dihapus dari daftar favorit",
      });
    }

    // Action is "add" or "toggle" when not existing
    if (!existing) {
      const now = new Date().toISOString();
      const favId = `fav-${DEFAULT_USER_ID}-${animeId}`;
      await db.insert(schema.favorites).values({
        id: favId,
        userId: DEFAULT_USER_ID,
        animeId,
        createdAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      isFavorite: true,
      message: "Anime berhasil ditambahkan ke daftar favorit",
    });
  } catch (error: any) {
    console.error("POST /api/favorites error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengubah status favorit" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    let animeId = searchParams.get("animeId");

    if (!animeId) {
      try {
        const body = await req.json();
        animeId = body?.animeId;
      } catch {
        // Abaikan jika tidak ada body JSON
      }
    }

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId wajib disertakan" },
        { status: 400 }
      );
    }

    await db
      .delete(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, DEFAULT_USER_ID),
          eq(schema.favorites.animeId, animeId)
        )
      );

    return NextResponse.json({
      success: true,
      isFavorite: false,
      message: `Anime ${animeId} berhasil dihapus dari daftar favorit`,
    });
  } catch (error: any) {
    console.error("DELETE /api/favorites error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus anime dari favorit" },
      { status: 500 }
    );
  }
}
