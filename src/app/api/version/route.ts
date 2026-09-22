import { NextResponse } from "next/server";
import packageJson from "@/../package.json";

export const dynamic = "force-dynamic";

/**
 * GET /api/version
 * Mengembalikan informasi versi aplikasi, rilis, arsitektur, dan fitur aktif
 */
export async function GET() {
  try {
    const version = packageJson.version || "1.0.0";
    const appName = "Animeku Player";
    const releaseName = "Netflix Edition (Personal Streaming)";

    const versionInfo = {
      success: true,
      app: {
        name: appName,
        version: version.startsWith("0.") ? "1.0.0" : version,
        packageVersion: version,
        releaseName,
        buildDate: "2026-09-22",
        channel: "stable",
      },
      features: {
        videoPlayer: {
          hotkeys: true,
          skipIntro: true,
          autoNext: true,
          resumePlayback: true,
          subtitles: ["id", "en"],
          qualities: ["1080p", "720p", "480p", "360p", "auto"],
        },
        sources: {
          googleDrive: true,
          localStorage: true,
          directLinks: true,
        },
        ui: {
          netflixLayout: true,
          themes: ["netflix", "dark", "oled"],
          customCardSizes: ["small", "medium", "large"],
          sortableCategories: true,
          responsiveMobile: true,
        },
      },
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(versionInfo);
  } catch (error: any) {
    console.error("GET /api/version error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal mengambil informasi versi aplikasi",
      },
      { status: 500 }
    );
  }
}
