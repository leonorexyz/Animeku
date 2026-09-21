import { db } from "@/db";
import * as schema from "@/db/schema";
import { seedDatabase } from "@/db/seed";
import { NextResponse } from "next/server";
import { eq, asc, inArray, and } from "drizzle-orm";
import { MOCK_EPISODES } from "@/data/mockEpisodes";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: Request, { params }: RouteParams) {
  try {
    await seedDatabase();
    const { id: animeId } = await params;

    if (!animeId) {
      return NextResponse.json(
        { success: false, error: "animeId diperlukan" },
        { status: 400 }
      );
    }

    // 1. Fetch episodes from database
    const episodesList = await db
      .select()
      .from(schema.episodes)
      .where(eq(schema.episodes.animeId, animeId))
      .orderBy(asc(schema.episodes.episodeNumber));

    if (episodesList.length > 0) {
      const episodeIds = episodesList.map((e) => e.id);

      // Fetch watch progress for user-default on this anime
      const progressRows = await db
        .select()
        .from(schema.watchProgress)
        .where(
          and(
            eq(schema.watchProgress.userId, "user-default"),
            eq(schema.watchProgress.animeId, animeId)
          )
        );

      const progressByEpId = new Map<string, typeof schema.watchProgress.$inferSelect>();
      progressRows.forEach((p) => {
        progressByEpId.set(p.episodeId, p);
      });

      // Fetch sources for all episodes
      const sourceRows = await db
        .select()
        .from(schema.episodeSources)
        .where(inArray(schema.episodeSources.episodeId, episodeIds));

      const sourcesByEpId = new Map<string, (typeof schema.episodeSources.$inferSelect)[]>();
      sourceRows.forEach((s) => {
        if (!sourcesByEpId.has(s.episodeId)) {
          sourcesByEpId.set(s.episodeId, []);
        }
        sourcesByEpId.get(s.episodeId)!.push(s);
      });

      // Assemble episode with watch status and sources
      const episodesWithStatus = episodesList.map((ep) => {
        const prog = progressByEpId.get(ep.id);
        const position = prog ? prog.positionSeconds : 0;
        const duration = ep.durationSeconds || (prog ? prog.durationSeconds : 1440);
        const isCompleted = prog ? prog.isCompleted : false;

        let watchStatus: "unwatched" | "watching" | "completed" = "unwatched";
        if (isCompleted) {
          watchStatus = "completed";
        } else if (position > 0) {
          watchStatus = "watching";
        }

        const progressPercent =
          duration > 0 && position > 0
            ? Math.min(100, Math.round((position / duration) * 100))
            : isCompleted
            ? 100
            : 0;

        const extraSources = sourcesByEpId.get(ep.id) || [];
        const allSources = [
          {
            id: `src-${ep.id}-primary`,
            label: "Server Utama (HD)",
            quality: "1080p",
            sourceType: ep.sourceType,
            sourceUrl: ep.sourceUrl,
            isDefault: true,
          },
          ...extraSources.map((s) => ({
            id: s.id,
            label: s.label || "Server Alternatif",
            quality: s.quality || "720p",
            sourceType: s.sourceType,
            sourceUrl: s.sourceUrl,
            isDefault: false,
          })),
        ];

        return {
          id: ep.id,
          animeId: ep.animeId,
          title: ep.title,
          episodeNumber: ep.episodeNumber,
          durationSeconds: duration,
          sourceType: ep.sourceType,
          sourceUrl: ep.sourceUrl,
          thumbnailUrl: ep.thumbnailUrl,
          synopsis: ep.synopsis,
          createdAt: ep.createdAt,
          // Watch Status Fields
          watchStatus,
          isCompleted,
          positionSeconds: position,
          progressPercent,
          lastWatchedAt: prog?.lastWatchedAt || null,
          audioTrack: prog?.audioTrack || null,
          subtitleTrack: prog?.subtitleTrack || null,
          // Multi-source streams
          sources: allSources,
          hasDriveSource: allSources.some((s) => s.sourceType === "drive"),
          hasLocalSource: allSources.some((s) => s.sourceType === "local"),
          hasLinkSource: allSources.some((s) => s.sourceType === "link"),
        };
      });

      return NextResponse.json({
        success: true,
        count: episodesWithStatus.length,
        data: episodesWithStatus,
      });
    }

    // 2. Fallback to mock episodes if not in DB
    const mockList = MOCK_EPISODES[animeId] || [];
    const formattedMock = mockList.map((ep) => ({
      ...ep,
      watchStatus: "unwatched" as const,
      isCompleted: false,
      positionSeconds: 0,
      progressPercent: 0,
      lastWatchedAt: null,
      sources: [
        {
          id: `src-${ep.id}-primary`,
          label: "Server Utama (HD)",
          quality: "1080p",
          sourceType: ep.sourceType,
          sourceUrl: ep.sourceUrl,
          isDefault: true,
        },
      ],
      hasDriveSource: ep.sourceType === "drive",
      hasLocalSource: ep.sourceType === "local",
      hasLinkSource: ep.sourceType === "link",
    }));

    return NextResponse.json({
      success: true,
      count: formattedMock.length,
      data: formattedMock,
    });
  } catch (error: any) {
    console.error("GET /api/anime/[id]/episodes error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal memuat daftar episode dengan status",
      },
      { status: 500 }
    );
  }
}
