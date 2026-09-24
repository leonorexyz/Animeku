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
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  filename: string;
  relativePath: string;
  fullPath: string;
  size: number;
  quality: string;
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

const KNOWN_OVERRIDES = [
  { pattern: /^LoveLive!/i, base: "LoveLive!", getSeason: (s: string) => (s.includes("2") ? 2 : 1), genres: ["Musik", "Slice of Life", "Sekolah", "Idola"] },
  { pattern: /^Ah My Goddess/i, base: "Ah My Goddess", getSeason: (s: string) => (s.includes("2") ? 2 : 1), genres: ["Romansa", "Komedi", "Supernatural"] },
  { pattern: /^Amagami SS/i, base: "Amagami SS", getSeason: (s: string) => (s.includes("+") ? 2 : 1), genres: ["Romansa", "Sekolah", "Drama"] },
  { pattern: /^Boku Wa Tomodachi/i, base: "Boku Wa Tomodachi", getSeason: (s: string) => (s.includes("2") ? 2 : 1), genres: ["Komedi", "Sekolah", "Harem"] },
  { pattern: /^Chuunibyou Demo Koi Ga Shitai/i, base: "Chuunibyou Demo Koi Ga Shitai!", getSeason: (s: string) => (/ren/i.test(s) ? 2 : 1), genres: ["Komedi", "Romansa", "Sekolah"] },
  { pattern: /^Clannad/i, base: "Clannad", getSeason: (s: string) => (/after story/i.test(s) ? 2 : 1), genres: ["Drama", "Romansa", "Emosional"] },
  { pattern: /^Code Geass/i, base: "Code Geass - Lelouch of the Rebellion", getSeason: (s: string) => (/r2/i.test(s) ? 2 : 1), genres: ["Aksi", "Mecha", "Psikologis"] },
  { pattern: /^Date A Live/i, base: "Date A Live", getSeason: (s: string) => (s.includes("2") ? 2 : 1), genres: ["Aksi", "Fantasi", "Harem"] },
  { pattern: /^Kono Subarashii Sekai/i, base: "Kono Subarashii Sekai ni Shukufuku wo !", getSeason: (s: string) => (s.includes("2") ? 2 : 1), genres: ["Komedi", "Isekai", "Fantasi"] },
  { pattern: /^Magi/i, base: "Magi", getSeason: (s: string) => (/kingdom of magic/i.test(s) ? 2 : 1), genres: ["Aksi", "Petualangan", "Fantasi"] },
  { pattern: /^Noragami/i, base: "Noragami", getSeason: (s: string) => (/aragoto/i.test(s) ? 2 : 1), genres: ["Aksi", "Supernatural", "Shounen"] },
  { pattern: /^Rosario Vampire/i, base: "Rosario Vampire", getSeason: (s: string) => (s.includes("2") ? 2 : 1), genres: ["Komedi", "Harem", "Supernatural"] },
  { pattern: /^Rozen Maiden/i, base: "Rozen Maiden", getSeason: (s: string) => (/2013/i.test(s) ? 2 : 1), genres: ["Aksi", "Misteri", "Supernatural"] },
  { pattern: /^Sekirei/i, base: "Sekirei", getSeason: (s: string) => (s.includes("2") ? 2 : 1), genres: ["Aksi", "Komedi", "Harem"] },
  { pattern: /^Sora no Otoshimono/i, base: "Sora no Otoshimono", getSeason: (s: string) => (/forte/i.test(s) ? 2 : 1), genres: ["Komedi", "Sci-Fi", "Harem"] },
  { pattern: /^Sword Art Online/i, base: "Sword Art Online", getSeason: (s: string) => (s.includes("2") ? 2 : 1), genres: ["Aksi", "Petualangan", "Game"] },
  { pattern: /^To Aru Kagaku no Railgun/i, base: "To Aru Kagaku no Railgun", getSeason: (s: string) => (/\bs\b| s$/i.test(s) ? 2 : 1), genres: ["Aksi", "Sci-Fi", "Supernatural"] },
  { pattern: /^To LOVE-Ru/i, base: "To LOVE-Ru", getSeason: (s: string) => (/darkness/i.test(s) ? 3 : /motto/i.test(s) ? 2 : 1), genres: ["Komedi", "Sci-Fi", "Harem"] },
  { pattern: /^Zero no Tsukaima/i, base: "Zero no Tsukaima", getSeason: (s: string) => (/\bf\b| f$/i.test(s) ? 2 : 1), genres: ["Aksi", "Fantasi", "Isekai"] },
];

