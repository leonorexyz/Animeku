import fs from "fs";
import path from "path";
import { createClient } from "@libsql/client";

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
  episodeNumber: number;
  filename: string;
  relativePath: string;
  fullPath: string;
  size: number;
  quality: string;
}

export interface ParsedAnime {
  id: string;
  title: string;
  folderName: string;
  synopsis: string;
  year: number;
  totalEpisodes: number;
  genres: string;
  genresList: string[];
  posterUrl: string;
  coverUrl: string;
  rating: string;
  isFeatured: boolean;
  episodes: ParsedEpisode[];
}

const POSTERS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1569701813229-33284b643e3c?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&auto=format&fit=crop&q=80"
];

const COVERS = [
  "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1563089145-599997674d42?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1600&auto=format&fit=crop&q=80"
];

function getGenre(title: string): string[] {
  const t = title.toLowerCase();
  if (t.includes("punch") || t.includes("geass") || t.includes("fate") || t.includes("shingeki") || t.includes("sword art") || t.includes("tokyo ghoul") || t.includes("black bullet") || t.includes("exorcist") || t.includes("strike") || t.includes("magi")) {
    return ["Aksi", "Petualangan", "Shounen"];
  }
  if (t.includes("clannad") || t.includes("anohana") || t.includes("golden time") || t.includes("toradora") || t.includes("sakurasou") || t.includes("amagami") || t.includes("tears") || t.includes("shoujo") || t.includes("natsu") || t.includes("plastic")) {
    return ["Romansa", "Drama", "Emosional"];
  }
  if (t.includes("nichijou") || t.includes("barakamon") || t.includes("umaru") || t.includes("biyori") || t.includes("baka") || t.includes("d-frag") || t.includes("mitsudomoe") || t.includes("yakuindomo")) {
    return ["Komedi", "Slice of Life", "Sekolah"];
  }
  if (t.includes("suba") || t.includes("game no life") || t.includes("horizon") || t.includes("mondaiji") || t.includes("tsukaima") || t.includes("isekai")) {
    return ["Fantasi", "Isekai", "Petualangan"];
  }
  if (t.includes("another") || t.includes("durarara") || t.includes("angel beats") || t.includes("mirai nikki") || t.includes("monogatari") || t.includes("danganronpa") || t.includes("elfen") || t.includes("noragami")) {
    return ["Supernatural", "Misteri", "Psikologis"];
  }
  return ["Serial Anime", "Koleksi Lokal"];
}

function getRating(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash * 31 + title.charCodeAt(i)) % 100;
  }
  const ratingNum = 8.2 + (hash % 13) * 0.1;
  return ratingNum.toFixed(1);
}

function getYear(title: string): number {
  const t = title.toLowerCase();
  if (t.includes("2017") || t.includes("spring 2017")) return 2017;
  if (t.includes("2013")) return 2013;
  if (t.includes("punch") || t.includes("umaru") || t.includes("plastic")) return 2015;
  if (t.includes("game no life") || t.includes("barakamon") || t.includes("noragami")) return 2014;
  if (t.includes("clannad") || t.includes("geass")) return 2008;
  return 2012 + (title.length % 8);
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
  "Tokyo Ghoul"
];

