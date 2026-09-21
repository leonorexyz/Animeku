import fs from "fs";
import path from "path";
import { Readable } from "stream";

export interface StreamRange {
  start: number;
  end: number;
  chunkSize: number;
  totalSize: number;
}

/**
 * Parse HTTP Range header (e.g. "bytes=0-1024" or "bytes=1024-")
 */
export function parseRange(
  rangeHeader: string | null | undefined,
  totalSize: number
): StreamRange {
  if (!rangeHeader || !rangeHeader.startsWith("bytes=")) {
    return {
      start: 0,
      end: Math.min(totalSize - 1, 1024 * 1024 * 2), // 2MB default chunk
      chunkSize: Math.min(totalSize, 1024 * 1024 * 2),
      totalSize,
    };
  }

  const parts = rangeHeader.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10) || 0;
  const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

  const boundedStart = Math.max(0, Math.min(start, totalSize - 1));
  const boundedEnd = Math.max(boundedStart, Math.min(end, totalSize - 1));
  const chunkSize = boundedEnd - boundedStart + 1;

  return {
    start: boundedStart,
    end: boundedEnd,
    chunkSize,
    totalSize,
  };
}

/**
 * Stream local video file with HTTP 206 Partial Content support
 */
export function streamLocalFile(
  filePath: string,
  rangeHeader?: string | null
): Response {
  // Prevent path traversal attacks
  const safePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  if (!fs.existsSync(safePath)) {
    return new Response(
      JSON.stringify({ error: "Berkas video lokal tidak ditemukan" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const stat = fs.statSync(safePath);
  const totalSize = stat.size;
  const range = parseRange(rangeHeader, totalSize);

  const fileStream = fs.createReadStream(safePath, {
    start: range.start,
    end: range.end,
  });

  // Convert Node readable stream to Web API ReadableStream
  const webStream = Readable.toWeb(fileStream) as ReadableStream;

  const ext = path.extname(safePath).toLowerCase();
  const contentType =
    ext === ".mkv"
      ? "video/x-matroska"
      : ext === ".webm"
      ? "video/webm"
      : "video/mp4";

  return new Response(webStream, {
    status: 206,
    headers: {
      "Content-Range": `bytes ${range.start}-${range.end}/${totalSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": range.chunkSize.toString(),
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

/**
 * Stream file from Google Drive via Google Drive API
 */
export async function streamDriveFile(
  driveFileId: string,
  accessToken?: string | null,
  rangeHeader?: string | null
): Promise<Response> {
  const url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
    driveFileId
  )}?alt=media`;

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  if (rangeHeader) {
    headers["Range"] = rangeHeader;
  }

  try {
    const driveRes = await fetch(url, {
      method: "GET",
      headers,
    });

    if (!driveRes.ok) {
      // Fallback: public drive download link
      const publicUrl = `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
        driveFileId
      )}`;
      return Response.redirect(publicUrl, 302);
    }

    const responseHeaders = new Headers();
    responseHeaders.set(
      "Content-Type",
      driveRes.headers.get("content-type") || "video/mp4"
    );
    if (driveRes.headers.get("content-length")) {
      responseHeaders.set(
        "Content-Length",
        driveRes.headers.get("content-length")!
      );
    }
    if (driveRes.headers.get("content-range")) {
      responseHeaders.set(
        "Content-Range",
        driveRes.headers.get("content-range")!
      );
    }
    responseHeaders.set("Accept-Ranges", "bytes");

    return new Response(driveRes.body, {
      status: driveRes.status,
      headers: responseHeaders,
    });
  } catch (err: any) {
    console.error("Error streaming Google Drive file:", err);
    return new Response(
      JSON.stringify({ error: "Gagal menghubungkan stream Google Drive" }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }
}