function resolveFranchise(folderName: string): {
  baseTitle: string;
  seasonNumber: number;
  seasonTitle: string;
  genres: string[] | null;
} {
  for (const item of KNOWN_OVERRIDES) {
    if (item.pattern.test(folderName)) {
      const sNum = item.getSeason(folderName);
      return {
        baseTitle: item.base,
        seasonNumber: sNum,
        seasonTitle: `Musim ${sNum}`,
        genres: item.genres,
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
      genres: null,
    };
  }

  return {
    baseTitle: folderName.trim(),
    seasonNumber: 1,
    seasonTitle: "Musim 1",
    genres: null,
  };
}

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
  console.log("=== Memulai Sinkronisasi & Indeks Ulang Folder D:\\Anime\\Series ===");
  if (!fs.existsSync(BASE_DIR)) {
    throw new Error(`Direktori ${BASE_DIR} tidak ditemukan!`);
  }

  const dirs = fs.readdirSync(BASE_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  console.log(`Ditemukan ${dirs.length} folder anime di ${BASE_DIR}`);

  // 1. PENGELOMPOKKAN FOLDER KE FRANCHISE / BASE ANIME
  interface RawFolderData {
    folderName: string;
    seasonNumber: number;
    seasonTitle: string;
    genres: string[] | null;
    files: { filename: string; fullPath: string; size: number }[];
  }

  const groups = new Map<string, RawFolderData[]>();

  for (const dir of dirs) {
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
    files.sort((a, b) => collator.compare(a.filename, b.filename));

    const info = resolveFranchise(dir.name);
    if (!groups.has(info.baseTitle)) {
      groups.set(info.baseTitle, []);
    }
    groups.get(info.baseTitle)!.push({
      folderName: dir.name,
      seasonNumber: info.seasonNumber,
      seasonTitle: info.seasonTitle,
      genres: info.genres,
      files,
    });
  }

  console.log(`Ditemukan ${groups.size} franchise anime unik dari ${dirs.length} folder.`);

  // 2. STRUKTURISASI DATA ANIME DAN EPISODE MULTI-MUSIM
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
    const poster = POSTERS[(groupIndex - 1) % POSTERS.length];
    const cover = COVERS[(groupIndex - 1) % COVERS.length];

    const genresList = seasonsRaw[0].genres || getGenre(baseTitle);
    const genres = genresList.join(", ");
    const rating = getRating(baseTitle);
    const year = getYear(baseTitle);

    const allEpisodes: ParsedEpisode[] = [];
    const seasonsInfo: SeasonInfo[] = [];

    for (const season of seasonsRaw) {
      const seenEpNums = new Set<number>();
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

        return {
          id: epId,
          episodeNumber: epNum,
          seasonNumber: season.seasonNumber,
          filename: f.filename,
          relativePath: f.filename,
          fullPath: f.fullPath.replace(/\\/g, "/"),
          size: f.size,
          quality: ext === ".mkv" || f.size > 200 * 1024 * 1024 ? "1080p" : "720p",
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

    let synopsis = `Serial anime ${baseTitle} dari koleksi lokal penyimpanan Anda. Total ${allEpisodes.length} episode siap ditonton dengan kualitas jernih.`;
    if (baseTitle === "LoveLive!") {
      synopsis = `Honoka Kousaka bersama teman-temannya membentuk grup idola sekolah μ's (Muse) demi menyelamatkan Akademi Otonokizaka dari ancaman penutupan dan menjuarai kompetisi Love Live. Tersedia Musim 1 & Musim 2 lengkap.`;
    }

    animeList.push({
      id: slug,
      title: baseTitle,
      folderName: seasonsRaw[0].folderName,
      synopsis,
      year,
      totalEpisodes: allEpisodes.length,
      totalSeasons: seasonsInfo.length,
      seasons: seasonsInfo,
      genres,
      genresList,
      posterUrl: poster,
      coverUrl: cover,
      rating,
      isFeatured,
      episodes: allEpisodes,
    });
  }

  // Urutkan anime berdasarkan abjad judul
  animeList.sort((a, b) => collator.compare(a.title, b.title));

  console.log(`\nMenyimpan ${animeList.length} anime ke parsedAnime.json...`);
  fs.writeFileSync(
    path.join(process.cwd(), "src", "data", "parsedAnime.json"),
    JSON.stringify(animeList, null, 2),
    "utf-8"
  );

  // 3. UPDATE DATABASE TURSO (Membersihkan anime lama & memasukkan struktur franchise)
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

      // Masukkan episode untuk setiap musim
      for (const ep of a.episodes) {
        const sourceUrl = `file:///${ep.fullPath}`;
        await client.execute({
          sql: `INSERT INTO episodes (id, anime_id, title, episode_number, season_number, duration_seconds, source_type, source_url, thumbnail_url, synopsis, file_size, video_quality, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            ep.id,
            a.id,
            `Episode ${ep.episodeNumber}`,
            ep.episodeNumber,
            ep.seasonNumber,
            1440,
            "local",
            sourceUrl,
            a.coverUrl,
            `Episode ${ep.episodeNumber} (Musim ${ep.seasonNumber}) dari serial ${a.title}. Berkas: ${ep.filename}`,
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
  console.log("\n=== Menulis src/data/mockAnime.ts Menggunakan Data Franchise ===");
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

  // 5. GENERATE FILE src/data/mockEpisodes.ts
  console.log("\n=== Menulis src/data/mockEpisodes.ts Menggunakan Data Franchise ===");
  const episodesRecord: Record<string, any[]> = {};
  for (const a of animeList) {
    episodesRecord[a.id] = a.episodes.map((ep) => ({
      id: ep.id,
      animeId: a.id,
      title: `Episode ${ep.episodeNumber}`,
      episodeNumber: ep.episodeNumber,
      seasonNumber: ep.seasonNumber,
      durationSeconds: 1440,
      sourceType: "local",
      sourceUrl: `/api/stream?file=${encodeURIComponent(ep.fullPath)}`,
      thumbnailUrl: a.coverUrl,
      synopsis: `Episode ${ep.episodeNumber} (Musim ${ep.seasonNumber}) dari serial ${a.title}. Berkas: ${ep.filename}`,
    }));
  }

  const defaultEp = {
    id: `ep-${heroAnime.id}-s1-1`,
    animeId: heroAnime.id,
    title: "Episode 1",
    episodeNumber: 1,
    seasonNumber: 1,
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

  console.log("\n🎉 SELURUH PROSES RE-INDEX FRANCHISE SELESAI DENGAN SEMPURNA!");
}

main().catch(console.error);
