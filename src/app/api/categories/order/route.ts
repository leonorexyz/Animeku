import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * GET /api/categories/order
 * Mengambil urutan rak kategori untuk beranda
 */
export async function GET() {
  try {
    await seedDatabase();

    const categoriesList = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        type: schema.categories.type,
        colorTheme: schema.categories.colorTheme,
        sortOrder: schema.categories.sortOrder,
        updatedAt: schema.categories.updatedAt,
      })
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder));

    return NextResponse.json({
      success: true,
      total: categoriesList.length,
      data: categoriesList,
    });
  } catch (error: any) {
    console.error("GET /api/categories/order error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal mengambil urutan kategori" },
      { status: 500 }
    );
  }
}

/**
 * Handler pembaruan urutan kategori
 */
async function handleUpdateOrder(req: Request) {
  try {
    await seedDatabase();
    const body = await req.json();

    const now = new Date().toISOString();
    let updates: { id: string; sortOrder: number }[] = [];

    // Kasus 1: Body adalah array langsung
    if (Array.isArray(body)) {
      if (typeof body[0] === "string") {
        updates = body.map((id: string, idx: number) => ({
          id,
          sortOrder: idx + 1,
        }));
      } else if (typeof body[0] === "object") {
        updates = body.map((item: any, idx: number) => ({
          id: item.id || item.categoryId,
          sortOrder: item.sortOrder !== undefined ? Number(item.sortOrder) : idx + 1,
        }));
      }
    }
    // Kasus 2: Body berisi categoryIds (array of string)
    else if (Array.isArray(body.categoryIds)) {
      updates = body.categoryIds.map((id: string, idx: number) => ({
        id,
        sortOrder: idx + 1,
      }));
    }
    // Kasus 3: Body berisi orders (array of objects)
    else if (Array.isArray(body.orders)) {
      updates = body.orders.map((item: any, idx: number) => ({
        id: item.id || item.categoryId,
        sortOrder: item.sortOrder !== undefined ? Number(item.sortOrder) : idx + 1,
      }));
    }
    // Kasus 4: Directional shift (up / down) untuk 1 kategori
    else if (body.id && (body.direction === "up" || body.direction === "down")) {
      const all = await db
        .select()
        .from(schema.categories)
        .orderBy(asc(schema.categories.sortOrder));

      const targetIdx = all.findIndex((c) => c.id === body.id);
      if (targetIdx !== -1) {
        const swapIdx = body.direction === "up" ? targetIdx - 1 : targetIdx + 1;
        if (swapIdx >= 0 && swapIdx < all.length) {
          const temp = all[targetIdx];
          all[targetIdx] = all[swapIdx];
          all[swapIdx] = temp;

          updates = all.map((c, idx) => ({
            id: c.id,
            sortOrder: idx + 1,
          }));
        }
      }
    }
    // Kasus 5: Single update { id, sortOrder }
    else if (body.id && body.sortOrder !== undefined) {
      updates = [{ id: body.id, sortOrder: Number(body.sortOrder) }];
    }

    if (updates.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Format data tidak valid. Sertakan array categoryIds, orders [{ id, sortOrder }], atau { id, direction: 'up'|'down' }",
        },
        { status: 400 }
      );
    }

    // Jalankan update sortOrder ke database
    for (const update of updates) {
      if (!update.id) continue;
      await db
        .update(schema.categories)
        .set({
          sortOrder: update.sortOrder,
          updatedAt: now,
        })
        .where(eq(schema.categories.id, update.id));
    }

    // Ambil daftar kategori terurut terbaru
    const updatedList = await db
      .select({
        id: schema.categories.id,
        name: schema.categories.name,
        type: schema.categories.type,
        sortOrder: schema.categories.sortOrder,
      })
      .from(schema.categories)
      .orderBy(asc(schema.categories.sortOrder));

    return NextResponse.json({
      success: true,
      message: "Urutan rak kategori beranda berhasil diperbarui",
      data: updatedList,
    });
  } catch (error: any) {
    console.error("Update /api/categories/order error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memperbarui urutan kategori" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  return handleUpdateOrder(req);
}

export async function POST(req: Request) {
  return handleUpdateOrder(req);
}

export async function PATCH(req: Request) {
  return handleUpdateOrder(req);
}
