import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/sources/drive/folders/[id]
 * Mengambil detail berkas video dalam folder Google Drive tertentu
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const targetUrl = new URL("/api/sources/drive/folders", url.origin);
    targetUrl.searchParams.set("folderId", id);

    // Forward request ke rute utama penelusuran folder
    const res = await fetch(targetUrl.toString(), {
      headers: req.headers,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal memproses folder Drive" },
      { status: 500 }
    );
  }
}
