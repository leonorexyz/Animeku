import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and, desc, count } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/sources
 * Mengembalikan daftar semua sumber terhubung (Google Drive, Local Storage, Direct Link)
 * beserta statistik jumlah anime & episode yang terhubung.
 */
export async function GET(req: Request) {
  try {
    await seedDatabase();
    const defaultUserId = "user-default";

    // 1. Ambil koneksi akun dari connected_sources
    const connections = await db
      .select()
      .from(schema.connectedSources)
      .where(eq(schema.connectedSources.userId, defaultUserId));

    const driveConnection = connections.find((c) => c.provider === "drive");

    // 2. Hitung statistik episode per tipe sumber
    const driveEpisodes = await db
      .select({ count: count() })
      .from(schema.episodes)
      .where(eq(schema.episodes.sourceType, "drive"));

    const localEpisodes = await db
      .select({ count: count() })
      .from(schema.episodes)
      .where(eq(schema.episodes.sourceType, "local"));

    const linkEpisodes = await db
      .select({ count: count() })
      .from(schema.episodes)
      .where(eq(schema.episodes.sourceType, "link"));

    // 3. Hitung anime per tipe sumber
    const driveAnimes = await db
      .select({ count: count() })
      .from(schema.anime)
      .where(eq(schema.anime.sourceType, "drive"));

    const localAnimes = await db
      .select({ count: count() })
      .from(schema.anime)
      .where(eq(schema.anime.sourceType, "local"));

    const linkAnimes = await db
      .select({ count: count() })
      .from(schema.anime)
      .where(eq(schema.anime.sourceType, "link"));

    const sources = [
      {
        id: driveConnection ? driveConnection.id : "source-drive-default",
        provider: "drive",
        name: "Google Drive Cloud Storage",
        accountLabel: driveConnection ? driveConnection.accountLabel : null,
        isConnected: Boolean(driveConnection),
        connectedAt: driveConnection ? driveConnection.createdAt : null,
        animeCount: driveAnimes[0]?.count ?? 0,
        episodesCount: driveEpisodes[0]?.count ?? 0,
        description: "Folder Google Drive yang disinkronisasi untuk memutar video langsung dari cloud tanpa membebani server.",
        badge: "Cloud Storage",
        supportsDisconnect: true,
      },
      {
        id: "source-local-storage",
        provider: "local",
        name: "Penyimpanan Lokal Server",
        accountLabel: "Folder /uploads/videos",
        isConnected: true,
        connectedAt: "2026-01-01T00:00:00.000Z",
        animeCount: localAnimes[0]?.count ?? 0,
        episodesCount: localEpisodes[0]?.count ?? 0,
        description: "File video mp4/mkv yang diunggah langsung ke penyimpanan disk server lokal.",
        badge: "Local Disk",
        supportsDisconnect: false,
      },
      {
        id: "source-direct-links",
        provider: "link",
        name: "Tautan Eksternal / CDN Streaming",
        accountLabel: "HLS / MP4 Direct URLs",
        isConnected: true,
        connectedAt: "2026-01-01T00:00:00.000Z",
        animeCount: linkAnimes[0]?.count ?? 0,
        episodesCount: linkEpisodes[0]?.count ?? 0,
        description: "Tautan video streaming eksternal dengan dukungan resolusi multi-kualitas.",
        badge: "Direct Stream",
        supportsDisconnect: false,
      },
    ];

    return NextResponse.json({
      success: true,
      sources,
      totalConnected: sources.filter((s) => s.isConnected).length,
    });
  } catch (error: any) {
    console.error("GET /api/sources error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil daftar sumber terhubung" },
      { status: 500 }
    );
  }
}
