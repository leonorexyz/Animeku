import { Anime } from "@/types/anime";

export type SortCriterion =
  | "relevance"
  | "rating-desc"
  | "rating-asc"
  | "year-desc"
  | "year-asc"
  | "title-asc"
  | "title-desc"
  | "episodes-desc";

/**
 * Menghitung skor relevansi sebuah anime terhadap kata kunci pencarian.
 * Skor lebih tinggi menunjukkan kecocokan yang lebih baik.
 */
export function calculateRelevanceScore(anime: Anime, query: string): number {
  if (!query || !query.trim()) return 0;

  const q = query.toLowerCase().trim();
  const title = (anime.title || "").toLowerCase();
  const synopsis = (anime.synopsis || "").toLowerCase();
  const genres = (anime.genres || []).map((g) => g.toLowerCase());

  let score = 0;

  // 1. Kecocokan Judul
  if (title === q) {
    score += 100; // Judul persis sama
  } else if (title.startsWith(q)) {
    score += 60; // Judul diawali kata kunci
  } else if (title.includes(q)) {
    score += 35; // Judul mengandung kata kunci
  }

  // 2. Kecocokan Genre
  if (genres.some((g) => g === q)) {
    score += 25;
  } else if (genres.some((g) => g.includes(q))) {
    score += 15;
  }

  // 3. Kecocokan Sinopsis
  if (synopsis.includes(q)) {
    score += 10;
  }

  // 4. Bobot tambahan dari rating dan status featured
  const ratingNum = parseFloat(anime.rating || "0");
  score += ratingNum * 0.5;
  if (anime.isFeatured) {
    score += 3;
  }

  return score;
}

/**
 * Mengurutkan daftar anime berdasarkan kriteria tertentu dan query pencarian.
 */
export function sortAnimeList(
  items: Anime[],
  sortBy: string = "rating-desc",
  query: string = ""
): Anime[] {
  const cloned = [...items];

  // Jika pengguna memilih relevansi atau ada query dan kriteria adalah 'relevance'
  if (sortBy === "relevance" && query.trim()) {
    return cloned.sort((a, b) => {
      const scoreA = calculateRelevanceScore(a, query);
      const scoreB = calculateRelevanceScore(b, query);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
      return (
        parseFloat(b.rating || "0") - parseFloat(a.rating || "0")
      );
    });
  }

  return cloned.sort((a, b) => {
    switch (sortBy) {
      case "rating-desc": {
        const diff =
          parseFloat(b.rating || "0") - parseFloat(a.rating || "0");
        if (diff !== 0) return diff;
        return b.year - a.year;
      }

      case "rating-asc": {
        const diff =
          parseFloat(a.rating || "0") - parseFloat(b.rating || "0");
        if (diff !== 0) return diff;
        return a.year - b.year;
      }

      case "year-desc": {
        const diff = b.year - a.year;
        if (diff !== 0) return diff;
        return (
          parseFloat(b.rating || "0") - parseFloat(a.rating || "0")
        );
      }

      case "year-asc": {
        const diff = a.year - b.year;
        if (diff !== 0) return diff;
        return (
          parseFloat(b.rating || "0") - parseFloat(a.rating || "0")
        );
      }

      case "title-asc":
        return a.title.localeCompare(b.title, "id", { sensitivity: "base" });

      case "title-desc":
        return b.title.localeCompare(a.title, "id", { sensitivity: "base" });

      case "episodes-desc":
        return (b.totalEpisodes || 0) - (a.totalEpisodes || 0);

      case "relevance":
        if (query.trim()) {
          return calculateRelevanceScore(b, query) - calculateRelevanceScore(a, query);
        }
        return parseFloat(b.rating || "0") - parseFloat(a.rating || "0");

      default:
        return 0;
    }
  });
}
