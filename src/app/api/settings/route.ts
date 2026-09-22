import { NextResponse } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { eq } from "drizzle-orm";
import { MOCK_SETTINGS, AppSettings } from "@/data/mockSettings";

export const dynamic = "force-dynamic";

/**
 * GET /api/settings
 * Mengambil konfigurasi dan preferensi pengguna dari database
 */
export async function GET(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-default";

    // Ambil data user
    const userResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);

    const user = userResult[0];

    // Ambil preferensi pengaturan
    const settingsResult = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.userId, userId))
      .limit(1);

    if (settingsResult.length === 0) {
      // Jika belum ada, kembalikan nilai default gabungan
      const defaultData: AppSettings = {
        ...MOCK_SETTINGS,
        userName: user?.name || MOCK_SETTINGS.userName,
        userEmail: user?.email || MOCK_SETTINGS.userEmail,
      };
      return NextResponse.json({
        success: true,
        settings: defaultData,
        isDefault: true,
      });
    }

    const row = settingsResult[0];

    const mappedSettings: AppSettings = {
      theme: (row.theme as "dark" | "netflix" | "oled") || "netflix",
      cardSize: (row.cardSize as "small" | "medium" | "large") || "medium",
      heroBannerAutoPlay: row.heroBannerAutoPlay ?? true,
      compactSidebar: row.compactSidebar ?? false,
      language: (row.language as "id" | "en") || "id",

      defaultQuality: (row.defaultQuality as "auto" | "1080p" | "720p" | "480p" | "360p") || "1080p",
      defaultSubtitle: (row.defaultSubtitle as "id" | "en" | "none") || "id",
      playbackSpeed: row.playbackSpeed ?? 1.0,
      autoPlayNext: row.autoPlayNext ?? true,
      skipIntroSeconds: row.skipIntroSeconds ?? 85,
      resumePlayback: row.resumePlayback ?? true,

      autoSyncDrive: row.autoSyncDrive ?? true,
      syncIntervalHours: row.syncIntervalHours ?? 6,
      cacheLimitMb: row.cacheLimitMb ?? 500,
      allowCellularStream: row.allowCellularStream ?? true,

      userName: user?.name || "Pengguna Animeku",
      userEmail: user?.email || "user@animeku.local",
      avatarId: "avatar-1",
    };

    return NextResponse.json({
      success: true,
      settings: mappedSettings,
      updatedAt: row.updatedAt,
    });
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil pengaturan pengguna" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/settings
 * Menyimpan / memperbarui preferensi pengaturan aplikasi pengguna
 */
export async function POST(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || "user-default";
    const now = new Date().toISOString();

    // 1. Perbarui profil user jika nama / email dikirim
    if (body.userName || body.userEmail) {
      const userUpdate: any = {};
      if (body.userName) userUpdate.name = String(body.userName).trim();
      if (body.userEmail) userUpdate.email = String(body.userEmail).trim();

      await db
        .update(schema.users)
        .set(userUpdate)
        .where(eq(schema.users.id, userId));
    }

    // 2. Siapkan data baris app_settings
    const settingsPayload = {
      theme: body.theme || "netflix",
      cardSize: body.cardSize || "medium",
      heroBannerAutoPlay: body.heroBannerAutoPlay !== undefined ? Boolean(body.heroBannerAutoPlay) : true,
      compactSidebar: body.compactSidebar !== undefined ? Boolean(body.compactSidebar) : false,
      language: body.language || "id",

      defaultQuality: body.defaultQuality || "1080p",
      defaultSubtitle: body.defaultSubtitle || "id",
      playbackSpeed: typeof body.playbackSpeed === "number" ? body.playbackSpeed : 1.0,
      autoPlayNext: body.autoPlayNext !== undefined ? Boolean(body.autoPlayNext) : true,
      skipIntroSeconds: typeof body.skipIntroSeconds === "number" ? body.skipIntroSeconds : 85,
      resumePlayback: body.resumePlayback !== undefined ? Boolean(body.resumePlayback) : true,

      autoSyncDrive: body.autoSyncDrive !== undefined ? Boolean(body.autoSyncDrive) : true,
      syncIntervalHours: typeof body.syncIntervalHours === "number" ? body.syncIntervalHours : 6,
      cacheLimitMb: typeof body.cacheLimitMb === "number" ? body.cacheLimitMb : 500,
      allowCellularStream: body.allowCellularStream !== undefined ? Boolean(body.allowCellularStream) : true,

      updatedAt: now,
    };

    // 3. Cek apakah baris sudah ada
    const existing = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.appSettings)
        .set(settingsPayload)
        .where(eq(schema.appSettings.userId, userId));
    } else {
      await db.insert(schema.appSettings).values({
        id: `settings-${userId}`,
        userId,
        ...settingsPayload,
        createdAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Preferensi pengaturan berhasil disimpan ke database.",
      settings: {
        ...settingsPayload,
        userName: body.userName || "Pengguna Animeku",
        userEmail: body.userEmail || "user@animeku.local",
        avatarId: body.avatarId || "avatar-1",
      },
    });
  } catch (error: any) {
    console.error("POST /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menyimpan preferensi pengaturan" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings
 * Mengembalikan preferensi pengaturan ke nilai default pabrik
 */
export async function DELETE(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || "user-default";
    const now = new Date().toISOString();

    await db
      .delete(schema.appSettings)
      .where(eq(schema.appSettings.userId, userId));

    // Re-seed dengan nilai default
    await db.insert(schema.appSettings).values({
      id: `settings-${userId}`,
      userId,
      theme: "netflix",
      cardSize: "medium",
      heroBannerAutoPlay: true,
      compactSidebar: false,
      language: "id",
      defaultSubtitle: "id",
      defaultQuality: "1080p",
      playbackSpeed: 1.0,
      autoPlayNext: true,
      skipIntroSeconds: 85,
      resumePlayback: true,
      autoSyncDrive: true,
      syncIntervalHours: 6,
      cacheLimitMb: 500,
      allowCellularStream: true,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Pengaturan berhasil direset ke nilai default pabrik.",
      settings: MOCK_SETTINGS,
    });
  } catch (error: any) {
    console.error("DELETE /api/settings error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mereset pengaturan" },
      { status: 500 }
    );
  }
}
