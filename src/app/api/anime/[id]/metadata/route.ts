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
 * Helper untuk menyimpan metadata anime dan urutan episode
 */
async function handleSaveMetadata(animeId: string, body: any) {
  await seedDatabase();

  const {
    title,
    synopsis,
    year,
    rating,
    status,
    genres,
    posterUrl,
    coverUrl,
    totalEpisodes,
    episodes,
  } = body;

  const now = new Date().toISOString();

  // 1. Cek apakah anime ada
  const existingAnime = await db
    .select()
    .from(schema.anime)
    .where(eq(schema.anime.id, animeId))
    .limit(1);

  let targetAnimeId = animeId;

  const genresString = Array.isArray(genres)
    ? genres.join(", ")
    : typeof genres === "string"
    ? genres
    : undefined;

  const animeUpdatePayload: Record<string, any> = {
    updatedAt: now,
  };

  if (title) animeUpdatePayload.title = title.trim();
  if (synopsis !== undefined) animeUpdatePayload.synopsis = synopsis;
  if (year !== undefined) animeUpdatePayload.year = Number(year) || new Date().getFullYear();
  if (rating !== undefined) animeUpdatePayload.rating = String(rating);
  if (status) animeUpdatePayload.status = status;
  if (posterUrl) animeUpdatePayload.posterUrl = posterUrl;
  if (coverUrl) animeUpdatePayload.coverUrl = coverUrl;
  if (genresString !== undefined) animeUpdatePayload.genres = genresString;
  if (totalEpisodes !== undefined) animeUpdatePayload.totalEpisodes = Number(totalEpisodes) || 12;

  if (existingAnime.length > 0) {
    await db
      .update(schema.anime)
      .set(animeUpdatePayload)
      .where(eq(schema.anime.id, animeId));
  } else {
    // Buat anime baru jika belum ada di database
    const defaultUserId = "user-default";
    targetAnimeId = animeId;
    await db.insert(schema.anime).values({
      id: targetAnimeId,
      userId: defaultUserId,
      title: title?.trim() || "Anime Tanpa Judul",
      synopsis: synopsis || "",
      year: Number(year) || new Date().getFullYear(),
      rating: String(rating || "8.5"),
      status: status || "sedang",
      posterUrl:
        posterUrl ||
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
      coverUrl:
        coverUrl ||
        "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
      genres: genresString || "Aksi, Petualangan",
      totalEpisodes: Number(totalEpisodes) || (Array.isArray(episodes) ? episodes.length : 12),
      isFeatured: false,
      sourceType: "local",
      createdAt: now,
      updatedAt: now,
    });
  }

  // 2. Perbarui Kategori bila ada
  if (Array.isArray(genres) && genres.length > 0) {
    for (const genreName of genres) {
      const cleanGenre = String(genreName).trim();
      if (!cleanGenre) continue;

      const genreId = `cat-${cleanGenre.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const existingCat = await db
        .select()
        .from(schema.categories)
        .where(eq(schema.categories.id, genreId))
        .limit(1);

      if (existingCat.length === 0) {
        await db
          .insert(schema.categories)
          .values({
            id: genreId,
            userId: "user-default",
            name: cleanGenre,
            type: "genre",
            sortOrder: 10,
          })
          .onConflictDoNothing();
      }

      await db
        .insert(schema.animeCategories)
        .values({
          id: `ac-${targetAnimeId}-${genreId}`,
          animeId: targetAnimeId,
          categoryId: genreId,
        })
        .onConflictDoNothing();
    }
  }

  // 3. Simpan dan perbarui urutan episode
  const updatedEpisodes = [];
  if (Array.isArray(episodes) && episodes.length > 0) {
    for (let i = 0; i < episodes.length; i++) {
      const epItem = episodes[i];
      const newEpNum = Number(epItem.episodeNumber) || i + 1;
      const epTitle = epItem.title?.trim() || `Episode ${newEpNum}`;
      const epSynopsis = epItem.synopsis || `Episode ${newEpNum} dari ${title || "anime"}.`;

      let targetEpId = epItem.id;

      // Cari episode berdasarkan ID atau kombinasi animeId + episodeNumber lama
      if (targetEpId) {
        const found = await db
          .select()
          .from(schema.episodes)
          .where(eq(schema.episodes.id, targetEpId))
          .limit(1);

        if (found.length > 0) {
          await db
            .update(schema.episodes)
            .set({
              episodeNumber: newEpNum,
              title: epTitle,
              synopsis: epSynopsis,
              durationSeconds: Number(epItem.durationSeconds) || found[0].durationSeconds || 1440,
            })
            .where(eq(schema.episodes.id, targetEpId));

          updatedEpisodes.push({
            id: targetEpId,
            episodeNumber: newEpNum,
            title: epTitle,
          });
          continue;
        }
      }

      // Jika tidak ada ID spesifik, cari berdasarkan episodeNumber pada anime terkait
      const existingByNum = await db
        .select()
        .from(schema.episodes)
        .where(
          and(
            eq(schema.episodes.animeId, targetAnimeId),
            eq(schema.episodes.episodeNumber, newEpNum)
          )
        )
        .limit(1);

      if (existingByNum.length > 0) {
        await db
          .update(schema.episodes)
          .set({
            title: epTitle,
            synopsis: epSynopsis,
            durationSeconds: Number(epItem.durationSeconds) || existingByNum[0].durationSeconds || 1440,
          })
          .where(eq(schema.episodes.id, existingByNum[0].id));

        updatedEpisodes.push({
          id: existingByNum[0].id,
          episodeNumber: newEpNum,
          title: epTitle,
        });
      } else {
        // Buat episode baru bila belum ada
        const newId = `ep-${targetAnimeId.replace("anime-", "")}-${newEpNum}`;
        await db
          .insert(schema.episodes)
          .values({
            id: newId,
            animeId: targetAnimeId,
            title: epTitle,
            episodeNumber: newEpNum,
            durationSeconds: Number(epItem.durationSeconds) || 1440,
            sourceType: "local",
            sourceUrl: "/sample-videos/default.mp4",
            synopsis: epSynopsis,
            createdAt: now,
          })
          .onConflictDoNothing();

        updatedEpisodes.push({
          id: newId,
          episodeNumber: newEpNum,
          title: epTitle,
        });
      }
    }
  }

  // Ambil daftar episode terkini
  const currentEpisodes = await db
    .select()
    .from(schema.episodes)
    .where(eq(schema.episodes.animeId, targetAnimeId))
    .orderBy(asc(schema.episodes.episodeNumber));

  return {
    success: true,
    message: "Metadata anime dan urutan episode berhasil disimpan",
    animeId: targetAnimeId,
    episodesCount: currentEpisodes.length,
    episodes: currentEpisodes,
  };
}

/**
 * PUT /api/anime/[id]/metadata
 * Menyimpan pembaruan metadata dan urutan episode anime
 */
export async function PUT(req: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await handleSaveMetadata(id, body);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PUT /api/anime/[id]/metadata error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal menyimpan metadata anime dan urutan episode",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/anime/[id]/metadata
 * Alias untuk metode PUT
 */
export async function POST(req: Request, { params }: RouteParams) {
  return PUT(req, { params });
}
