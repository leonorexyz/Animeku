import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and, asc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * POST /api/metadata/save
 * Endpoint umum untuk menyimpan metadata anime dan menyelaraskan urutan episode
 */
export async function POST(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json().catch(() => ({}));
    const {
      animeId: rawAnimeId,
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

    if (!title && !rawAnimeId) {
      return NextResponse.json(
        { success: false, error: "animeId atau title wajib disertakan" },
        { status: 400 }
      );
    }

    const titleText = title?.trim() || "Anime Personal";
    const animeSlug = titleText
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const animeId = rawAnimeId || `anime-${animeSlug || Date.now()}`;
    const defaultUserId = "user-default";
    const now = new Date().toISOString();

    const genresString = Array.isArray(genres)
      ? genres.join(", ")
      : typeof genres === "string"
      ? genres
      : "Aksi, Petualangan";

    // 1. Simpan atau perbarui anime
    const existingAnime = await db
      .select()
      .from(schema.anime)
      .where(eq(schema.anime.id, animeId))
      .limit(1);

    if (existingAnime.length === 0) {
      await db.insert(schema.anime).values({
        id: animeId,
        userId: defaultUserId,
        title: titleText,
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
        genres: genresString,
        totalEpisodes: Number(totalEpisodes) || (Array.isArray(episodes) ? episodes.length : 12),
        isFeatured: false,
        sourceType: "local",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const updateData: Record<string, any> = { updatedAt: now };
      if (title) updateData.title = titleText;
      if (synopsis !== undefined) updateData.synopsis = synopsis;
      if (year !== undefined) updateData.year = Number(year);
      if (rating !== undefined) updateData.rating = String(rating);
      if (status) updateData.status = status;
      if (posterUrl) updateData.posterUrl = posterUrl;
      if (coverUrl) updateData.coverUrl = coverUrl;
      if (genresString) updateData.genres = genresString;
      if (totalEpisodes !== undefined) updateData.totalEpisodes = Number(totalEpisodes);

      await db.update(schema.anime).set(updateData).where(eq(schema.anime.id, animeId));
    }

    // 2. Simpan dan perbarui episode
    if (Array.isArray(episodes) && episodes.length > 0) {
      for (let i = 0; i < episodes.length; i++) {
        const ep = episodes[i];
        const epNum = Number(ep.episodeNumber) || i + 1;
        const epTitle = ep.title?.trim() || `Episode ${epNum}`;
        const epSynopsis = ep.synopsis || `Episode ${epNum} dari serial ${titleText}.`;

        const existingEp = await db
          .select()
          .from(schema.episodes)
          .where(
            and(
              eq(schema.episodes.animeId, animeId),
              eq(schema.episodes.episodeNumber, epNum)
            )
          )
          .limit(1);

        if (existingEp.length > 0) {
          await db
            .update(schema.episodes)
            .set({
              title: epTitle,
              synopsis: epSynopsis,
              durationSeconds: Number(ep.durationSeconds) || existingEp[0].durationSeconds || 1440,
            })
            .where(eq(schema.episodes.id, existingEp[0].id));
        } else {
          const epId = `ep-${animeSlug}-${epNum}`;
          await db
            .insert(schema.episodes)
            .values({
              id: epId,
              animeId,
              title: epTitle,
              episodeNumber: epNum,
              durationSeconds: 1440,
              sourceType: "local",
              sourceUrl: "/sample-videos/default.mp4",
              synopsis: epSynopsis,
              createdAt: now,
            })
            .onConflictDoNothing();
        }
      }
    }

    const savedEpisodes = await db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.animeId, animeId))
      .orderBy(asc(schema.episodes.episodeNumber));

    return NextResponse.json({
      success: true,
      message: "Metadata dan urutan episode anime berhasil disimpan ke katalog",
      animeId,
      animeTitle: titleText,
      episodesCount: savedEpisodes.length,
      episodes: savedEpisodes,
    });
  } catch (error: any) {
    console.error("POST /api/metadata/save error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal menyimpan metadata anime",
      },
      { status: 500 }
    );
  }
}
