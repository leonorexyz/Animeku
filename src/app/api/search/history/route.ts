import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, desc, and, sql } from "drizzle-orm";

const DEFAULT_USER_ID = "user-default";
const DEFAULT_TRENDING = [
  "Solo Leveling",
  "Frieren: Beyond Journey's End",
  "Jujutsu Kaisen",
  "Demon Slayer",
  "Attack on Titan",
  "One Piece",
  "Chainsaw Man",
  "Oshi no Ko",
];

export async function GET(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "15", 10)));

    // 1. Ambil riwayat pencarian pengguna
    const rawHistory = await db
      .select()
      .from(schema.searchHistory)
      .where(eq(schema.searchHistory.userId, DEFAULT_USER_ID))
      .orderBy(desc(schema.searchHistory.createdAt))
      .limit(50);

    // Deduplikasi kata kunci (ambil kemunculan terbaru)
    const seen = new Set<string>();
    const uniqueHistory: { id: string; keyword: string; createdAt: string }[] = [];
    const historyStrings: string[] = [];

    for (const item of rawHistory) {
      const lower = item.keyword.trim().toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueHistory.push({
          id: item.id,
          keyword: item.keyword.trim(),
          createdAt: item.createdAt,
        });
        historyStrings.push(item.keyword.trim());
      }
      if (uniqueHistory.length >= limit) break;
    }

    // 2. Ambil pencarian populer / trending
    const trendingRows = await db
      .select({
        keyword: schema.searchHistory.keyword,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(schema.searchHistory)
      .groupBy(schema.searchHistory.keyword)
      .orderBy(desc(sql`count(*)`))
      .limit(8);

    let trending = trendingRows.map((r) => r.keyword);
    if (trending.length < 4) {
      // Gabungkan dengan default trending bila database masih sedikit
      const trendSet = new Set(trending);
      for (const def of DEFAULT_TRENDING) {
        if (!trendSet.has(def)) {
          trendSet.add(def);
          trending.push(def);
        }
        if (trending.length >= 8) break;
      }
    }

    return NextResponse.json({
      success: true,
      history: historyStrings,
      items: uniqueHistory,
      trending,
    });
  } catch (error: any) {
    console.error("GET /api/search/history error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memuat riwayat pencarian" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json();
    const rawKeyword = body?.keyword;

    if (!rawKeyword || typeof rawKeyword !== "string" || rawKeyword.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Keyword minimal 2 karakter" },
        { status: 400 }
      );
    }

    const keyword = rawKeyword.trim();
    const now = new Date().toISOString();
    const id = `sh-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Hapus duplikat lama dengan keyword yang sama untuk pengguna ini agar bergerak ke urutan teratas
    await db
      .delete(schema.searchHistory)
      .where(
        and(
          eq(schema.searchHistory.userId, DEFAULT_USER_ID),
          eq(schema.searchHistory.keyword, keyword)
        )
      );

    // Masukkan entri baru
    await db.insert(schema.searchHistory).values({
      id,
      userId: DEFAULT_USER_ID,
      keyword,
      createdAt: now,
    });

    return NextResponse.json({
      success: true,
      message: "Kata kunci pencarian berhasil disimpan",
      item: { id, keyword, createdAt: now },
    });
  } catch (error: any) {
    console.error("POST /api/search/history error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menyimpan riwayat pencarian" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword");
    const id = searchParams.get("id");
    const action = searchParams.get("action");

    // Jika hapus spesifik berdasarkan id
    if (id) {
      await db
        .delete(schema.searchHistory)
        .where(
          and(
            eq(schema.searchHistory.userId, DEFAULT_USER_ID),
            eq(schema.searchHistory.id, id)
          )
        );
      return NextResponse.json({
        success: true,
        message: "Item riwayat berhasil dihapus",
      });
    }

    // Jika hapus spesifik berdasarkan kata kunci
    if (keyword) {
      await db
        .delete(schema.searchHistory)
        .where(
          and(
            eq(schema.searchHistory.userId, DEFAULT_USER_ID),
            eq(schema.searchHistory.keyword, keyword)
          )
        );
      return NextResponse.json({
        success: true,
        message: `Riwayat pencarian "${keyword}" berhasil dihapus`,
      });
    }

    // Jika aksi bersihkan semua atau tanpa filter
    await db
      .delete(schema.searchHistory)
      .where(eq(schema.searchHistory.userId, DEFAULT_USER_ID));

    return NextResponse.json({
      success: true,
      message: "Seluruh riwayat pencarian berhasil dibersihkan",
    });
  } catch (error: any) {
    console.error("DELETE /api/search/history error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal menghapus riwayat pencarian" },
      { status: 500 }
    );
  }
}
