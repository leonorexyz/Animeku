import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and } from "drizzle-orm";

/**
 * Logika inti pemutusan sambungan Google Drive
 */
export async function executeDriveDisconnect(req: Request) {
  await seedDatabase();
  const defaultUserId = "user-default";

  let removeCatalog = false;

  // Baca opsi dari URL query params atau JSON body bila ada
  const { searchParams } = new URL(req.url);
  if (
    searchParams.get("removeCatalog") === "true" ||
    searchParams.get("removeIndex") === "true"
  ) {
    removeCatalog = true;
  }

  if (req.method === "POST" || req.method === "DELETE") {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        if (body.removeCatalog || body.removeIndex) {
          removeCatalog = true;
        }
      }
    } catch (e) {
      // Abaikan jika tidak ada body JSON
    }
  }

  // 1. Hapus token otentikasi Google Drive dari connected_sources
  await db
    .delete(schema.connectedSources)
    .where(
      and(
        eq(schema.connectedSources.userId, defaultUserId),
        eq(schema.connectedSources.provider, "drive")
      )
    );

  let clearedCount = 0;

  // 2. Jika opsi hapus katalog dipilih, bersihkan seluruh anime dan episode yang bersumber dari Drive
  if (removeCatalog) {
    // Hapus episode sources drive
    await db
      .delete(schema.episodeSources)
      .where(eq(schema.episodeSources.sourceType, "drive"));

    // Hapus episodes drive
    await db
      .delete(schema.episodes)
      .where(eq(schema.episodes.sourceType, "drive"));

    // Ambil anime yang bersumber dari drive
    const driveAnimes = await db
      .select({ id: schema.anime.id })
      .from(schema.anime)
      .where(eq(schema.anime.sourceType, "drive"));

    clearedCount = driveAnimes.length;

    // Hapus anime drive
    await db
      .delete(schema.anime)
      .where(eq(schema.anime.sourceType, "drive"));

    // Hapus anime sources drive
    await db
      .delete(schema.animeSources)
      .where(eq(schema.animeSources.sourceType, "drive"));
  } else {
    // Jika tidak dihapus dari katalog, tandai anime sources sebagai disconnected
    await db
      .update(schema.animeSources)
      .set({ status: "disconnected" })
      .where(eq(schema.animeSources.sourceType, "drive"));
  }

  return {
    success: true,
    message: removeCatalog
      ? `Sambungan Google Drive diputus dan ${clearedCount} anime terkait dihapus dari katalog.`
      : "Sambungan akun Google Drive berhasil diputus. Riwayat katalog tetap disimpan.",
    removedFromCatalog: removeCatalog,
    clearedAnimeCount: clearedCount,
  };
}
