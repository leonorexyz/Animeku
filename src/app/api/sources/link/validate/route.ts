import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Memvalidasi apakah URL memiliki format dan skema HTTP/HTTPS yang benar
 */
function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Deteksi format video berdasarkan ekstensi atau Content-Type
 */
function detectStreamFormat(url: string, contentType: string | null): {
  format: string;
  isHls: boolean;
  isDash: boolean;
} {
  const cleanUrl = url.split("?")[0].toLowerCase();
  const cType = (contentType || "").toLowerCase();

  if (cleanUrl.endsWith(".m3u8") || cType.includes("mpegurl") || cType.includes("x-mpegurl")) {
    return { format: "HLS (.m3u8)", isHls: true, isDash: false };
  }
  if (cleanUrl.endsWith(".mpd") || cType.includes("dash+xml")) {
    return { format: "DASH (.mpd)", isHls: false, isDash: true };
  }
  if (cleanUrl.endsWith(".mp4") || cType.includes("video/mp4")) {
    return { format: "MP4 Video", isHls: false, isDash: false };
  }
  if (cleanUrl.endsWith(".webm") || cType.includes("video/webm")) {
    return { format: "WebM Video", isHls: false, isDash: false };
  }
  if (cleanUrl.endsWith(".mkv") || cType.includes("video/x-matroska")) {
    return { format: "MKV Video", isHls: false, isDash: false };
  }

  return { format: "Direct Stream", isHls: false, isDash: false };
}

/**
 * POST /api/sources/link/validate
 * Memvalidasi tautan streaming video melalui pengecekan format dan HTTP probe
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, valid: false, error: "URL streaming wajib disertakan" },
        { status: 400 }
      );
    }

    const trimmedUrl = url.trim();

    if (!isValidUrl(trimmedUrl)) {
      return NextResponse.json({
        success: true,
        valid: false,
        error: "Format URL tidak valid. Harap gunakan tautan dengan protokol http:// atau https://",
      });
    }

    // Ekstrak informasi dasar dari nama berkas / path URL
    const urlObj = new URL(trimmedUrl);
    const pathname = urlObj.pathname;
    const initialFormat = detectStreamFormat(trimmedUrl, null);

    // Lakukan HTTP Probe (HEAD request dengan fallback ke GET range=0-1)
    let contentType: string | null = null;
    let contentLength: number = 0;
    let supportsRange: boolean = false;
    let httpStatus: number = 0;
    let reachable: boolean = false;
    let probeWarning: string | null = null;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 detik batas timeout

      // Pertama coba metode HEAD
      let response = await fetch(trimmedUrl, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "AnimekuStreamValidator/1.0",
        },
      }).catch(() => null);

      // Jika HEAD ditolak (misal 405 Method Not Allowed), coba GET dengan byte range kecil
      if (!response || !response.ok) {
        response = await fetch(trimmedUrl, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "AnimekuStreamValidator/1.0",
            Range: "bytes=0-1024",
          },
        }).catch(() => null);
      }

      clearTimeout(timeoutId);

      if (response) {
        httpStatus = response.status;
        reachable = response.ok || response.status === 206 || response.status === 302 || response.status === 301;
        contentType = response.headers.get("content-type");
        const lengthHeader = response.headers.get("content-length");
        if (lengthHeader) {
          contentLength = parseInt(lengthHeader, 10) || 0;
        }
        supportsRange =
          response.headers.get("accept-ranges") === "bytes" ||
          Boolean(response.headers.get("content-range"));
      } else {
        probeWarning = "Server sumber tidak merespon probe awal, namun tautan tetap dapat disimpan.";
      }
    } catch (probeError: any) {
      probeWarning =
        "Server sumber membatasi probe langsung (CORS/firewall), tautan tetap diterima bila dapat diputar di browser.";
    }

    const formatInfo = detectStreamFormat(trimmedUrl, contentType);

    return NextResponse.json({
      success: true,
      valid: true,
      url: trimmedUrl,
      host: urlObj.hostname,
      pathname,
      format: formatInfo.format,
      isHls: formatInfo.isHls,
      isDash: formatInfo.isDash,
      contentType: contentType || "video/mp4 (perkiraan)",
      contentLength,
      sizeFormatted: contentLength > 0 ? formatBytes(contentLength) : "Streaming Stream",
      supportsRange,
      httpStatus,
      reachable,
      warning: probeWarning,
    });
  } catch (error: any) {
    console.error("POST /api/sources/link/validate error:", error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: error?.message || "Terjadi kesalahan saat memvalidasi URL streaming",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/sources/link/validate?url=...
 * Mendukung validasi via query parameter GET
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  return POST(
    new Request(req.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    })
  );
}
