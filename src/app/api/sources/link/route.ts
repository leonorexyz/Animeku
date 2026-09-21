import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/sources/link
 * Mengambil daftar seluruh tautan streaming video eksternal yang terdaftar
 */
export async function GET(req: Request) {
  try {
    await seedDatabase();

    const linkEpisodes = await db
      .select({
        episode: schema.episodes,
        anime: schema.anime,
        source: schema.episodeSources,
      })
      .from(schema.episodes)
      .innerJoin(schema.anime, eq(schema.episodes.animeId, schema.anime.id))
      .leftJoin(
        schema.episodeSources,
        and(
          eq(schema.episodeSources.episodeId, schema.episodes.id),
          eq(schema.episodeSources.sourceType, "link")
        )
      )
      .where(eq(schema.episodes.sourceType, "link"))
      .orderBy(desc(schema.episodes.createdAt));

    const sourcesSummary = await db
      .select()
      .from(schema.animeSources)
      .where(eq(schema.animeSources.sourceType, "link"))
      .orderBy(desc(schema.animeSources.createdAt));

    const formattedList = linkEpisodes.map((row) => ({
      id: row.episode.id,
      episodeId: row.episode.id,
      animeId: row.anime.id,
      animeTitle: row.anime.title,
      episodeNumber: row.episode.episodeNumber,
      episodeTitle: row.episode.title,
      url: row.episode.sourceUrl,
      quality: row.source?.quality || row.episode.videoQuality || "1080p",
      serverLabel: row.source?.label || "Server CDN Eksternal",
      createdAt: row.episode.createdAt,
    }));

    return NextResponse.json({
      success: true,
      totalLinks: formattedList.length,
      links: formattedList,
      sourcesSummary,
    });
  } catch (error: any) {
    console.error("GET /api/sources/link error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil daftar tautan streaming" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources/link
 * Memvalidasi dan menyimpan tautan streaming video baru ke dalam katalog anime
 */
export async function POST(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json();
    const {
      animeTitle,
      url,
      episodeNumber = 1,
      episodeTitle,
      quality = "1080p",
      serverLabel = "Server Utama (CDN)",
      synopsis,
      posterUrl,
    } = body;

    // 1. Validasi input dasar
    if (!animeTitle || typeof animeTitle !== "string" || !animeTitle.trim()) {
      return NextResponse.json(
        { success: false, error: "Nama judul anime wajib diisi" },
        { status: 400 }
      );
    }

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json(
        { success: false, error: "URL streaming video wajib diisi" },
        { status: 400 }
      );
    }

    const trimmedTitle = animeTitle.trim();
    const trimmedUrl = url.trim();

    // 2. Validasi format protokol URL
    try {
      const parsedUrl = new URL(trimmedUrl);
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        return NextResponse.json(
          {
            success: false,
            error: "Format URL tidak valid. Hanya protokol HTTP dan HTTPS yang didukung.",
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Format tautan URL tidak valid" },
        { status: 400 }
      );
    }

    const epNum = Number(episodeNumber) || 1;
    const animeSlug = trimmedTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const animeId = `anime-link-${animeSlug || Date.now()}`;
    const defaultUserId = "user-default";
    const now = new Date().toISOString();

    // 3. Cari atau buat Anime
    const existingAnime = await db
      .select()
      .from(schema.anime)
      .where(eq(schema.anime.id, animeId))
      .limit(1);

    if (existingAnime.length === 0) {
      await db.insert(schema.anime).values({
        id: animeId,
        userId: defaultUserId,
        title: trimmedTitle,
        synopsis:
          synopsis?.trim() ||
          `Serial anime ${trimmedTitle} ditambahkan melalui tautan streaming langsung: ${serverLabel}.`,
        year: new Date().getFullYear(),
        posterUrl:
          posterUrl ||
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        coverUrl:
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
        status: "sedang",
        isFeatured: false,
        rating: "8.6",
        totalEpisodes: epNum,
        genres: "Aksi, Petualangan, Direct Link",
        sourceType: "link",
        sourcePath: trimmedUrl,
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const curTotal = existingAnime[0].totalEpisodes || 1;
      if (epNum > curTotal) {
        await db
          .update(schema.anime)
          .set({ totalEpisodes: epNum, updatedAt: now })
          .where(eq(schema.anime.id, animeId));
      }
    }

    // 4. Cari atau buat Episode
    const episodeId = `ep-${animeSlug}-${epNum}`;
    const epTitleText = episodeTitle?.trim() || `Episode ${epNum}`;

    const existingEp = await db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.id, episodeId))
      .limit(1);

    if (existingEp.length === 0) {
      await db.insert(schema.episodes).values({
        id: episodeId,
        animeId,
        title: epTitleText,
        episodeNumber: epNum,
        durationSeconds: 1440,
        sourceType: "link",
        sourceUrl: trimmedUrl,
        thumbnailUrl:
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
        synopsis: `${epTitleText} dari anime ${trimmedTitle}. Sumber: ${serverLabel}`,
        videoQuality: quality,
        createdAt: now,
      });
    } else {
      await db
        .update(schema.episodes)
        .set({
          sourceUrl: trimmedUrl,
          videoQuality: quality,
        })
        .where(eq(schema.episodes.id, episodeId));
    }

    // 5. Catat ke tabel episodeSources
    const sourceId = `src-${episodeId}-link-${Date.now()}`;
    await db
      .insert(schema.episodeSources)
      .values({
        id: sourceId,
        episodeId,
        animeId,
        sourceType: "link",
        sourceUrl: trimmedUrl,
        quality,
        label: serverLabel,
        fileFormat: trimmedUrl.split("?")[0].endsWith(".m3u8") ? "hls" : "mp4",
        status: "ready",
        createdAt: now,
      })
      .onConflictDoNothing();

    // 6. Catat ke tabel animeSources
    const animeSourceId = `as-${animeId}-link`;
    await db
      .insert(schema.animeSources)
      .values({
        id: animeSourceId,
        animeId,
        sourceType: "link",
        sourceName: serverLabel,
        sourcePathOrUrl: trimmedUrl,
        totalEpisodesDetected: epNum,
        status: "active",
        lastSyncedAt: now,
        createdAt: now,
      })
      .onConflictDoNothing();

    return NextResponse.json({
      success: true,
      message: `Tautan streaming episode ${epNum} berhasil divalidasi dan disimpan ke katalog anime`,
      data: {
        animeId,
        animeTitle: trimmedTitle,
        episodeId,
        episodeNumber: epNum,
        episodeTitle: epTitleText,
        sourceId,
        url: trimmedUrl,
        quality,
        serverLabel,
      },
    });
  } catch (error: any) {
    console.error("POST /api/sources/link error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal menyimpan tautan streaming ke database",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sources/link
 * Menghapus tautan streaming atau episode sumber tertentu
 */
export async function DELETE(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get("episodeId");
    const sourceId = searchParams.get("sourceId");

    if (!episodeId && !sourceId) {
      return NextResponse.json(
        { success: false, error: "episodeId atau sourceId wajib disertakan" },
        { status: 400 }
      );
    }

    if (sourceId) {
      await db.delete(schema.episodeSources).where(eq(schema.episodeSources.id, sourceId));
    }

    if (episodeId) {
      await db.delete(schema.episodes).where(eq(schema.episodes.id, episodeId));
      await db.delete(schema.episodeSources).where(eq(schema.episodeSources.episodeId, episodeId));
    }

    return NextResponse.json({
      success: true,
      message: "Tautan streaming berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/sources/link error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus tautan streaming" },
      { status: 500 }
    );
  }
}