async function main() {
  console.log("=== Memulai Pemindaian Folder D:\\Anime\\Series ===");
  if (!fs.existsSync(BASE_DIR)) {
    throw new Error(`Direktori ${BASE_DIR} tidak ditemukan!`);
  }

  const dirs = fs.readdirSync(BASE_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  console.log(`Ditemukan ${dirs.length} folder anime di ${BASE_DIR}`);

  const animeList: ParsedAnime[] = [];
  const seenSlugs = new Set<string>();

  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    const folderPath = path.join(BASE_DIR, dir.name);
    
    let files: { filename: string; fullPath: string; size: number }[] = [];

    const rootFiles = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const f of rootFiles) {
      if (f.isFile() && VALID_EXTS.includes(path.extname(f.name).toLowerCase())) {
        const full = path.join(folderPath, f.name);
        try {
          const stat = fs.statSync(full);
          files.push({ filename: f.name, fullPath: full, size: stat.size });
        } catch (e) {}
      } else if (f.isDirectory()) {
        const subPath = path.join(folderPath, f.name);
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

    // Natural sort: 1, 2, 3 ... 10, 11
    files.sort((a, b) => collator.compare(a.filename, b.filename));

    const seenEpNumbers = new Set<number>();
    const parsedEpisodes: ParsedEpisode[] = files.map((f, idx) => {
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

      while (seenEpNumbers.has(epNum)) {
        epNum++;
      }
      seenEpNumbers.add(epNum);

      return {
        episodeNumber: epNum,
        filename: f.filename,
        relativePath: f.filename,
        fullPath: f.fullPath.replace(/\\/g, "/"),
        size: f.size,
        quality: ext === ".mkv" || f.size > 200 * 1024 * 1024 ? "1080p" : "720p",
      };
    });

    const cleanTitle = dir.name.trim();
    let slug = cleanTitle
      .toLowerCase()
      .replace(/\+/g, "-plus")
      .replace(/!/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) slug = `anime-${i + 1}`;

    if (seenSlugs.has(slug)) {
      slug = `${slug}-s${i + 1}`;
    }
    seenSlugs.add(slug);
    const animeId = slug;

    const isFeatured = FEATURED_TITLES.some(
      (ft) => cleanTitle.toLowerCase() === ft.toLowerCase()
    );

    const poster = POSTERS[i % POSTERS.length];
    const cover = COVERS[i % COVERS.length];
    const genresList = getGenre(cleanTitle);
    const genres = genresList.join(", ");
    const rating = getRating(cleanTitle);
    const year = getYear(cleanTitle);

    animeList.push({
      id: animeId,
      title: cleanTitle,
      folderName: dir.name,
      synopsis: `Serial anime ${cleanTitle} dari koleksi lokal penyimpanan Anda. Total ${parsedEpisodes.length} episode siap ditonton dengan kualitas jernih.`,
      year,
      totalEpisodes: parsedEpisodes.length,
      genres,
      genresList,
      posterUrl: poster,
      coverUrl: cover,
      rating,
      isFeatured,
      episodes: parsedEpisodes,
    });
  }

  console.log(`\nBerhasil mem-parsing ${animeList.length} serial anime dengan total episode: ${animeList.reduce((acc, a) => acc + a.episodes.length, 0)}!`);

  // 1. HAPUS SEMUA DUMMY ANIME DARI TURSO DATABASE
  console.log("\n=== Menghapus Seluruh Anime Dummy di Database Turso ===");
  try {
    await client.execute("DELETE FROM watch_progress");
    await client.execute("DELETE FROM favorites");
    await client.execute("DELETE FROM episode_sources");
    await client.execute("DELETE FROM episodes");
    await client.execute("DELETE FROM anime_categories");
    await client.execute("DELETE FROM anime");
    console.log("✓ Berhasil membersihkan seluruh tabel anime lama dari database.");
  } catch (err: any) {
    console.error("Gagal saat membersihkan database:", err.message);
  }

  // 2. PASTIKAN KATEGORI KURASI BARU TERSEDIA
  console.log("\n=== Memperbarui Kategori Kurasi Baru ===");
  try {
    await client.execute("DELETE FROM categories");
    const categories = [
      { id: "all-series", name: "Semua Seri Anime Lokal", type: "collection", sortOrder: 1, colorTheme: "red" },
      { id: "action", name: "Aksi & Petualangan Pilihan", type: "genre", sortOrder: 2, colorTheme: "amber" },
      { id: "romance", name: "Romansa & Drama Pilihan", type: "genre", sortOrder: 3, colorTheme: "rose" },
      { id: "comedy", name: "Komedi & Slice of Life", type: "genre", sortOrder: 4, colorTheme: "purple" },
      { id: "fantasy", name: "Fantasi & Dunia Isekai", type: "genre", sortOrder: 5, colorTheme: "indigo" },
    ];

    const now = new Date().toISOString();
    for (const cat of categories) {
      await client.execute({
        sql: `INSERT INTO categories (id, user_id, name, type, description, color_theme, sort_order, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [cat.id, "user-default", cat.name, cat.type, `Koleksi ${cat.name}`, cat.colorTheme, cat.sortOrder, now, now],
      });
    }
    console.log("✓ Kategori kurasi baru terpasang di database.");
  } catch (err: any) {
    console.error("Gagal saat membuat kategori:", err.message);
  }

  // 3. MASUKKAN SELURUH ANIME HASIL PARSING KE DATABASE TURSO
  console.log(`\n=== Memasukkan ${animeList.length} Serial Anime Baru ke Database Turso ===`);
  const now = new Date().toISOString();

  let insertedCount = 0;
  let failedCount = 0;

  for (let idx = 0; idx < animeList.length; idx++) {
    const a = animeList[idx];
    try {
      await client.execute({
        sql: `INSERT OR REPLACE INTO anime (id, user_id, title, synopsis, year, poster_url, cover_url, status, is_featured, rating, total_episodes, genres, source_type, source_path, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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

      // Masukkan episode (maksimal 50 episode per series untuk efisiensi)
      const epsToInsert = a.episodes.slice(0, 50);
      for (const ep of epsToInsert) {
        const epId = `ep-${a.id}-${ep.episodeNumber}`;
        const sourceUrl = `file:///${ep.fullPath}`;
        await client.execute({
          sql: `INSERT OR REPLACE INTO episodes (id, anime_id, title, episode_number, duration_seconds, source_type, source_url, thumbnail_url, synopsis, file_size, video_quality, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            epId,
            a.id,
            `Episode ${ep.episodeNumber}`,
            ep.episodeNumber,
            1440,
            "local",
            sourceUrl,
            a.coverUrl,
            `Episode ${ep.episodeNumber} dari serial ${a.title}. Berkas: ${ep.filename}`,
            ep.size,
            ep.quality,
            now,
          ],
        });

        await client.execute({
          sql: `INSERT OR REPLACE INTO episode_sources (id, episode_id, anime_id, source_type, source_url, quality, label, file_size, local_path, status, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            `src-${epId}-local`,
            epId,
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
        console.log(`Progress: ${idx + 1}/${animeList.length} serial tersimpan ke Turso...`);
      }
    } catch (err: any) {
      failedCount++;
      console.error(`Gagal menyimpan anime ${a.title}:`, err.message);
    }
  }

  console.log(`\nHasil Turso: ${insertedCount} tersimpan, ${failedCount} gagal.`);

  // 4. GENERATE FILE src/data/mockAnime.ts DENGAN DATA PARSING REAL
  console.log("\n=== Menulis src/data/mockAnime.ts Menggunakan Data Real ===");
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
        episodeId: `ep-${a.id}-${idx + 1}`,
        episodeNumber: idx + 1,
        episodeTitle: `Episode ${idx + 1}`,
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

  // 5. UPDATE src/data/mockEpisodes.ts
  console.log("\n=== Menulis src/data/mockEpisodes.ts Menggunakan Data Real ===");
  const episodesRecord: Record<string, any[]> = {};
  for (const a of animeList) {
    episodesRecord[a.id] = a.episodes.slice(0, 30).map((ep) => ({
      id: `ep-${a.id}-${ep.episodeNumber}`,
      animeId: a.id,
      title: `Episode ${ep.episodeNumber}`,
      episodeNumber: ep.episodeNumber,
      durationSeconds: 1440,
      sourceType: "local",
      sourceUrl: `/api/stream?file=${encodeURIComponent(ep.fullPath)}`,
      thumbnailUrl: a.coverUrl,
      synopsis: `Episode ${ep.episodeNumber} dari serial ${a.title}. Berkas: ${ep.filename}`,
    }));
  }

  const defaultEp = {
    id: "default-ep-1",
    animeId: heroAnime.id,
    title: "Episode 1",
    episodeNumber: 1,
    durationSeconds: 1440,
    sourceType: "local",
    sourceUrl: `/api/stream?file=${encodeURIComponent(heroAnime.episodes[0]?.fullPath || "")}`,
    thumbnailUrl: heroAnime.coverUrl,
    synopsis: `Episode perdana dari ${heroAnime.title}`,
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

  console.log("\n🎉 SELURUH PROSES SELESAI DENGAN SEMPURNA!");
}

main().catch(console.error);
