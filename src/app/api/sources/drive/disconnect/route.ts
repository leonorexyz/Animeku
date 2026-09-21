import { NextResponse } from "next/server";
import { executeDriveDisconnect } from "@/lib/driveDisconnect";

export const dynamic = "force-dynamic";

/**
 * POST /api/sources/drive/disconnect
 * Memutus sambungan Google Drive (mendukung opsi removeCatalog)
 */
export async function POST(req: Request) {
  try {
    const result = await executeDriveDisconnect(req);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("POST /api/sources/drive/disconnect error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal memutus sambungan Google Drive",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sources/drive/disconnect
 * Memutus sambungan Google Drive
 */
export async function DELETE(req: Request) {
  try {
    const result = await executeDriveDisconnect(req);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("DELETE /api/sources/drive/disconnect error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal memutus sambungan Google Drive",
      },
      { status: 500 }
    );
  }
}
