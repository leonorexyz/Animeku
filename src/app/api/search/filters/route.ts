import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
  MOCK_CATALOG_DATA,
} from "@/data/mockAnime";
import { Anime } from "@/types/anime";

export async function GET() {
  try {
    await seedDatabase();

    // 1. Ambil anime dari database
    const dbAnimes = await db.select().from(schema.anime);

    // Ambil relasi kategori/genre dari DB
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

    // Gabungkan dengan mock catalog agar konsisten
    const combinedMap = new Map<string, Anime>();

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
        totalEpisodes: 12,
      });
    });

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

    const allAnimes = Array.from(combinedMap.values());
    const totalCount = allAnimes.length;

    // Hitung frekuensi Genre
    const genreCounts: Record<string, number> = {};
    allAnimes.forEach((anime) => {
      (anime.genres || []).forEach((g) => {
        genreCounts[g] = (genreCounts[g] || 0) + 1;
      });
    });

    // Urutkan genre berdasarkan kemunculan terbanyak
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const genres = [
      { name: "Semua", count: totalCount },
      ...sortedGenres,
    ];

    // Hitung frekuensi Tahun
    const yearCounts: Record<number, number> = {};
    allAnimes.forEach((anime) => {
      if (anime.year) {
        yearCounts[anime.year] = (yearCounts[anime.year] || 0) + 1;
      }
    });

    const sortedYears = Object.entries(yearCounts)
      .map(([y, count]) => ({ year: parseInt(y, 10), count }))
      .sort((a, b) => b.year - a.year);

    const olderCount = allAnimes.filter((a) => a.year < 2020).length;

    const years = [
      { label: "Semua Tahun", value: "all", count: totalCount },
      ...sortedYears.map((y) => ({
        label: String(y.year),
        value: String(y.year),
        count: y.count,
      })),
    ];
    if (olderCount > 0 && !years.some((y) => y.value === "older")) {
      years.push({
        label: "2019 & Sebelumnya",
        value: "older",
        count: olderCount,
      });
    }

    // Hitung frekuensi Kategori (TV, Movie, Special)
    let tvCount = 0;
    let movieCount = 0;
    let specialCount = 0;

    allAnimes.forEach((item) => {
      const isMovie =
        item.totalEpisodes === 1 ||
        item.genres?.includes("Movie") ||
        item.title.toLowerCase().includes("movie");
      const isSpecial =
        item.title.toLowerCase().includes("ova") ||
        item.title.toLowerCase().includes("special");

      if (isMovie) movieCount++;
      else if (isSpecial) specialCount++;
      else tvCount++;
    });

    const categories = [
      { label: "Semua Kategori", value: "all", count: totalCount },
      { label: "Serial TV", value: "tv", count: tvCount },
      { label: "Movie / Film", value: "movie", count: movieCount },
      { label: "OVA / Special", value: "special", count: specialCount },
    ];

    // Hitung frekuensi Status
    let ongoingCount = 0;
    let tamatCount = 0;
    let belumCount = 0;

    allAnimes.forEach((item) => {
      if (item.status === "sedang") ongoingCount++;
      else if (item.status === "tamat") tamatCount++;
      else belumCount++;
    });

    const statuses = [
      { label: "Semua Status", value: "all", count: totalCount },
      { label: "Sedang Tayang", value: "ongoing", count: ongoingCount },
      { label: "Tamat", value: "tamat", count: tamatCount },
    ];
    if (belumCount > 0) {
      statuses.push({ label: "Segera Tayang", value: "belum", count: belumCount });
    }

    const sortOptions = [
      { label: "Skor Tertinggi", value: "rating-desc" },
      { label: "Tahun Terbaru", value: "year-desc" },
      { label: "Tahun Terlama", value: "year-asc" },
      { label: "Judul (A-Z)", value: "title-asc" },
      { label: "Judul (Z-A)", value: "title-desc" },
    ];

    return NextResponse.json({
      success: true,
      data: {
        totalAnime: totalCount,
        genres,
        years,
        categories,
        statuses,
        sortOptions,
      },
    });
  } catch (error: any) {
    console.error("GET /api/search/filters error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat opsi filter koleksi" },
      { status: 500 }
    );
  }
}
