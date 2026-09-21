import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Utilitas untuk memformat ukuran byte ke satuan yang terbaca
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Utilitas helper untuk mengekstrak nomor episode dan kualitas video dari nama file
 */
function parseDriveVideoInfo(filename: string): {
  episodeNumber: number;
  quality: string;
} {
  const qualityMatch = filename.match(/(2160p|4k|1080p|720p|480p)/i);
  const quality = qualityMatch ? qualityMatch[1].toUpperCase() : "1080p";

  let episodeNumber = 1;
  const epMatch = filename.match(/(?:[-_\s]|ep|episode|e)\s*0*(\d{1,4})(?:\s*v\d+)?(?:\s*\(|$|\s|\.)/i);
  if (epMatch) {
    episodeNumber = parseInt(epMatch[1], 10);
  }

  return { episodeNumber, quality };
}

// Data mock/sandbox untuk folder Google Drive
const DEMO_FOLDERS = [
  {
    id: "fld-1",
    name: "Anime Vault 2024",
    videoCount: 24,
    sizeBytes: 34789283712,
    sizeFormatted: "32.4 GB",
    isShared: true,
  },
  {
    id: "fld-2",
    name: "Sousou no Frieren [Complete 1080p]",
    videoCount: 28,
    sizeBytes: 41445728256,
    sizeFormatted: "38.6 GB",
    isShared: false,
  },
  {
    id: "fld-3",
    name: "Jujutsu Kaisen Season 2 (Shibuya Arc)",
    videoCount: 23,
    sizeBytes: 31245987840,
    sizeFormatted: "29.1 GB",
    isShared: true,
  },
  {
    id: "fld-4",
    name: "Anime Movies (Makoto Shinkai & Ghibli)",
    videoCount: 8,
    sizeBytes: 19864224768,
    sizeFormatted: "18.5 GB",
    isShared: false,
  },
];

const DEMO_FILES: Record<
  string,
  Array<{
    id: string;
    name: string;
    size: number;
    mimeType: string;
  }>
> = {
  "fld-1": [
    {
      id: "dr-101",
      name: "[SubsPlease] Solo Leveling - 01 (1080p).mkv",
      size: 1395864371,
      mimeType: "video/x-matroska",
    },
    {
      id: "dr-102",
      name: "[SubsPlease] Solo Leveling - 02 (1080p).mkv",
      size: 1288490188,
      mimeType: "video/x-matroska",
    },
    {
      id: "dr-103",
      name: "[SubsPlease] Solo Leveling - 03 (1080p).mkv",
      size: 1503238553,
      mimeType: "video/x-matroska",
    },
    {
      id: "dr-104",
      name: "[SubsPlease] Solo Leveling - 04 (1080p).mkv",
      size: 1412589320,
      mimeType: "video/x-matroska",
    },
  ],
  "fld-2": [
    {
      id: "dr-201",
      name: "Frieren Beyond Journeys End - 01 [BD 1080p].mp4",
      size: 1181116006,
      mimeType: "video/mp4",
    },
    {
      id: "dr-202",
      name: "Frieren Beyond Journeys End - 02 [BD 1080p].mp4",
      size: 1288490188,
      mimeType: "video/mp4",
    },
    {
      id: "dr-203",
      name: "Frieren Beyond Journeys End - 03 [BD 1080p].mp4",
      size: 1224065679,
      mimeType: "video/mp4",
    },
  ],
  "fld-3": [
    {
      id: "dr-301",
      name: "[Judas] Jujutsu Kaisen S02 - 01 (1080p).mkv",
      size: 1450000000,
      mimeType: "video/x-matroska",
    },
    {
      id: "dr-302",
      name: "[Judas] Jujutsu Kaisen S02 - 02 (1080p).mkv",
      size: 1380000000,
      mimeType: "video/x-matroska",
    },
  ],
  "fld-4": [
    {
      id: "dr-401",
      name: "Kimi no Na wa (Your Name) [1080p Remux].mp4",
      size: 4500000000,
      mimeType: "video/mp4",
    },
    {
      id: "dr-402",
      name: "Suzume no Tojimari [1080p WEB-DL].mp4",
      size: 3800000000,
      mimeType: "video/mp4",
    },
  ],
};

/**
 * Helper untuk mem-parsing ID folder dari string input URL atau ID langsung
 */
function extractFolderId(input: string): string {
  const trimmed = input.trim();
  const urlMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (urlMatch) return urlMatch[1];
  const idMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

/**
 * GET /api/sources/drive/folders
 * Menelusuri folder atau berkas di Google Drive
 */
export async function GET(req: Request) {
  try {
    await seedDatabase();

    const { searchParams } = new URL(req.url);
    const folderIdParam = searchParams.get("folderId");
    const searchQuery = searchParams.get("q") || searchParams.get("query") || "";

    const defaultUserId = "user-default";

    // Ambil koneksi Google Drive
    const connection = await db
      .select()
      .from(schema.connectedSources)
      .where(
        and(
          eq(schema.connectedSources.userId, defaultUserId),
          eq(schema.connectedSources.provider, "drive")
        )
      )
      .limit(1);

    const isConnected = connection.length > 0;
    const accessToken = connection[0]?.accessToken;

    // 1. Jika folderId diberikan, telusuri isi berkas di dalam folder tersebut
    if (folderIdParam) {
      const folderId = extractFolderId(folderIdParam);

      // Coba akses Google Drive API resmi jika accessToken tersedia dan bukan mock
      if (accessToken && !accessToken.startsWith("mock_")) {
        try {
          const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q='${encodeURIComponent(
            folderId
          )}' in parents and trashed=false&fields=files(id,name,mimeType,size,shared,webViewLink,videoMediaMetadata)&orderBy=name`;

          const gRes = await fetch(driveApiUrl, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (gRes.ok) {
            const gData = await gRes.json();
            const rawFiles = gData.files || [];

            const videoFiles = rawFiles
              .filter((f: any) => {
                const isVideoMime = f.mimeType?.startsWith("video/");
                const hasVideoExt = /\.(mp4|mkv|webm|avi|mov|ts)$/i.test(f.name);
                return isVideoMime || hasVideoExt;
              })
              .map((f: any) => {
                const { episodeNumber, quality } = parseDriveVideoInfo(f.name);
                const sizeNum = Number(f.size) || 0;
                return {
                  id: f.id,
                  driveFileId: f.id,
                  name: f.name,
                  size: sizeNum,
                  sizeFormatted: formatBytes(sizeNum),
                  episodeNumber,
                  quality,
                  mimeType: f.mimeType || "video/mp4",
                  streamable: true,
                  webViewLink: f.webViewLink,
                };
              });

            const subfolders = rawFiles
              .filter((f: any) => f.mimeType === "application/vnd.google-apps.folder")
              .map((f: any) => ({
                id: f.id,
                name: f.name,
                mimeType: f.mimeType,
              }));

            return NextResponse.json({
              success: true,
              folderId,
              files: videoFiles,
              subfolders,
              totalVideos: videoFiles.length,
              source: "google_drive_api",
            });
          }
        } catch (apiError) {
          console.warn("Google Drive API request failed, falling back to mock:", apiError);
        }
      }

      // Mode mock / sandbox data untuk penelusuran folder
      const mockItems = DEMO_FILES[folderId] || [
        {
          id: `dr-${folderId}-01`,
          name: `Anime Collection [${folderId}] - Episode 01 (1080p).mp4`,
          size: 1250000000,
          mimeType: "video/mp4",
        },
        {
          id: `dr-${folderId}-02`,
          name: `Anime Collection [${folderId}] - Episode 02 (1080p).mp4`,
          size: 1300000000,
          mimeType: "video/mp4",
        },
        {
          id: `dr-${folderId}-03`,
          name: `Anime Collection [${folderId}] - Episode 03 (1080p).mp4`,
          size: 1220000000,
          mimeType: "video/mp4",
        },
      ];

      const formattedVideos = mockItems.map((f) => {
        const { episodeNumber, quality } = parseDriveVideoInfo(f.name);
        return {
          id: f.id,
          driveFileId: f.id,
          name: f.name,
          size: f.size,
          sizeFormatted: formatBytes(f.size),
          episodeNumber,
          quality,
          mimeType: f.mimeType,
          streamable: true,
        };
      });

      const folderMeta = DEMO_FOLDERS.find((d) => d.id === folderId) || {
        id: folderId,
        name: `Folder ${folderId}`,
        videoCount: formattedVideos.length,
        sizeFormatted: "3.7 GB",
        isShared: false,
      };

      return NextResponse.json({
        success: true,
        folderId,
        folder: folderMeta,
        files: formattedVideos,
        subfolders: [],
        totalVideos: formattedVideos.length,
        source: "mock_sandbox",
      });
    }

    // 2. Jika tidak ada folderId, daftarkan seluruh folder Drive yang tersedia
    let foldersList = DEMO_FOLDERS;

    if (accessToken && !accessToken.startsWith("mock_")) {
      try {
        let q = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
        if (searchQuery) {
          q += ` and name contains '${searchQuery.replace(/'/g, "\\'")}'`;
        }

        const driveApiUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          q
        )}&fields=files(id,name,mimeType,shared,size)&pageSize=30&orderBy=name`;

        const gRes = await fetch(driveApiUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData.files) && gData.files.length > 0) {
            foldersList = gData.files.map((f: any) => ({
              id: f.id,
              name: f.name,
              videoCount: 0,
              sizeBytes: Number(f.size) || 0,
              sizeFormatted: formatBytes(Number(f.size) || 0),
              isShared: Boolean(f.shared),
            }));
          }
        }
      } catch (err) {
        console.warn("Failed fetching folders from Google Drive API:", err);
      }
    }

    if (searchQuery) {
      foldersList = foldersList.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      isConnected,
      totalFolders: foldersList.length,
      folders: foldersList,
    });
  } catch (error: any) {
    console.error("GET /api/sources/drive/folders error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal menelusuri folder Google Drive",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources/drive/folders
 * Mendaftarkan atau menyinkronkan folder Google Drive ke anime katalog
 */
export async function POST(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json();
    const { folderId, folderName, animeTitle, files } = body;

    if (!folderId || !folderName) {
      return NextResponse.json(
        { success: false, error: "folderId dan folderName wajib disertakan" },
        { status: 400 }
      );
    }

    const title = animeTitle?.trim() || folderName.replace(/\[[^\]]+\]/g, "").trim();
    const animeSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const animeId = `anime-drive-${animeSlug || folderId}`;
    const defaultUserId = "user-default";
    const now = new Date().toISOString();

    const episodeList = Array.isArray(files) && files.length > 0
      ? files
      : (DEMO_FILES[folderId] || []).map((f) => {
          const { episodeNumber, quality } = parseDriveVideoInfo(f.name);
          return {
            id: f.id,
            name: f.name,
            episodeNumber,
            quality,
            size: f.size,
          };
        });

    // 1. Buat Anime bila belum ada
    const existingAnime = await db
      .select()
      .from(schema.anime)
      .where(eq(schema.anime.id, animeId))
      .limit(1);

    if (existingAnime.length === 0) {
      await db.insert(schema.anime).values({
        id: animeId,
        userId: defaultUserId,
        title,
        synopsis: `Serial anime ${title} disinkronkan dari folder Google Drive: "${folderName}".`,
        year: new Date().getFullYear(),
        posterUrl:
          "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
        coverUrl:
          "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
        status: "sedang",
        isFeatured: false,
        rating: "8.8",
        totalEpisodes: episodeList.length || 12,
        genres: "Aksi, Petualangan, Drive Cloud",
        sourceType: "drive",
        sourcePath: `gdrive://folder/${folderId}`,
        createdAt: now,
        updatedAt: now,
      });
    }

    // 2. Simpan animeSources
    const animeSourceId = `as-${animeId}-${folderId}`;
    await db
      .insert(schema.animeSources)
      .values({
        id: animeSourceId,
        animeId,
        sourceType: "drive",
        sourceName: folderName,
        sourcePathOrUrl: `gdrive://folder/${folderId}`,
        driveFolderId: folderId,
        totalEpisodesDetected: episodeList.length,
        status: "active",
        lastSyncedAt: now,
        createdAt: now,
      })
      .onConflictDoNothing();

    // 3. Masukkan episode
    for (const ep of episodeList) {
      const epNum = Number(ep.episodeNumber) || 1;
      const epId = `ep-${animeSlug}-${epNum}`;
      const driveFileId = ep.id || ep.driveFileId || `dr-${epId}`;
      const streamUrl = `/api/stream?source=drive&fileId=${driveFileId}`;

      const existingEp = await db
        .select()
        .from(schema.episodes)
        .where(eq(schema.episodes.id, epId))
        .limit(1);

      if (existingEp.length === 0) {
        await db.insert(schema.episodes).values({
          id: epId,
          animeId,
          title: `Episode ${epNum}`,
          episodeNumber: epNum,
          durationSeconds: 1440,
          sourceType: "drive",
          sourceUrl: streamUrl,
          thumbnailUrl:
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
          synopsis: `Episode ${epNum} dari ${title}. Sumber Google Drive: ${ep.name}`,
          fileSize: ep.size || 1200000000,
          videoQuality: ep.quality || "1080p",
          createdAt: now,
        });
      }

      // Catat ke episodeSources
      await db
        .insert(schema.episodeSources)
        .values({
          id: `src-${epId}-drive`,
          episodeId: epId,
          animeId,
          sourceType: "drive",
          sourceUrl: streamUrl,
          quality: ep.quality || "1080p",
          label: "Google Drive Cloud",
          driveFileId,
          fileSize: ep.size || 1200000000,
          fileFormat: "mp4",
          status: "ready",
          createdAt: now,
        })
        .onConflictDoNothing();
    }

    return NextResponse.json({
      success: true,
      message: `Folder Google Drive "${folderName}" berhasil disinkronkan ke katalog (${episodeList.length} episode)`,
      animeId,
      episodesCount: episodeList.length,
    });
  } catch (error: any) {
    console.error("POST /api/sources/drive/folders error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menyinkronkan folder Google Drive" },
      { status: 500 }
    );
  }
}
