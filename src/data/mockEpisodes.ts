import { Episode } from "@/types/anime";

export interface ExtendedEpisode extends Episode {
  thumbnailUrl: string;
  synopsis: string;
}

export const MOCK_EPISODES: Record<string, ExtendedEpisode[]> = {
  "anime-1": [
    {
      id: "anime-1-ep-1",
      animeId: "anime-1",
      title: "Akhir Petualangan",
      episodeNumber: 1,
      durationSeconds: 1440,
      sourceType: "link",
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
      synopsis: "Pesta kembang api setelah kepulangan sang pahlawan menandai dimulainya era damai.",
    },
    {
      id: "anime-1-ep-2",
      animeId: "anime-1",
      title: "Bukan Karena Itu Sihir",
      episodeNumber: 2,
      durationSeconds: 1440,
      sourceType: "link",
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
      synopsis: "Frieren bertemu dengan Fern dan berjanji mengajarkannya dasar-dasar ilmu sihir.",
    },
    {
      id: "anime-1-ep-12",
      animeId: "anime-1",
      title: "Pahlawan Sejati",
      episodeNumber: 12,
      durationSeconds: 1440,
      sourceType: "link",
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
      synopsis: "Kenangan masa lalu bersama Himmel membimbing Frieren dalam pertarungan krusial.",
    },
    {
      id: "anime-1-ep-13",
      animeId: "anime-1",
      title: "Menolak Membenci Sesama",
      episodeNumber: 13,
      durationSeconds: 1440,
      sourceType: "link",
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?w=400&auto=format&fit=crop&q=80",
      synopsis: "Perjalanan ke wilayah utara membawa kelompok Frieren ke sebuah desa berpenduduk aneh.",
    },
  ],
  "anime-2": [
    {
      id: "anime-2-ep-17",
      animeId: "anime-2",
      title: "Gerbang Neraka Terbuka",
      episodeNumber: 17,
      durationSeconds: 1420,
      sourceType: "link",
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=400&auto=format&fit=crop&q=80",
      synopsis: "Sukuna melepaskan teknik pamungkasnya di tengah reruntuhan Shibuya.",
    },
    {
      id: "anime-2-ep-18",
      animeId: "anime-2",
      title: "Benar dan Salah",
      episodeNumber: 18,
      durationSeconds: 1420,
      sourceType: "link",
      sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&auto=format&fit=crop&q=80",
      synopsis: "Yuji Itadori menghadapi pukulan emosional terberat dalam hidupnya.",
    },
  ],
};

export const DEFAULT_EPISODE: ExtendedEpisode = {
  id: "anime-1-ep-12",
  animeId: "anime-1",
  title: "Pahlawan Sejati",
  episodeNumber: 12,
  durationSeconds: 1440,
  sourceType: "link",
  sourceUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  thumbnailUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
  synopsis: "Kenangan masa lalu bersama Himmel membimbing Frieren dalam pertarungan krusial.",
};
