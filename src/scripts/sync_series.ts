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

const SERIES_DIR = "D:\\Anime\\Series";
const MOVIE_DIR = "D:\\Anime\\Movie";
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
  type: "series" | "movie";
  sourceBasePath: string;
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
  "5 Centimeters per Second",
  "Chainsaw Man - Reze Arc",
  "Summer Wars",
];

async function main() {
  console.log("=== Memulai Sinkronisasi & Pengindeksan Terpadu Serial & Film ===");
  if (!fs.existsSync(SERIES_DIR)) {
    throw new Error(`Direktori Series ${SERIES_DIR} tidak ditemukan!`);
  }

  const metadataFetcher = new MetadataFetcher();
  const seenSlugs = new Set<string>();

  // ==========================================
  // 1. SCAN SERIAL ANIME (D:\Anime\Series)
  // ==========================================
  console.log(`\n--- Memindai Koleksi Serial Anime di ${SERIES_DIR} ---`);
  const rawSeriesDirs = fs.readdirSync(SERIES_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  const seriesDirs: { name: string; folderPath: string }[] = [];

  for (const d of rawSeriesDirs) {
    const full = path.join(SERIES_DIR, d.name);
    if (d.name === "Spring 2017") {
      const subDirs = fs.readdirSync(full, { withFileTypes: true }).filter((sd) => sd.isDirectory());
      for (const sd of subDirs) {
        seriesDirs.push({ name: sd.name, folderPath: path.join(full, sd.name) });
      }
    } else {
      seriesDirs.push({ name: d.name, folderPath: full });
    }
  }

  interface RawFolderData {
    folderName: string;
    seasonNumber: number;
    seasonTitle: string;
    files: { filename: string; fullPath: string; size: number }[];
  }

  const seriesGroups = new Map<string, RawFolderData[]>();

  for (const item of seriesDirs) {
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
    if (!seriesGroups.has(info.baseTitle)) {
      seriesGroups.set(info.baseTitle, []);
    }
    seriesGroups.get(info.baseTitle)!.push({
      folderName: item.name,
      seasonNumber: info.seasonNumber,
      seasonTitle: info.seasonTitle,
      files,
    });
  }

  console.log(`Ditemukan ${seriesGroups.size} franchise serial anime unik.`);

  const seriesList: ParsedAnime[] = [];
  let sIndex = 0;

  for (const [baseTitle, seasonsRaw] of seriesGroups.entries()) {
    sIndex++;
    seasonsRaw.sort((a, b) => a.seasonNumber - b.seasonNumber);

    let slug = baseTitle
      .toLowerCase()
      .replace(/\+/g, "-plus")
      .replace(/!/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (!slug) slug = `series-${sIndex}`;
    if (seenSlugs.has(slug)) slug = `${slug}-${sIndex}`;
    seenSlugs.add(slug);

    const isFeatured = FEATURED_TITLES.some(
      (ft) => baseTitle.toLowerCase() === ft.toLowerCase()
    );

    const preliminarySeasonsInfo: SeasonInfo[] = seasonsRaw.map((s) => ({
      seasonNumber: s.seasonNumber,
      title: s.seasonTitle,
      folderName: s.folderName,
      totalEpisodes: s.files.length,
    }));

    let metadata;
    try {
      metadata = await metadataFetcher.fetchAnimeMetadata(baseTitle, preliminarySeasonsInfo);
    } catch (err: any) {
      console.warn(`Peringatan: Gagal mengambil metadata daring untuk ${baseTitle}:`, err.message);
      metadata = null;
    }

    const officialTitle = metadata?.officialTitle || baseTitle;
    const synopsis =
      metadata?.synopsis ||
      `Serial anime ${baseTitle} dari koleksi lokal penyimpanan Anda. Total ${seasonsRaw.reduce(
        (sum, s) => sum + s.files.length,
        0
      )} episode siap ditonton dengan kualitas jernih.`;
    const posterUrl =
      metadata?.posterUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600";
    const coverUrl = metadata?.coverUrl || posterUrl;
    const rating = metadata?.rating || "8.4";
    const year = metadata?.year || 2015;
    const genresList =
      metadata?.genres && metadata.genres.length > 0 ? metadata.genres : ["Anime", "Series"];
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
          if (parsed > 0 && parsed <= 2000) epNum = parsed;
        }

        while (seenEpNums.has(epNum)) epNum++;
        seenEpNums.add(epNum);

        const epId =
          seasonsRaw.length > 1
            ? `ep-${slug}-s${season.seasonNumber}-${epNum}`
            : `ep-${slug}-${epNum}`;

        const foundCached = cachedEps.find((ce) => ce.episodeNumber === epNum);

        const epTitle = foundCached?.title || `Episode ${epNum}`;
        const epThumb = foundCached?.thumbnailUrl || coverUrl;
        const epSynopsis =
          foundCached?.synopsis ||
          `Episode ${epNum} (Musim ${season.seasonNumber}) dari serial ${officialTitle}. Berkas: ${f.filename}`;

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

    seriesList.push({
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
      type: "series",
      sourceBasePath: "D:/Anime/Series",
    });
  }

  // ==========================================
  // 2. SCAN FILM / MOVIE ANIME (D:\Anime\Movie)
  // ==========================================
  console.log(`\n--- Memindai Koleksi Film & Movie di ${MOVIE_DIR} ---`);
  const movieList: ParsedAnime[] = [];

  if (fs.existsSync(MOVIE_DIR)) {
    const rawMovieDirs = fs.readdirSync(MOVIE_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
    console.log(`Ditemukan ${rawMovieDirs.length} folder film di direktori ${MOVIE_DIR}`);

    let mIndex = 0;
    for (const d of rawMovieDirs) {
      mIndex++;
      const folderPath = path.join(MOVIE_DIR, d.name);
      const rootFiles = fs.readdirSync(folderPath, { withFileTypes: true });

      const files: { filename: string; fullPath: string; size: number }[] = [];
      for (const f of rootFiles) {
        if (f.isFile() && VALID_EXTS.includes(path.extname(f.name).toLowerCase())) {
          const full = path.join(folderPath, f.name);
          try {
            const stat = fs.statSync(full);
            files.push({ filename: f.name, fullPath: full, size: stat.size });
          } catch (e) {}
        }
      }

      if (files.length === 0) continue;

      // Special ordering for Naruto Shippuden movies
      if (d.name.includes("Naruto")) {
        files.sort((a, b) => {
          const getNum = (name: string) => {
            if (name.includes("Movie 1")) return 1;
            if (name.includes("Movie 2") || name.includes("Bonds")) return 2;
            if (name.includes("Movie 3") || name.includes("Inheritors")) return 3;
            if (name.includes("Movie 4") || name.includes("Lost Tower")) return 4;
            if (name.includes("Movie 5") || name.includes("Blood Prison")) return 5;
            if (name.includes("Movie 6") || name.includes("Road To Ninja")) return 6;
            if (name.includes("Movie 7") || name.includes("Last Movie")) return 7;
            if (name.toLowerCase().includes("boruto")) return 8;
            return 99;
          };
          return getNum(a.filename) - getNum(b.filename);
        });
      } else {
        files.sort((a, b) => collator.compare(a.filename, b.filename));
      }

      let slug = d.name
        .toLowerCase()
        .replace(/\+/g, "-plus")
        .replace(/!/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (!slug) slug = `movie-${mIndex}`;
      if (seenSlugs.has(slug)) slug = `${slug}-movie`;
      seenSlugs.add(slug);

      const isFeatured = FEATURED_TITLES.some(
        (ft) => d.name.toLowerCase() === ft.toLowerCase()
      );

      const preliminarySeasonsInfo: SeasonInfo[] = [
        {
          seasonNumber: 1,
          title: "Film",
          folderName: d.name,
          totalEpisodes: files.length,
        },
      ];

      console.log(`\n[${mIndex}/${rawMovieDirs.length}] Memproses metadata film "${d.name}" (${files.length} berkas video)...`);

      let metadata;
      try {
        metadata = await metadataFetcher.fetchAnimeMetadata(d.name, preliminarySeasonsInfo);
      } catch (err: any) {
        console.warn(`Peringatan: Gagal mengambil metadata film ${d.name}:`, err.message);
        metadata = null;
      }

      const officialTitle = metadata?.officialTitle || d.name;
      const synopsis =
        metadata?.synopsis ||
        `Film anime ${d.name} dari koleksi lokal penyimpanan Anda. Siap ditonton dengan kualitas HD prima.`;
      const posterUrl =
        metadata?.posterUrl || "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600";
      const coverUrl = metadata?.coverUrl || posterUrl;
      const rating = metadata?.rating || "8.5";
      const year = metadata?.year || 2015;

      const genresList = metadata?.genres && metadata.genres.length > 0 ? [...metadata.genres] : ["Movie", "Anime"];
      if (!genresList.includes("Movie")) {
        genresList.unshift("Movie");
      }
      const genres = genresList.join(", ");

      const cachedEps = metadata?.seasonEpisodes?.[1] || [];
      const movieEpisodes: ParsedEpisode[] = files.map((f, idx) => {
        const ext = path.extname(f.filename).toLowerCase();
        const epNum = idx + 1;
        const epId = `ep-${slug}-${epNum}`;

        const foundCached = cachedEps.find((ce) => ce.episodeNumber === epNum);

        let epTitle = foundCached?.title;
        if (!epTitle) {
          epTitle = files.length === 1 ? officialTitle : `Bagian ${epNum}: ${path.basename(f.filename, ext)}`;
        }
        const epThumb = foundCached?.thumbnailUrl || coverUrl;
        const epSynopsis =
          foundCached?.synopsis ||
          `Berkas film ${officialTitle}: ${f.filename}. Kualitas visual jernih dengan audio spektakuler.`;

        return {
          id: epId,
          title: epTitle,
          episodeNumber: epNum,
          seasonNumber: 1,
          filename: f.filename,
          relativePath: f.filename,
          fullPath: f.fullPath.replace(/\\/g, "/"),
          size: f.size,
          quality: ext === ".mkv" || f.size > 200 * 1024 * 1024 ? "1080p" : "720p",
          thumbnailUrl: epThumb,
          synopsis: epSynopsis,
        };
      });

      const seasonsInfo: SeasonInfo[] = [
        {
          seasonNumber: 1,
          title: "Film Utama",
          folderName: d.name,
          totalEpisodes: movieEpisodes.length,
        },
      ];

      movieList.push({
        id: slug,
        title: officialTitle,
        folderName: d.name,
        synopsis,
        year,
        totalEpisodes: movieEpisodes.length,
        totalSeasons: 1,
        seasons: seasonsInfo,
        genres,
        genresList,
        posterUrl,
        coverUrl,
        rating,
        isFeatured,
        episodes: movieEpisodes,
        type: "movie",
        sourceBasePath: "D:/Anime/Movie",
      });
    }
  }

  // ==========================================
  // 3. GABUNGKAN & URUTKAN SELURUH KATALOG
  // ==========================================
  const animeList: ParsedAnime[] = [...seriesList, ...movieList];
  animeList.sort((a, b) => collator.compare(a.title, b.title));

  console.log(`\nTotal katalog terkumpul: ${animeList.length} Anime (${seriesList.length} Serial TV + ${movieList.length} Film Layar Lebar).`);

  fs.writeFileSync(
    path.join(process.cwd(), "src", "data", "parsedAnime.json"),
    JSON.stringify(animeList, null, 2),
    "utf-8"
  );
  console.log("✓ src/data/parsedAnime.json berhasil disimpan!");

  // ==========================================
  // 4. UPDATE DATABASE TURSO DENGAN BATCH CEPAT
  // ==========================================
  console.log(`\n=== Memperbarui Database Turso (${animeList.length} Anime) ===`);
  const now = new Date().toISOString();

  try {
    console.log("Membersihkan tabel relasi lama di Turso...");
    await client.execute("DELETE FROM episode_sources");
    await client.execute("DELETE FROM episodes");
    await client.execute("DELETE FROM anime_categories");
    await client.execute("DELETE FROM anime");
    console.log("✓ Database dibersihkan dengan sukses!");
  } catch (err: any) {
    console.warn("Peringatan saat membersihkan tabel:", err.message);
  }

  // Pastikan kategori all-movies dan all-series tersedia di database
  try {
    await client.execute({
      sql: `INSERT OR IGNORE INTO categories (id, user_id, name, type, description, color_theme, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "all-movies",
        "user-default",
        "Film & Movie Anime Pilihan",
        "collection",
        "Koleksi mahakarya film layar lebar anime pilihan",
        "red",
        1,
        now,
        now,
      ],
    });
    await client.execute({
      sql: `INSERT OR IGNORE INTO categories (id, user_id, name, type, description, color_theme, sort_order, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        "all-series",
        "user-default",
        "Koleksi Serial Anime Pilihan",
        "collection",
        "Koleksi serial anime lengkap per musim",
        "blue",
        2,
        now,
        now,
      ],
    });
  } catch (err: any) {
    console.warn("Gagal memastikan kategori default:", err.message);
  }

  let insertedCount = 0;
  let failedCount = 0;

  for (let idx = 0; idx < animeList.length; idx++) {
    const a = animeList[idx];
    try {
      const primaryCatId = a.type === "movie" ? "all-movies" : "all-series";
      const statements: any[] = [
        {
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
            `${a.sourceBasePath}/${a.folderName}`,
            now,
            now,
          ],
        },
        {
          sql: `INSERT OR IGNORE INTO anime_categories (id, anime_id, category_id) VALUES (?, ?, ?)`,
          args: [`ac-${a.id}-${primaryCatId}`, a.id, primaryCatId],
        },
      ];

      // Kategori genre tambahan
      let specificCat = "";
      if (a.genres.includes("Action") || a.genres.includes("Aksi")) specificCat = "action";
      else if (a.genres.includes("Romance") || a.genres.includes("Romansa")) specificCat = "romance";
      else if (a.genres.includes("Comedy") || a.genres.includes("Komedi")) specificCat = "comedy";
      else if (a.genres.includes("Fantasy") || a.genres.includes("Fantasi")) specificCat = "fantasy";

      if (specificCat) {
        statements.push({
          sql: `INSERT OR IGNORE INTO anime_categories (id, anime_id, category_id) VALUES (?, ?, ?)`,
          args: [`ac-${a.id}-${specificCat}`, a.id, specificCat],
        });
      }

      for (const ep of a.episodes) {
        const sourceUrl = `file:///${ep.fullPath}`;
        statements.push({
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

        statements.push({
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

      await client.batch(statements, "write");
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

  // ==========================================
  // 5. GENERATE FILE src/data/mockAnime.ts
  // ==========================================
  console.log("\n=== Menulis src/data/mockAnime.ts Menggunakan Data Akurat ===");
  const featuredAnimes = animeList.filter((a) => a.isFeatured).slice(0, 6);
  const heroAnime = featuredAnimes[0] || animeList[0];

  const actionItems = animeList.filter((a) => a.genres.includes("Action") || a.genres.includes("Aksi")).slice(0, 15);
  const romanceItems = animeList.filter((a) => a.genres.includes("Romance") || a.genres.includes("Romansa")).slice(0, 15);
  const comedyItems = animeList.filter((a) => a.genres.includes("Comedy") || a.genres.includes("Komedi")).slice(0, 15);
  const fantasyItems = animeList.filter((a) => a.genres.includes("Fantasy") || a.genres.includes("Fantasi")).slice(0, 15);
  const allSeriesItems = seriesList.slice(0, 20);

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
    type: a.type,
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
    id: "all-movies",
    name: "🎬 Film & Movie Anime Pilihan",
    type: "collection",
    sortOrder: 1,
    items: ${JSON.stringify(movieList.map(formatAnimeObj), null, 2)},
  },
  {
    id: "all-series",
    name: "📺 Koleksi Serial Anime Pilihan",
    type: "collection",
    sortOrder: 2,
    items: ${JSON.stringify(allSeriesItems.map(formatAnimeObj), null, 2)},
  },
  {
    id: "action",
    name: "Aksi & Petualangan Pilihan",
    type: "genre",
    sortOrder: 3,
    items: ${JSON.stringify(actionItems.map(formatAnimeObj), null, 2)},
  },
  {
    id: "romance",
    name: "Romance & Drama Emosional",
    type: "genre",
    sortOrder: 4,
    items: ${JSON.stringify(romanceItems.map(formatAnimeObj), null, 2)},
  },
  {
    id: "comedy",
    name: "Komedi & Slice of Life",
    type: "genre",
    sortOrder: 5,
    items: ${JSON.stringify(comedyItems.map(formatAnimeObj), null, 2)},
  },
  {
    id: "fantasy",
    name: "Fantasi & Dunia Isekai",
    type: "genre",
    sortOrder: 6,
    items: ${JSON.stringify(fantasyItems.map(formatAnimeObj), null, 2)},
  },
];

export const MOCK_CATALOG_DATA: Anime[] = ${JSON.stringify(animeList.map(formatAnimeObj), null, 2)};
`;

  fs.writeFileSync(path.join(process.cwd(), "src", "data", "mockAnime.ts"), mockAnimeContent, "utf-8");
  console.log("✓ src/data/mockAnime.ts berhasil diperbarui!");

  // ==========================================
  // 6. GENERATE FILE src/data/mockEpisodes.ts
  // ==========================================
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

  console.log("\n🎉 SELURUH PROSES RE-INDEX SERIAL & FILM SELESAI DENGAN SEMPURNA!");
}

main().catch(console.error);
