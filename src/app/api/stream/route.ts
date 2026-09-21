import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import {
  streamLocalFile,
  streamDriveFile,
} from "@/services/streamingService";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    await seedDatabase();
    const { searchParams } = new URL(req.url);
    const rangeHeader = req.headers.get("range");

    const episodeId = searchParams.get("episodeId");
    const type = searchParams.get("type"); // "local" | "drive" | "link"
    const file = searchParams.get("file"); // Local file path
    const driveId = searchParams.get("id"); // Drive file ID
    const url = searchParams.get("url"); // Direct URL

    // If episodeId is provided, resolve from database
    if (episodeId) {
      const [ep] = await db
        .select()
        .from(schema.episodes)
        .where(eq(schema.episodes.id, episodeId))
        .limit(1);

      if (!ep) {
        return NextResponse.json(
          { success: false, error: "Episode tidak ditemukan" },
          { status: 404 }
        );
      }

      if (ep.sourceType === "local") {
        return streamLocalFile(ep.sourceUrl, rangeHeader);
      } else if (ep.sourceType === "drive") {
        // Fetch drive access token from connected sources if available
        const [source] = await db
          .select()
          .from(schema.connectedSources)
          .where(eq(schema.connectedSources.provider, "drive"))
          .limit(1);

        return streamDriveFile(
          ep.sourceUrl,
          source?.accessToken || null,
          rangeHeader
        );
      } else {
        // External link stream
        return Response.redirect(ep.sourceUrl, 302);
      }
    }

    // Direct streaming by type
    if (type === "local" && file) {
      return streamLocalFile(file, rangeHeader);
    }

    if (type === "drive" && driveId) {
      const [source] = await db
        .select()
        .from(schema.connectedSources)
        .where(eq(schema.connectedSources.provider, "drive"))
        .limit(1);

      return streamDriveFile(
        driveId,
        source?.accessToken || null,
        rangeHeader
      );
    }

    if (type === "link" && url) {
      return Response.redirect(url, 302);
    }

    return NextResponse.json(
      {
        success: false,
        error:
          "Parameter tidak valid. Sertakan episodeId atau kombinasi type dan file/id/url",
      },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("GET /api/stream error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Gagal melakukan streaming" },
      { status: 500 }
    );
  }
}
