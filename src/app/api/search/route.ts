import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, like, and, or, desc, asc, inArray, sql } from "drizzle-orm";
import {
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
  MOCK_CATALOG_DATA,
} from "@/data/mockAnime";
import { Anime } from "@/types/anime";
import { sortAnimeList } from "@/utils/searchSorting";

const DEFAULT_USER_ID = "user-default";

export async function GET(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);

    const q = (searchParams.get("q") || searchParams.get("query") || "").trim();
    const genre = searchParams.get("genre") || "Semua";
    const category = searchParams.get("category") || "all";
    const year = searchParams.get("year") || "all";
    const status = searchParams.get("status") || "all";
    const sortBy = searchParams.get("sortBy") || "rating-desc";
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const offset = (page - 1) * limit;

    // Simpan kata kunci pencarian ke riwayat jika q tidak kosong
    if (q.length >= 2) {
      try {
        await db.insert(schema.searchHistory).values({
          id: `sh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          userId: DEFAULT_USER_ID,
          keyword: q,
          createdAt: new Date().toISOString(),
        });
      } catch {
        // Abaikan kegagalan pencatatan riwayat agar pencarian tetap berjalan lancar
      }
    }

    // 1. Ambil data anime dari database
    const dbAnimes = await db.select().from(schema.anime);

    // Ambil seluruh relasi kategori/genre
    const categoryRows = await db
      .select({
        animeId: schema.animeCategories.animeId,
        categoryName: schema.categories.name,
      })
      .from(schema.animeCategories)
      .innerJoin(
        schema.categories,
        eq(schema.animeCategories.categoryId, schema.categories.id)
      );

    const genresByAnime: Record<string, string[]> = {};
    categoryRows.forEach((r) => {
      if (!genresByAnime[r.animeId]) {
        genresByAnime[r.animeId] = [];
      }
      genresByAnime[r.animeId].push(r.categoryName);
    });

    // Ambil jumlah episode per anime
    const episodeCounts = await db
      .select({
        animeId: schema.episodes.animeId,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(schema.episodes)
      .groupBy(schema.episodes.animeId);

    const episodeCountMap: Record<string, number> = {};
    episodeCounts.forEach((ec) => {
      episodeCountMap[ec.animeId] = Number(ec.count);
    });

    // Gabungkan dengan data mock untuk memastikan katalog lengkap tersedia
    const combinedMap = new Map<string, Anime>();

    // Masukkan anime dari DB
    dbAnimes.forEach((a) => {
      combinedMap.set(a.id, {
        id: a.id,
        title: a.title,
        synopsis: a.synopsis,
        year: a.year,
        posterUrl: a.posterUrl,
        coverUrl: a.coverUrl,
        status: a.status as "belum" | "sedang" | "tamat",
        isFeatured: a.isFeatured,
        rating: a.rating || "8.5",
        genres: genresByAnime[a.id] || ["Action"],
        totalEpisodes: episodeCountMap[a.id] || 12,
      });
    });

    // Masukkan anime dari Mock bila belum ada
    const allMock: Anime[] = [
      ...MOCK_FEATURED_ANIMES,
      ...MOCK_CONTINUE_WATCHING,
      ...MOCK_CATALOG_DATA,
    ];
    MOCK_CATEGORIES.forEach((cat) => allMock.push(...cat.items));

    allMock.forEach((m) => {
      if (!combinedMap.has(m.id)) {
        combinedMap.set(m.id, m);
      }
    });

    let results = Array.from(combinedMap.values());

    // Filter teks (q)
    if (q) {
      const lowerQ = q.toLowerCase();
      results = results.filter((item) => {
        const matchTitle = item.title.toLowerCase().includes(lowerQ);
        const matchSynopsis = item.synopsis?.toLowerCase().includes(lowerQ);
        const matchGenre = item.genres?.some((g) => g.toLowerCase().includes(lowerQ));
        return matchTitle || matchSynopsis || matchGenre;
      });
    }

    // Filter genre
    if (genre && genre !== "Semua") {
      const lowerGenre = genre.toLowerCase();
      results = results.filter((item) =>
        item.genres?.some((g) => g.toLowerCase() === lowerGenre)
      );
    }

    // Filter kategori (tv, movie, special)
    if (category && category !== "all") {
      results = results.filter((item) => {
        if (category === "movie") {
          return (
            item.totalEpisodes === 1 ||
            item.genres?.includes("Movie") ||
            item.title.toLowerCase().includes("movie")
          );
        } else if (category === "special") {
          return (
            item.title.toLowerCase().includes("ova") ||
            item.title.toLowerCase().includes("special")
          );
        } else if (category === "tv") {
          const isMovie =
            item.totalEpisodes === 1 ||
            item.genres?.includes("Movie") ||
            item.title.toLowerCase().includes("movie");
          const isSpecial =
            item.title.toLowerCase().includes("ova") ||
            item.title.toLowerCase().includes("special");
          return !isMovie && !isSpecial;
        }
        return true;
      });
    }

    // Filter tahun rilis
    if (year && year !== "all") {
      if (year === "older") {
        results = results.filter((item) => item.year < 2020);
      } else {
        const targetYear = parseInt(year, 10);
        if (!isNaN(targetYear)) {
          results = results.filter((item) => item.year === targetYear);
        }
      }
    }

    // Filter status penayangan
    if (status && status !== "all") {
      results = results.filter((item) => item.status === status);
    }

    // Pengurutan cerdas (Sorting)
    results = sortAnimeList(results, sortBy, q);

    const total = results.length;
    const paginated = results.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      filters: {
        query: q,
        genre,
        category,
        year,
        status,
        sortBy,
      },
    });
  } catch (error: any) {
    console.error("GET /api/search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal melakukan pencarian anime",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const url = new URL(req.url);
    const searchParams = new URLSearchParams();

    if (body.q) searchParams.set("q", body.q);
    if (body.query) searchParams.set("q", body.query);
    if (body.genre) searchParams.set("genre", body.genre);
    if (body.category) searchParams.set("category", body.category);
    if (body.year) searchParams.set("year", String(body.year));
    if (body.status) searchParams.set("status", body.status);
    if (body.sortBy) searchParams.set("sortBy", body.sortBy);
    if (body.limit) searchParams.set("limit", String(body.limit));
    if (body.page) searchParams.set("page", String(body.page));

    const simulatedReq = new Request(`${url.origin}${url.pathname}?${searchParams.toString()}`, {
      method: "GET",
    });

    return GET(simulatedReq);
  } catch (error: any) {
    console.error("POST /api/search error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memproses request pencarian" },
      { status: 500 }
    );
  }
}
