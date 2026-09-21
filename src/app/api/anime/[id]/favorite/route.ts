import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const DEFAULT_USER_ID = "user-default";

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId wajib diisi" },
        { status: 400 }
      );
    }

    const [fav] = await db
      .select()
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, DEFAULT_USER_ID),
          eq(schema.favorites.animeId, animeId)
        )
      )
      .limit(1);

    return NextResponse.json({
      success: true,
      animeId,
      isFavorite: !!fav,
    });
  } catch (error: any) {
    console.error("GET /api/anime/[id]/favorite error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil status favorit" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId wajib diisi" },
        { status: 400 }
      );
    }

    let action = "toggle";
    try {
      const body = await req.json();
      if (body?.action) action = body.action;
    } catch {
      // Default to toggle if no body
    }

    const [existing] = await db
      .select()
      .from(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, DEFAULT_USER_ID),
          eq(schema.favorites.animeId, animeId)
        )
      )
      .limit(1);

    if (action === "remove" || (action === "toggle" && existing)) {
      if (existing) {
        await db
          .delete(schema.favorites)
          .where(eq(schema.favorites.id, existing.id));
      }
      return NextResponse.json({
        success: true,
        animeId,
        isFavorite: false,
        message: "Anime berhasil dihapus dari favorit",
      });
    }

    if (!existing) {
      const now = new Date().toISOString();
      const favId = `fav-${DEFAULT_USER_ID}-${animeId}`;
      await db.insert(schema.favorites).values({
        id: favId,
        userId: DEFAULT_USER_ID,
        animeId,
        createdAt: now,
      });
    }

    return NextResponse.json({
      success: true,
      animeId,
      isFavorite: true,
      message: "Anime berhasil ditambahkan ke favorit",
    });
  } catch (error: any) {
    console.error("POST /api/anime/[id]/favorite error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memperbarui status favorit" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId wajib diisi" },
        { status: 400 }
      );
    }

    await db
      .delete(schema.favorites)
      .where(
        and(
          eq(schema.favorites.userId, DEFAULT_USER_ID),
          eq(schema.favorites.animeId, animeId)
        )
      );

    return NextResponse.json({
      success: true,
      animeId,
      isFavorite: false,
      message: `Anime ${animeId} berhasil dihapus dari favorit`,
    });
  } catch (error: any) {
    console.error("DELETE /api/anime/[id]/favorite error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus dari favorit" },
      { status: 500 }
    );
  }
}
