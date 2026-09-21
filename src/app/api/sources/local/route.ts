import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and, desc } from "drizzle-orm";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * Utilitas helper untuk mengekstrak informasi judul, episode, season, dan kualitas dari nama file video
 */
function parseVideoFileName(filename: string): {
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  quality: string;
} {
  const nameWithoutExt = filename.replace(/\.(mp4|mkv|webm|avi|mov|ts)$/i, "");
  const qualityMatch = nameWithoutExt.match(/(1080p|720p|480p|2160p|4k)/i);
  const quality = qualityMatch ? qualityMatch[1].toLowerCase() : "1080p";

  let cleanName = nameWithoutExt.replace(/^\[[^\]]+\]\s*/, "");
  cleanName = cleanName.replace(/\s*\[[^\]]+\]$/, "");

  let seasonNumber = 1;
  const seasonMatch = cleanName.match(/(?:S|Season\s*)(\d+)/i);
  if (seasonMatch) {
    seasonNumber = parseInt(seasonMatch[1], 10);
  }

  let episodeNumber = 1;
  const epMatch = cleanName.match(/(?:[-_\s]|ep|episode|e)\s*0*(\d{1,4})(?:\s*v\d+)?(?:\s*\(|$|\s)/i);
  if (epMatch) {
    episodeNumber = parseInt(epMatch[1], 10);
  }

  let title = cleanName
    .replace(/(?:[-_\s]+)?(?:ep|episode|e)?\s*0*\d{1,4}.*$/i, "")
    .replace(/(?:S|Season\s*)\d+.*/i, "")
    .replace(/[_\.]/g, " ")
    .trim();

  if (!title) {
    title = cleanName;
  }

  return { title, episodeNumber, seasonNumber, quality };
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const UPLOAD_SUBDIR = "uploads/videos";

function getUploadDir(): string {
  const dir = path.join(process.cwd(), "public", UPLOAD_SUBDIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

/**
 * GET /api/sources/local
 * Mengambil daftar seluruh berkas video lokal dan sumber lokal yang terdaftar
 */
export async function GET(req: Request) {
  try {
    await seedDatabase();

    // 1. Ambil rekaman episode lokal dari database
    const localEpisodes = await db
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
          eq(schema.episodeSources.sourceType, "local")
        )
      )
      .where(eq(schema.episodes.sourceType, "local"))
      .orderBy(desc(schema.episodes.createdAt));

    // 2. Ambil sumber folder anime lokal
    const localSources = await db
      .select()
      .from(schema.animeSources)
      .where(eq(schema.animeSources.sourceType, "local"))
      .orderBy(desc(schema.animeSources.createdAt));

    // 3. Pindai folder penyimpanan fisik di server
    const uploadDir = getUploadDir();
    let physicalFiles: Array<{
      filename: string;
      size: number;
      sizeFormatted: string;
      url: string;
      createdAt: string;
    }> = [];

    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      physicalFiles = files
        .filter((file) => /\.(mp4|mkv|webm|avi|mov)$/i.test(file))
        .map((filename) => {
          const filePath = path.join(uploadDir, filename);
          const stats = fs.statSync(filePath);
          return {
            filename,
            size: stats.size,
            sizeFormatted: formatBytes(stats.size),
            url: `/${UPLOAD_SUBDIR}/${filename}`,
            createdAt: stats.birthtime.toISOString(),
          };
        });
    }

    const formattedList = localEpisodes.map((row) => ({
      id: row.episode.id,
      episodeId: row.episode.id,
      animeId: row.anime.id,
      animeTitle: row.anime.title,
      episodeNumber: row.episode.episodeNumber,
      episodeTitle: row.episode.title,
      sourceUrl: row.episode.sourceUrl,
      quality: row.source?.quality || row.episode.videoQuality || "1080p",
      fileSize: row.source?.fileSize || row.episode.fileSize || 0,
      fileSizeFormatted: formatBytes(row.source?.fileSize || row.episode.fileSize || 0),
      createdAt: row.episode.createdAt,
    }));

    return NextResponse.json({
      success: true,
      totalFiles: formattedList.length + physicalFiles.length,
      sourcesCount: localSources.length,
      data: {
        registeredEpisodes: formattedList,
        localSources,
        physicalUploads: physicalFiles,
      },
    });
  } catch (error: any) {
    console.error("GET /api/sources/local error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil daftar file lokal" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources/local
 * Mengunggah berkas video lokal baru atau mendaftarkan jalur berkas lokal ke database
 */
export async function POST(req: Request) {
  try {
    await seedDatabase();
    const contentType = req.headers.get("content-type") || "";

    // 1. Penanganan Multipart Form-Data (Unggah Berkas Nyata)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const files = formData.getAll("files") as File[];
      const singleFile = formData.get("file") as File | null;
      const customAnimeTitle = formData.get("animeTitle") as string | null;
      const customYear = Number(formData.get("year")) || new Date().getFullYear();

      const uploadFiles: File[] = [];
      if (files && files.length > 0) {
        uploadFiles.push(...files.filter((f) => f instanceof File));
      } else if (singleFile instanceof File) {
        uploadFiles.push(singleFile);
      }

      if (uploadFiles.length === 0) {
        return NextResponse.json(
          { success: false, error: "Tidak ada berkas video yang diunggah" },
          { status: 400 }
        );
      }

      const uploadDir = getUploadDir();
      const savedEpisodes = [];
      const defaultUser = "user-default";

      for (const file of uploadFiles) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Bersihkan nama berkas
        const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = path.join(uploadDir, sanitizedFilename);
        fs.writeFileSync(filePath, buffer);

        const parsed = parseVideoFileName(file.name);
        const animeTitle = customAnimeTitle?.trim() || parsed.title;
        const animeSlug = animeTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const animeId = `anime-${animeSlug || "local"}`;

        const now = new Date().toISOString();

        // 1. Cari atau buat Anime
        const existingAnime = await db
          .select()
          .from(schema.anime)
          .where(eq(schema.anime.id, animeId))
          .limit(1);

        if (existingAnime.length === 0) {
          await db.insert(schema.anime).values({
            id: animeId,
            userId: defaultUser,
            title: animeTitle,
            synopsis: `Serial anime ${animeTitle} diimpor langsung dari sumber berkas lokal pengguna.`,
            year: customYear,
            posterUrl:
              "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
            coverUrl:
              "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
            status: "sedang",
            isFeatured: false,
            rating: "8.5",
            totalEpisodes: parsed.episodeNumber,
            genres: "Aksi, Petualangan, Lokal",
            sourceType: "local",
            sourcePath: `/${UPLOAD_SUBDIR}/${sanitizedFilename}`,
            createdAt: now,
            updatedAt: now,
          });
        } else {
          // Update total episodes jika lebih besar
          const curTotal = existingAnime[0].totalEpisodes || 1;
          if (parsed.episodeNumber > curTotal) {
            await db
              .update(schema.anime)
              .set({
                totalEpisodes: parsed.episodeNumber,
                updatedAt: now,
              })
              .where(eq(schema.anime.id, animeId));
          }
        }

        // 2. Buat atau perbarui episode
        const episodeId = `ep-${animeSlug}-${parsed.episodeNumber}`;
        const sourceUrl = `/${UPLOAD_SUBDIR}/${sanitizedFilename}`;

        const existingEp = await db
          .select()
          .from(schema.episodes)
          .where(eq(schema.episodes.id, episodeId))
          .limit(1);

        if (existingEp.length === 0) {
          await db.insert(schema.episodes).values({
            id: episodeId,
            animeId,
            title: `Episode ${parsed.episodeNumber}`,
            episodeNumber: parsed.episodeNumber,
            durationSeconds: 1440,
            sourceType: "local",
            sourceUrl,
            thumbnailUrl:
              "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
            synopsis: `Episode ${parsed.episodeNumber} dari anime ${animeTitle}. Berkas lokal: ${sanitizedFilename}`,
            fileSize: file.size,
            videoQuality: parsed.quality,
            createdAt: now,
          });
        } else {
          await db
            .update(schema.episodes)
            .set({
              sourceUrl,
              fileSize: file.size,
              videoQuality: parsed.quality,
            })
            .where(eq(schema.episodes.id, episodeId));
        }

        // 3. Tambahkan sumber episode
        const sourceId = `src-${episodeId}-local`;
        await db
          .insert(schema.episodeSources)
          .values({
            id: sourceId,
            episodeId,
            animeId,
            sourceType: "local",
            sourceUrl,
            quality: parsed.quality,
            label: "Penyimpanan Lokal",
            fileSize: file.size,
            fileFormat: path.extname(file.name).replace(".", "") || "mp4",
            localPath: filePath,
            status: "ready",
            createdAt: now,
          })
          .onConflictDoNothing();

        // 4. Catat ke animeSources
        const animeSourceId = `as-${animeId}-local`;
        await db
          .insert(schema.animeSources)
          .values({
            id: animeSourceId,
            animeId,
            sourceType: "local",
            sourceName: "Folder Unggahan Lokal",
            sourcePathOrUrl: `/${UPLOAD_SUBDIR}`,
            totalEpisodesDetected: parsed.episodeNumber,
            status: "active",
            lastSyncedAt: now,
            createdAt: now,
          })
          .onConflictDoNothing();

        savedEpisodes.push({
          animeId,
          animeTitle,
          episodeId,
          episodeNumber: parsed.episodeNumber,
          filename: sanitizedFilename,
          quality: parsed.quality,
          size: file.size,
          sizeFormatted: formatBytes(file.size),
          url: sourceUrl,
        });
      }

      return NextResponse.json({
        success: true,
        message: `${uploadFiles.length} berkas video berhasil diunggah dan ditambahkan ke katalog`,
        uploadedCount: uploadFiles.length,
        data: savedEpisodes,
      });
    }

    // 2. Penanganan JSON Payload (Pendaftaran Jalur Berkas atau Metadata Impor)
    const body = await req.json();
    const { animeTitle, files, folderPath } = body;

    if (!animeTitle || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "animeTitle dan daftar files wajib disertakan" },
        { status: 400 }
      );
    }

    const animeSlug = animeTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const animeId = `anime-${animeSlug}`;
    const defaultUser = "user-default";
    const now = new Date().toISOString();

    // Buat Anime jika belum ada
    const existingAnime = await db
      .select()
      .from(schema.anime)
      .where(eq(schema.anime.id, animeId))
      .limit(1);

    if (existingAnime.length === 0) {
      await db.insert(schema.anime).values({
        id: animeId,
        userId: defaultUser,
        title: animeTitle,
        synopsis: `Serial anime ${animeTitle} diimpor dari folder berkas lokal: ${folderPath || "Lokal"}.`,
        year: new Date().getFullYear(),
        posterUrl:
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        coverUrl:
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
        status: "sedang",
        isFeatured: false,
        rating: "8.5",
        totalEpisodes: files.length,
        genres: "Aksi, Petualangan, Lokal",
        sourceType: "local",
        sourcePath: folderPath || "/uploads/videos",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Daftarkan setiap berkas episode
    const registered = [];
    for (const item of files) {
      const epNum = Number(item.episodeNumber) || 1;
      const epId = `ep-${animeSlug}-${epNum}`;
      const sourceUrl = item.sourceUrl || item.path || `/${UPLOAD_SUBDIR}/${item.name}`;

      await db
        .insert(schema.episodes)
        .values({
          id: epId,
          animeId,
          title: item.title || `Episode ${epNum}`,
          episodeNumber: epNum,
          durationSeconds: Number(item.durationSeconds) || 1440,
          sourceType: "local",
          sourceUrl,
          thumbnailUrl:
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
          synopsis: `Episode ${epNum} dari ${animeTitle}. Berkas lokal: ${item.name}`,
          fileSize: Number(item.size) || 0,
          videoQuality: item.quality || "1080p",
          createdAt: now,
        })
        .onConflictDoNothing();

      await db
        .insert(schema.episodeSources)
        .values({
          id: `src-${epId}-local`,
          episodeId: epId,
          animeId,
          sourceType: "local",
          sourceUrl,
          quality: item.quality || "1080p",
          label: "Penyimpanan Lokal",
          fileSize: Number(item.size) || 0,
          localPath: item.path || sourceUrl,
          status: "ready",
          createdAt: now,
        })
        .onConflictDoNothing();

      registered.push({
        episodeId: epId,
        episodeNumber: epNum,
        title: item.title || `Episode ${epNum}`,
        sourceUrl,
      });
    }

    // Catat ke animeSources
    await db
      .insert(schema.animeSources)
      .values({
        id: `as-${animeId}-local`,
        animeId,
        sourceType: "local",
        sourceName: folderPath ? `Folder (${folderPath})` : "Folder Lokal",
        sourcePathOrUrl: folderPath || "/uploads/videos",
        totalEpisodesDetected: files.length,
        status: "active",
        lastSyncedAt: now,
        createdAt: now,
      })
      .onConflictDoNothing();

    return NextResponse.json({
      success: true,
      message: `${files.length} episode lokal berhasil didaftarkan ke katalog`,
      data: {
        animeId,
        animeTitle,
        episodes: registered,
      },
    });
  } catch (error: any) {
    console.error("POST /api/sources/local error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengunggah/mendaftarkan berkas lokal" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sources/local
 * Menghapus berkas lokal dari penyimpanan dan database
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const episodeId = searchParams.get("episodeId");
    const filename = searchParams.get("filename");
    const animeId = searchParams.get("animeId");

    if (!episodeId && !filename && !animeId) {
      return NextResponse.json(
        { success: false, error: "episodeId, filename, atau animeId wajib disertakan" },
        { status: 400 }
      );
    }

    // Hapus berkas fisik jika filename diberikan
    if (filename) {
      const uploadDir = getUploadDir();
      const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(uploadDir, sanitized);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Hapus episode jika episodeId diberikan
    if (episodeId) {
      await db.delete(schema.episodes).where(eq(schema.episodes.id, episodeId));
      await db
        .delete(schema.episodeSources)
        .where(eq(schema.episodeSources.episodeId, episodeId));
    }

    // Hapus anime jika animeId diberikan
    if (animeId) {
      await db.delete(schema.anime).where(eq(schema.anime.id, animeId));
    }

    return NextResponse.json({
      success: true,
      message: "Berkas/sumber lokal berhasil dihapus",
    });
  } catch (error: any) {
    console.error("DELETE /api/sources/local error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus berkas lokal" },
      { status: 500 }
    );
  }
}
