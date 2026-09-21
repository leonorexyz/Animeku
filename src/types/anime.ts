export interface Episode {
  id: string;
  animeId: string;
  title: string;
  episodeNumber: number;
  durationSeconds: number;
  sourceType: "local" | "drive" | "link";
  sourceUrl: string;
}

export interface WatchProgress {
  id: string;
  animeId: string;
  animeTitle: string;
  animePoster: string;
  episodeId: string;
  episodeNumber: number;
  episodeTitle: string;
  positionSeconds: number;
  durationSeconds: number;
  isCompleted: boolean;
  lastWatchedAt: string;
}

export interface Anime {
  id: string;
  title: string;
  synopsis: string;
  year: number;
  posterUrl: string;
  coverUrl: string;
  status: "belum" | "sedang" | "tamat";
  watchStatus?: "unwatched" | "watching" | "completed";
  isFeatured?: boolean;
  isFavorite?: boolean;
  rating?: string;
  genres: string[];
  totalEpisodes: number;
  progress?: WatchProgress;
}

export interface CategorySection {
  id: string;
  name: string;
  type: "category" | "genre" | "continue_watching" | "collection";
  sortOrder?: number;
  items: Anime[];
}
