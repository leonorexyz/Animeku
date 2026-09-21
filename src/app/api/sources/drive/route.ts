import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq, and, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/sources/drive
 * Mengambil status koneksi Google Drive saat ini, detail akun, dan folder yang terhubung
 */
export async function GET(req: Request) {
  try {
    await seedDatabase();
    const defaultUserId = "user-default";

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

    if (connection.length === 0) {
      return NextResponse.json({
        success: true,
        isConnected: false,
        source: null,
      });
    }

    const item = connection[0];

    // Ambil anime-anime yang terhubung dengan Google Drive
    const driveAnimeSources = await db
      .select()
      .from(schema.animeSources)
      .where(eq(schema.animeSources.sourceType, "drive"))
      .orderBy(desc(schema.animeSources.createdAt));

    return NextResponse.json({
      success: true,
      isConnected: true,
      source: {
        id: item.id,
        provider: item.provider,
        accountLabel: item.accountLabel,
        hasAccessToken: Boolean(item.accessToken),
        hasRefreshToken: Boolean(item.refreshToken),
        createdAt: item.createdAt,
      },
      linkedSourcesCount: driveAnimeSources.length,
    });
  } catch (error: any) {
    console.error("GET /api/sources/drive error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil status Google Drive" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sources/drive
 * Menghubungkan Google Drive secara manual atau memperbarui token akses
 */
export async function POST(req: Request) {
  try {
    await seedDatabase();
    const defaultUserId = "user-default";
    const body = await req.json().catch(() => ({}));
    const { accountEmail, accessToken, refreshToken } = body;

    const email = accountEmail || "animeku.personal@gmail.com";
    const now = new Date().toISOString();

    const existing = await db
      .select()
      .from(schema.connectedSources)
      .where(
        and(
          eq(schema.connectedSources.userId, defaultUserId),
          eq(schema.connectedSources.provider, "drive")
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.connectedSources)
        .set({
          accountLabel: email,
          accessToken: accessToken || existing[0].accessToken,
          refreshToken: refreshToken || existing[0].refreshToken,
          createdAt: now,
        })
        .where(eq(schema.connectedSources.id, existing[0].id));
    } else {
      await db.insert(schema.connectedSources).values({
        id: `cs-drive-${Date.now()}`,
        userId: defaultUserId,
        provider: "drive",
        accountLabel: email,
        accessToken: accessToken || "mock_drive_token",
        refreshToken: refreshToken || "mock_drive_refresh_token",
        createdAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Google Drive berhasil dihubungkan",
      accountEmail: email,
    });
  } catch (error: any) {
    console.error("POST /api/sources/drive error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghubungkan Google Drive" },
      { status: 500 }
    );
  }
}

import { executeDriveDisconnect } from "@/lib/driveDisconnect";

/**
 * DELETE /api/sources/drive
 * Memutus koneksi akun Google Drive (dengan dukungan opsi hapus katalog)
 */
export async function DELETE(req: Request) {
  try {
    const result = await executeDriveDisconnect(req);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE /api/sources/drive error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memutus koneksi Google Drive" },
      { status: 500 }
    );
  }
}
