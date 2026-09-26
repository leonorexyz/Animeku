import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";
import { MetadataFetcher } from "./metadata_fetcher";

if (fs.existsSync(".env.local")) {
  const content = fs.readFileSync(".env.local", "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

const dbUrl = process.env.TURSO_DATABASE_URL || "file:animeku.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

console.log("Connecting to Database:", dbUrl);
const client = createClient({
  url: dbUrl,
  authToken: authToken,
});

const BASE_DIR = "D:\\Anime\\Series";
const VALID_EXTS = [".mp4", ".mkv", ".avi", ".flv", ".webm", ".ts", ".mov"];
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

export interface ParsedEpisode {
  id: string;
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  filename: string;
  relativePath: string;
  fullPath: string;
  size: number;
  quality: string;
  thumbnailUrl: string;
  synopsis: string;
}

export interface SeasonInfo {
  seasonNumber: number;
  title: string;
  folderName: string;
  totalEpisodes: number;
}

export interface ParsedAnime {
  id: string;
  title: string;
  folderName: string;
  synopsis: string;
  year: number;
  totalEpisodes: number;
  totalSeasons: number;
  seasons: SeasonInfo[];
  genres: string;
  genresList: string[];
  posterUrl: string;
  coverUrl: string;
  rating: string;
  isFeatured: boolean;
  episodes: ParsedEpisode[];
}

const KNOWN_OVERRIDES = [
  { pattern: /^LoveLive!/i, base: "LoveLive!", getSeason: (s: string) => (s.includes("2") ? 2 : 1) },
  { pattern: /^Ah My Goddess/i, base: "Ah My Goddess", getSeason: (s: string) => (s.includes("2") ? 2 : 1) },
  { pattern: /^Amagami SS/i, base: "Amagami SS", getSeason: (s: string) => (s.includes("+") ? 2 : 1) },
  { pattern: /^Boku Wa Tomodachi/i, base: "Boku Wa Tomodachi", getSeason: (s: string) => (s.includes("2") ? 2 : 1) },
  { pattern: /^Chuunibyou Demo Koi Ga Shitai/i, base: "Chuunibyou Demo Koi Ga Shitai!", getSeason: (s: string) => (/ren/i.test(s) ? 2 : 1) },
  { pattern: /^Clannad/i, base: "Clannad", getSeason: (s: string) => (/after story/i.test(s) ? 2 : 1) },
  { pattern: /^Code Geass/i, base: "Code Geass - Lelouch of the Rebellion", getSeason: (s: string) => (/r2/i.test(s) ? 2 : 1) },
  { pattern: /^Date A Live/i, base: "Date A Live", getSeason: (s: string) => (s.includes("2") ? 2 : 1) },
  { pattern: /^Kono Subarashii Sekai/i, base: "Kono Subarashii Sekai ni Shukufuku wo !", getSeason: (s: string) => (s.includes("2") ? 2 : 1) },
  { pattern: /^Magi/i, base: "Magi", getSeason: (s: string) => (/kingdom of magic/i.test(s) ? 2 : 1) },
  { pattern: /^Noragami/i, base: "Noragami", getSeason: (s: string) => (/aragoto/i.test(s) ? 2 : 1) },
  { pattern: /^Rosario Vampire/i, base: "Rosario Vampire", getSeason: (s: string) => (s.includes("2") ? 2 : 1) },
  { pattern: /^Rozen Maiden/i, base: "Rozen Maiden", getSeason: (s: string) => (/2013/i.test(s) ? 2 : 1) },
  { pattern: /^Sekirei/i, base: "Sekirei", getSeason: (s: string) => (s.includes("2") ? 2 : 1) },
  { pattern: /^Sora no Otoshimono/i, base: "Sora no Otoshimono", getSeason: (s: string) => (/forte/i.test(s) ? 2 : 1) },
  { pattern: /^Sword Art Online/i, base: "Sword Art Online", getSeason: (s: string) => (s.includes("2") ? 2 : 1) },
  { pattern: /^To Aru Kagaku no Railgun/i, base: "To Aru Kagaku no Railgun", getSeason: (s: string) => (/\bs\b| s$/i.test(s) ? 2 : 1) },
  { pattern: /^To LOVE-Ru/i, base: "To LOVE-Ru", getSeason: (s: string) => (/darkness/i.test(s) ? 3 : /motto/i.test(s) ? 2 : 1) },
  { pattern: /^Zero no Tsukaima/i, base: "Zero no Tsukaima", getSeason: (s: string) => (/\bf\b| f$/i.test(s) ? 2 : 1) },
];

function resolveFranchise(folderName: string): {
  baseTitle: string;
  seasonNumber: number;
  seasonTitle: string;
} {
  for (const item of KNOWN_OVERRIDES) {
    if (item.pattern.test(folderName)) {
      const sNum = item.getSeason(folderName);
      return {
        baseTitle: item.base,
        seasonNumber: sNum,
        seasonTitle: `Musim ${sNum}`,
      };
    }
  }

  // Generic regex for "Title 2", "Title Season 2", "Title II"
  const m = folderName.match(/^(.*?)(?:\s+(?:season|s|part|babak)?\s*(\d{1,2})|\s+(II|III|IV|V))$/i);
  if (m) {
    let num = 1;
    if (m[2]) num = parseInt(m[2], 10);
    else if (m[3] && /ii$/i.test(m[3])) num = 2;
    else if (m[3] && /iii$/i.test(m[3])) num = 3;
    return {
      baseTitle: m[1].trim(),
      seasonNumber: num,
      seasonTitle: `Musim ${num}`,
    };
  }

  return {
    baseTitle: folderName.trim(),
    seasonNumber: 1,
    seasonTitle: "Musim 1",
  };
}

const FEATURED_TITLES = [
  "One Punch Man",
  "Sword Art Online",
  "Code Geass - Lelouch of the Rebellion",
  "Angel Beats",
  "Clannad",
  "No Game No Life",
  "Noragami",
  "ToraDora !",
  "Shingeki no Kyojin",
  "Hyouka",
  "Bakemonogatari",
  "Tokyo Ghoul",
  "LoveLive!",
];

async function main() {
  console.log("=== Memulai Sinkronisasi & Pengindeksan Metadata Akurat D:\\Anime\\Series ===");
  if (!fs.existsSync(BASE_DIR)) {
    throw new Error(`Direktori ${BASE_DIR} tidak ditemukan!`);
  }

  const metadataFetcher = new MetadataFetcher();

  const rawDirs = fs.readdirSync(BASE_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  console.log(`Ditemukan ${rawDirs.length} folder di direktori master ${BASE_DIR}`);

  // Expand container directories like "Spring 2017" into their individual anime subfolders
  const dirs: { name: string; folderPath: string }[] = [];
  for (const d of rawDirs) {
    const full = path.join(BASE_DIR, d.name);
    if (d.name === "Spring 2017") {
      const subDirs = fs.readdirSync(full, { withFileTypes: true }).filter((sd) => sd.isDirectory());
      for (const sd of subDirs) {
        dirs.push({ name: sd.name, folderPath: path.join(full, sd.name) });
      }
    } else {
      dirs.push({ name: d.name, folderPath: full });
    }
  }

  console.log(`Total target folder anime aktif setelah ekspansi kontainer: ${dirs.length}`);

  // 1. PENGELOMPOKKAN FOLDER KE FRANCHISE / BASE ANIME
  interface RawFolderData {
    folderName: string;
    seasonNumber: number;
    seasonTitle: string;
    files: { filename: string; fullPath: string; size: number }[];
  }

  const groups = new Map<string, RawFolderData[]>();

  for (const item of dirs) {
    let files: { filename: string; fullPath: string; size: number }[] = [];

    const rootFiles = fs.readdirSync(item.folderPath, { withFileTypes: true });
    for (const f of rootFiles) {
      if (f.isFile() && VALID_EXTS.includes(path.extname(f.name).toLowerCase())) {
        const full = path.join(item.folderPath, f.name);
        try {
          const stat = fs.statSync(full);
          files.push({ filename: f.name, fullPath: full, size: stat.size });
        } catch (e) {}
      } else if (f.isDirectory()) {
        const subPath = path.join(item.folderPath, f.name);
        try {
          const subFiles = fs.readdirSync(subPath, { withFileTypes: true });
          for (const sf of subFiles) {
            if (sf.isFile() && VALID_EXTS.includes(path.extname(sf.name).toLowerCase())) {
              const full = path.join(subPath, sf.name);
              const stat = fs.statSync(full);
              files.push({ filename: `${f.name}/${sf.name}`, fullPath: full, size: stat.size });
            }
          }
        } catch (e) {}
      }
    }

    if (files.length === 0) continue;
    files.sort((a, b) => collator.compare(a.filename, b.filename));

    const info = resolveFranchise(item.name);
    if (!groups.has(info.baseTitle)) {
      groups.set(info.baseTitle, []);
    }
    groups.get(info.baseTitle)!.push({
      folderName: item.name,
      seasonNumber: info.seasonNumber,
      seasonTitle: info.seasonTitle,
      files,
    });
  }

  console.log(`Ditemukan ${groups.size} franchise anime unik.`);

  // 2. STRUKTURISASI DATA ANIME DAN EPISODE DENGAN METADATA RESMI
  const animeList: ParsedAnime[] = [];
  const seenSlugs = new Set<string>();
  let groupIndex = 0;

  for (const [baseTitle, seasonsRaw] of groups.entries()) {
    groupIndex++;
    seasonsRaw.sort((a, b) => a.seasonNumber - b.seasonNumber);

    let slug = baseTitle
      .toLowerCase()
      .replace(/\+/g, "-plus")
      .replace(/!/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) slug = `anime-${groupIndex}`;
    if (seenSlugs.has(slug)) {
      slug = `${slug}-${groupIndex}`;
    }
    seenSlugs.add(slug);

    const isFeatured = FEATURED_TITLES.some(
      (ft) => baseTitle.toLowerCase() === ft.toLowerCase()
    );

    // Hitung episode mentah per musim
    const preliminarySeasonsInfo: SeasonInfo[] = seasonsRaw.map((s) => ({
      seasonNumber: s.seasonNumber,
      title: s.seasonTitle,
      folderName: s.folderName,
      totalEpisodes: s.files.length,
    }));

    console.log(`\n[${groupIndex}/${groups.size}] Memproses metadata "${baseTitle}" (${seasonsRaw.length} musim, ${seasonsRaw.reduce((sum, s) => sum + s.files.length, 0)} ep)...`);

    // Ambil metadata resmi (AniList + Kitsu) beserta thumbnail episode asli
    let metadata;
    try {
      metadata = await metadataFetcher.fetchAnimeMetadata(baseTitle, preliminarySeasonsInfo);
    } catch (err: any) {
      console.warn(`Peringatan: Gagal mengambil metadata daring untuk ${baseTitle}:`, err.message);
      metadata = null;
    }

    const officialTitle = metadata?.officialTitle || baseTitle;
    const synopsis = metadata?.synopsis || `Serial anime ${baseTitle} dari koleksi lokal penyimpanan Anda. Total ${seasonsRaw.reduce((sum, s) => sum + s.files.length, 0)} episode siap ditonton dengan kualitas jernih.`;
    const posterUrl = metadata?.posterUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600";
    const coverUrl = metadata?.coverUrl || posterUrl;
    const rating = metadata?.rating || "8.4";
    const year = metadata?.year || 2015;
    const genresList = metadata?.genres && metadata.genres.length > 0 ? metadata.genres : ["Serial Anime", "Koleksi Lokal"];
    const genres = genresList.join(", ");

    const allEpisodes: ParsedEpisode[] = [];
    const seasonsInfo: SeasonInfo[] = [];

    for (const season of seasonsRaw) {
      const seenEpNums = new Set<number>();
      const cachedEps = metadata?.seasonEpisodes?.[season.seasonNumber] || [];

      const seasonEpisodes: ParsedEpisode[] = season.files.map((f, idx) => {
        const ext = path.extname(f.filename).toLowerCase();
        const baseName = path.basename(f.filename, ext);

        let epNum = idx + 1;
        const numMatch = baseName.match(/(?:ep|episode|e)?\s*0*(\d{1,4})/i);
        if (numMatch && numMatch[1]) {
          const parsed = parseInt(numMatch[1], 10);
          if (parsed > 0 && parsed <= 2000) {
            epNum = parsed;
          }
        }

        while (seenEpNums.has(epNum)) {
          epNum++;
        }
        seenEpNums.add(epNum);

        const epId = seasonsRaw.length > 1
          ? `ep-${slug}-s${season.seasonNumber}-${epNum}`
          : `ep-${slug}-${epNum}`;

        const foundCached = cachedEps.find((ce) => ce.episodeNumber === epNum);

        const epTitle = foundCached?.title || `Episode ${epNum}`;
        const epThumb = foundCached?.thumbnailUrl || coverUrl;
        const epSynopsis = foundCached?.synopsis || `Episode ${epNum} (Musim ${season.seasonNumber}) dari serial ${officialTitle}. Berkas: ${f.filename}`;

        return {
          id: epId,
          title: epTitle,
          episodeNumber: epNum,
          seasonNumber: season.seasonNumber,
          filename: f.filename,
          relativePath: f.filename,
          fullPath: f.fullPath.replace(/\\/g, "/"),
          size: f.size,
          quality: ext === ".mkv" || f.size > 200 * 1024 * 1024 ? "1080p" : "720p",
          thumbnailUrl: epThumb,
          synopsis: epSynopsis,
        };
      });

      seasonsInfo.push({
        seasonNumber: season.seasonNumber,
        title: season.seasonTitle,
        folderName: season.folderName,
        totalEpisodes: seasonEpisodes.length,
      });

      allEpisodes.push(...seasonEpisodes);
    }

    animeList.push({
      id: slug,
      title: officialTitle,
      folderName: seasonsRaw[0].folderName,
      synopsis,
      year,
      totalEpisodes: allEpisodes.length,
      totalSeasons: seasonsInfo.length,
      seasons: seasonsInfo,
      genres,
      genresList,
      posterUrl,
      coverUrl,
      rating,
      isFeatured,
      episodes: allEpisodes,
    });
  }

  // Urutkan anime berdasarkan abjad judul
  animeList.sort((a, b) => collator.compare(a.title, b.title));

  console.log(`\nMenyimpan ${animeList.length} anime ke src/data/parsedAnime.json...`);
  fs.writeFileSync(
    path.join(process.cwd(), "src", "data", "parsedAnime.json"),
    JSON.stringify(animeList, null, 2),
    "utf-8"
  );

  // 3. UPDATE DATABASE TURSO (Membersihkan anime lama & memasukkan struktur metadata akurat)
  console.log(`\n=== Memperbarui Database Turso (${animeList.length} Anime Unik) ===`);
  const now = new Date().toISOString();

  try {
    console.log("Menghapus entri episode dan relasi lama di Turso...");
    await client.execute("DELETE FROM episode_sources");
    await client.execute("DELETE FROM episodes");
    await client.execute("DELETE FROM anime_categories");
    await client.execute("DELETE FROM anime");
    console.log("✓ Database dibersihkan dengan sukses!");
  } catch (err: any) {
    console.warn("Gagal membersihkan tabel:", err.message);
  }

  let insertedCount = 0;
  let failedCount = 0;

  for (let idx = 0; idx < animeList.length; idx++) {
    const a = animeList[idx];
    try {
      await client.execute({
        sql: `INSERT INTO anime (id, user_id, title, synopsis, year, poster_url, cover_url, status, is_featured, rating, total_episodes, total_seasons, seasons_json, genres, source_type, source_path, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          a.id,
          "user-default",
          a.title,
          a.synopsis,
          a.year,
          a.posterUrl,
          a.coverUrl,
          "tamat",
          a.isFeatured ? 1 : 0,
          a.rating,
          a.totalEpisodes,
          a.totalSeasons,
          JSON.stringify(a.seasons),
          a.genres,
          "local",
          `D:/Anime/Series/${a.folderName}`,
          now,
          now,
        ],
      });

      await client.execute({
        sql: `INSERT OR IGNORE INTO anime_categories (id, anime_id, category_id) VALUES (?, ?, ?)`,
        args: [`ac-${a.id}-all-series`, a.id, "all-series"],
      });

      let specificCat = "all-series";
      if (a.genres.includes("Aksi")) specificCat = "action";
      else if (a.genres.includes("Romansa")) specificCat = "romance";
      else if (a.genres.includes("Komedi")) specificCat = "comedy";
      else if (a.genres.includes("Fantasi")) specificCat = "fantasy";

      if (specificCat !== "all-series") {
        await client.execute({
          sql: `INSERT OR IGNORE INTO anime_categories (id, anime_id, category_id) VALUES (?, ?, ?)`,
          args: [`ac-${a.id}-${specificCat}`, a.id, specificCat],
        });
      }

      // Masukkan episode dengan screenshot thumbnail dan judul asli
      for (const ep of a.episodes) {
        const sourceUrl = `file:///${ep.fullPath}`;
        await client.execute({
          sql: `INSERT INTO episodes (id, anime_id, title, episode_number, season_number, duration_seconds, source_type, source_url, thumbnail_url, synopsis, file_size, video_quality, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            ep.id,
            a.id,
            ep.title,
            ep.episodeNumber,
            ep.seasonNumber,
            1440,
            "local",
            sourceUrl,
            ep.thumbnailUrl,
            ep.synopsis,
            ep.size,
            ep.quality,
            now,
          ],
        });

        await client.execute({
          sql: `INSERT INTO episode_sources (id, episode_id, anime_id, source_type, source_url, quality, label, file_size, local_path, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `src-${ep.id}-local`,
            ep.id,
            a.id,
            "local",
            sourceUrl,
            ep.quality,
            "Penyimpanan Lokal",
            ep.size,
            ep.fullPath,
            "ready",
            now,
          ],
        });
      }

      insertedCount++;
      if ((idx + 1) % 25 === 0 || idx === animeList.length - 1) {
        console.log(`Progress: ${idx + 1}/${animeList.length} anime tersimpan ke Turso...`);
      }
    } catch (err: any) {
      failedCount++;
      console.error(`Gagal menyimpan anime ${a.title}:`, err.message);
    }
  }

  console.log(`\nHasil Turso: ${insertedCount} anime tersimpan, ${failedCount} gagal.`);

  // 4. GENERATE FILE src/data/mockAnime.ts
  console.log("\n=== Menulis src/data/mockAnime.ts Menggunakan Data Akurat ===");
  const featuredAnimes = animeList.filter((a) => a.isFeatured).slice(0, 6);
  const heroAnime = featuredAnimes[0] || animeList[0];

  const actionItems = animeList.filter((a) => a.genres.includes("Aksi")).slice(0, 15);
  const romanceItems = animeList.filter((a) => a.genres.includes("Romansa")).slice(0, 15);
  const comedyItems = animeList.filter((a) => a.genres.includes("Komedi")).slice(0, 15);
  const fantasyItems = animeList.filter((a) => a.genres.includes("Fantasi")).slice(0, 15);
  const allSeriesItems = animeList.slice(0, 20);

  const formatAnimeObj = (a: ParsedAnime) => ({
    id: a.id,
    title: a.title,
    synopsis: a.synopsis,
    year: a.year,
    posterUrl: a.posterUrl,
    coverUrl: a.coverUrl,
    status: "tamat" as const,
    isFeatured: a.isFeatured,
    rating: a.rating,
    genres: a.genresList,
    totalEpisodes: a.totalEpisodes,
    totalSeasons: a.totalSeasons,
    seasons: a.seasons,
  });

  const mockAnimeContent = `import { Anime, CategorySection } from "@/types/anime";

export const MOCK_FEATURED_ANIME: Anime = ${JSON.stringify(formatAnimeObj(heroAnime), null, 2)};

export const MOCK_FEATURED_ANIMES: Anime[] = ${JSON.stringify(featuredAnimes.map(formatAnimeObj), null, 2)};

export const MOCK_CONTINUE_WATCHING: Anime[] = ${JSON.stringify(
    featuredAnimes.slice(0, 4).map((a, idx) => ({
      ...formatAnimeObj(a),
      progress: {
        id: `prog-${a.id}`,
        animeId: a.id,
        animeTitle: a.title,
        animePoster: a.posterUrl,
        episodeId: `ep-${a.id}-s1-${idx + 1}`,
        episodeNumber: idx + 1,
        seasonNumber: 1,
        episodeTitle: a.episodes[idx]?.title || `Episode ${idx + 1}`,
        positionSeconds: 600,
        durationSeconds: 1440,
        isCompleted: false,
        lastWatchedAt: new Date().toISOString(),
      },
    })),
    null,
    2
  )};

export const MOCK_CATEGORIES: CategorySection[] = [
  {
    id: "all-series",
    name: "Koleksi Serial Anime Pilihan",
    type: "collection",
    sortOrder: 1,
    items: ${JSON.stringify(allSeriesItems.map(formatAnimeObj), null, 2)},
  },
  {
    id: "action",
    name: "Aksi & Petualangan Pilihan",
    type: "genre",
    sortOrder: 2,
    items: ${JSON.stringify(actionItems.map(formatAnimeObj), null, 2)},
  },
  {
    id: "romance",
    name: "Romansa & Drama Emosional",
    type: "genre",
    sortOrder: 3,
    items: ${JSON.stringify(romanceItems.map(formatAnimeObj), null, 2)},
  },
  {
    id: "comedy",
    name: "Komedi & Slice of Life",
    type: "genre",
    sortOrder: 4,
    items: ${JSON.stringify(comedyItems.map(formatAnimeObj), null, 2)},
  },
  {
    id: "fantasy",
    name: "Fantasi & Dunia Isekai",
    type: "genre",
    sortOrder: 5,
    items: ${JSON.stringify(fantasyItems.map(formatAnimeObj), null, 2)},
  },
];

export const MOCK_CATALOG_DATA: Anime[] = ${JSON.stringify(animeList.map(formatAnimeObj), null, 2)};
`;

  fs.writeFileSync(path.join(process.cwd(), "src", "data", "mockAnime.ts"), mockAnimeContent, "utf-8");
  console.log("✓ src/data/mockAnime.ts berhasil diperbarui!");

  // 5. GENERATE FILE src/data/mockEpisodes.ts
  console.log("\n=== Menulis src/data/mockEpisodes.ts Menggunakan Thumbnail & Judul Asli ===");
  const episodesRecord: Record<string, any[]> = {};
  for (const a of animeList) {
    episodesRecord[a.id] = a.episodes.map((ep) => ({
      id: ep.id,
      animeId: a.id,
      title: ep.title,
      episodeNumber: ep.episodeNumber,
      seasonNumber: ep.seasonNumber,
      durationSeconds: 1440,
      sourceType: "local",
      sourceUrl: `/api/stream?file=${encodeURIComponent(ep.fullPath)}`,
      thumbnailUrl: ep.thumbnailUrl,
      synopsis: ep.synopsis,
    }));
  }

  const defaultEp = {
    id: `ep-${heroAnime.id}-s1-1`,
    animeId: heroAnime.id,
    title: heroAnime.episodes[0]?.title || "Episode 1",
    episodeNumber: 1,
    seasonNumber: 1,
    durationSeconds: 1440,
    sourceType: "local",
    sourceUrl: `/api/stream?file=${encodeURIComponent(heroAnime.episodes[0]?.fullPath || "")}`,
    thumbnailUrl: heroAnime.episodes[0]?.thumbnailUrl || heroAnime.coverUrl,
    synopsis: heroAnime.episodes[0]?.synopsis || `Episode perdana dari ${heroAnime.title}`,
  };

  const mockEpisodesContent = `import { Episode } from "@/types/anime";

export interface ExtendedEpisode extends Episode {
  thumbnailUrl: string;
  synopsis: string;
}

export const DEFAULT_EPISODE: ExtendedEpisode = ${JSON.stringify(defaultEp, null, 2)};

export const MOCK_EPISODES: Record<string, ExtendedEpisode[]> = ${JSON.stringify(episodesRecord, null, 2)};
`;

  fs.writeFileSync(path.join(process.cwd(), "src", "data", "mockEpisodes.ts"), mockEpisodesContent, "utf-8");
  console.log("✓ src/data/mockEpisodes.ts berhasil diperbarui!");

  console.log("\n🎉 SELURUH PROSES RE-INDEX METADATA & THUMBNAIL SELESAI DENGAN SEMPURNA!");
}

main().catch(console.error);
