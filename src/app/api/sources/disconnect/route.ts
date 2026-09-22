import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and } from "drizzle-orm";
import { executeDriveDisconnect } from "@/lib/driveDisconnect";

export const dynamic = "force-dynamic";

/**
 * Helper untuk memproses pemutusan sambungan sumber media
 */
async function processSourceDisconnect(req: Request) {
  await seedDatabase();
  const defaultUserId = "user-default";

  const { searchParams } = new URL(req.url);
  let provider = searchParams.get("provider") || "drive";
  let sourceId = searchParams.get("sourceId") || searchParams.get("id");
  let removeCatalog =
    searchParams.get("removeCatalog") === "true" ||
    searchParams.get("removeIndex") === "true";

  if (req.method === "POST" || req.method === "DELETE") {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        if (body.provider) provider = body.provider;
        if (body.sourceId) sourceId = body.sourceId;
        if (body.removeCatalog !== undefined) removeCatalog = Boolean(body.removeCatalog);
      }
    } catch (e) {}
  }

  // 1. Jika sumbernya adalah Google Drive, gunakan executeDriveDisconnect
  if (provider === "drive" || provider === "google-drive") {
    const driveResult = await executeDriveDisconnect(req);
    return {
      success: true,
      provider: "drive",
      message: driveResult.message || "Sambungan Google Drive berhasil diputus.",
      removedFromCatalog: driveResult.removedFromCatalog,
      clearedAnimeCount: driveResult.clearedAnimeCount,
    };
  }

  // 2. Jika sumber lokal atau tautan eksternal
  if (sourceId) {
    // Hapus dari connected_sources jika ada
    await db
      .delete(schema.connectedSources)
      .where(
        and(
          eq(schema.connectedSources.id, sourceId),
          eq(schema.connectedSources.userId, defaultUserId)
        )
      );

    // Tandai atau hapus anime_sources terkait
    if (removeCatalog) {
      await db
        .delete(schema.animeSources)
        .where(eq(schema.animeSources.id, sourceId));
    } else {
      await db
        .update(schema.animeSources)
        .set({ status: "disconnected" })
        .where(eq(schema.animeSources.id, sourceId));
    }

    return {
      success: true,
      provider,
      sourceId,
      message: `Sambungan sumber ${sourceId} berhasil diputus.`,
      removedFromCatalog: removeCatalog,
    };
  }

  // 3. Putus sambungan berdasarkan tipe provider umum
  await db
    .delete(schema.connectedSources)
    .where(
      and(
        eq(schema.connectedSources.userId, defaultUserId),
        eq(schema.connectedSources.provider, provider)
      )
    );

  if (removeCatalog) {
    // Hapus dari episodeSources dan animeSources
    await db
      .delete(schema.episodeSources)
      .where(eq(schema.episodeSources.sourceType, provider as any));

    await db
      .delete(schema.animeSources)
      .where(eq(schema.animeSources.sourceType, provider as any));
  } else {
    await db
      .update(schema.animeSources)
      .set({ status: "disconnected" })
      .where(eq(schema.animeSources.sourceType, provider as any));
  }

  return {
    success: true,
    provider,
    message: `Sambungan sumber ${provider} berhasil diputus.`,
    removedFromCatalog: removeCatalog,
  };
}

/**
 * POST /api/sources/disconnect
 * Memutus sambungan penyedia sumber media
 */
export async function POST(req: Request) {
  try {
    const result = await processSourceDisconnect(req);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/sources/disconnect error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memutus sambungan sumber" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sources/disconnect
 * Memutus sambungan penyedia sumber media
 */
export async function DELETE(req: Request) {
  try {
    const result = await processSourceDisconnect(req);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE /api/sources/disconnect error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memutus sambungan sumber" },
      { status: 500 }
    );
  }
}
