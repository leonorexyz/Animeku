"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import EpisodeList from "@/components/EpisodeList";
import PlayAndResumeButtons from "@/components/PlayAndResumeButtons";
import {
  MOCK_FEATURED_ANIME,
  MOCK_FEATURED_ANIMES,
  MOCK_CONTINUE_WATCHING,
  MOCK_CATEGORIES,
  MOCK_CATALOG_DATA,
} from "@/data/mockAnime";
import { MOCK_EPISODES, ExtendedEpisode } from "@/data/mockEpisodes";
import { Anime, WatchProgress } from "@/types/anime";
import { getAllWatchProgress, getWatchProgressForAnime } from "@/utils/watchProgress";
import {
  Play,
  Plus,
  Check,
  Star,
  Calendar,
  Clock,
  Film,
  ArrowLeft,
  Share2,
  Volume2,
  VolumeX,
  Sparkles,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function AnimeDetailPage({ params }: PageProps) {
  const router = useRouter();
  const resolvedParams = use(params);
  const animeId = resolvedParams.id;

  const [selectedSeason, setSelectedSeason] = useState(1);
  const [copiedToast, setCopiedToast] = useState(false);

  const [dbAnimeData, setDbAnimeData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/anime/${animeId}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setDbAnimeData(json.data);
        }
      })
      .catch(() => {});
  }, [animeId]);

  // Find anime from API or mock data
  const allAnimes: Anime[] = [
    ...MOCK_FEATURED_ANIMES,
    ...MOCK_CONTINUE_WATCHING,
    ...MOCK_CATALOG_DATA,
  ];
  MOCK_CATEGORIES.forEach((cat) => allAnimes.push(...cat.items));

  const anime: Anime =
    dbAnimeData || allAnimes.find((a) => a.id === animeId) || MOCK_FEATURED_ANIME;

  // Episodes for this anime
  const episodes: ExtendedEpisode[] =
    dbAnimeData?.episodes ||
    MOCK_EPISODES[anime.id] ||
    Array.from({ length: anime.totalEpisodes || 12 }, (_, i) => ({
      id: `${anime.id}-ep-${i + 1}`,
      animeId: anime.id,
      title: `Episode ${i + 1}`,
      episodeNumber: i + 1,
      durationSeconds: 1440,
      sourceType: "link" as const,
      sourceUrl:
        "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl:
        anime.coverUrl ||
        "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
      synopsis: `Kelanjutan kisah petualangan ${anime.title} pada babak ke-${i + 1}.`,
    }));

  // Watch progress
  const [savedProgress, setSavedProgress] = useState<any>(null);
  const [allProgress, setAllProgress] = useState<Record<string, WatchProgress>>({});
  useEffect(() => {
    const p = getWatchProgressForAnime(anime.id);
    if (p) setSavedProgress(p);
    const all = getAllWatchProgress();
    setAllProgress(all);
  }, [anime.id]);

  // Similar anime recommendations
  const similarAnimes = allAnimes
    .filter((a) => a.id !== anime.id)
    .slice(0, 6);

  const handlePlay = (episodeNumber?: number) => {
    const targetEp = episodeNumber || (savedProgress?.episodeNumber ?? 1);
    router.push(`/player/${anime.id}?ep=${targetEp}`);
  };

  const handlePlayEpisode = (ep: ExtendedEpisode) => {
    router.push(`/player/${anime.id}?ep=${ep.episodeNumber}`);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main Hero Header Banner */}
      <div className="relative w-full h-[70vh] sm:h-[80vh] min-h-[500px]">
        {/* Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src={anime.coverUrl}
            alt={anime.title}
            className="w-full h-full object-cover object-center brightness-90"
          />
          {/* Multi-layered Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#141414] via-[#141414]/70 to-transparent" />
        </div>

        {/* Floating Back Button */}
        <div className="absolute top-24 left-4 sm:left-8 z-30">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 hover:bg-zinc-800 text-white text-xs font-semibold backdrop-blur-md border border-white/10 transition-transform hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog</span>
          </Link>
        </div>

        {/* Hero Content Information */}
        <div className="absolute bottom-12 left-4 sm:left-8 lg:left-12 max-w-2xl z-20 space-y-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
            {anime.rating && (
              <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {anime.rating} Skor
              </span>
            )}
            <span className="text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/10">
              {anime.year}
            </span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-wider text-[10px]">
              {anime.status === "tamat" ? "Tamat" : "Sedang Tayang"}
            </span>
            <span className="text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-white/10">
              {anime.totalEpisodes || episodes.length} Episode
            </span>
            <span className="text-red-400 bg-red-600/10 px-1.5 py-0.5 rounded border border-red-500/30 text-[10px]">
              Ultra HD 4K
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight drop-shadow-lg">
            {anime.title}
          </h1>

          {/* Synopsis */}
          <p className="text-sm sm:text-base text-zinc-300 line-clamp-3 sm:line-clamp-4 leading-relaxed drop-shadow">
            {anime.synopsis}
          </p>

          {/* Action Buttons: Play, Continue, My List, Share */}
          <div className="pt-2">
            <PlayAndResumeButtons
              animeId={anime.id}
              animeTitle={anime.title}
              totalEpisodes={anime.totalEpisodes || episodes.length}
              savedProgress={savedProgress}
              onShare={handleShare}
              onPlay={handlePlay}
            />
          </div>

          {copiedToast && (
            <div className="text-xs text-emerald-400 font-semibold animate-in fade-in">
              ✓ Tautan anime berhasil disalin ke clipboard!
            </div>
          )}
        </div>
      </div>

      {/* Main Detail Content Container */}
      <div className="relative z-20 px-4 sm:px-8 lg:px-12 space-y-12 pb-16">
        {/* Episodes Section */}
        <section className="pt-6">
          <EpisodeList
            episodes={episodes}
            progressMap={allProgress}
            onPlayEpisode={handlePlayEpisode}
          />
        </section>

        {/* About Anime / Detail & Metadata */}
        <section className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <h2 className="text-lg sm:text-xl font-extrabold text-white">
            Tentang <span className="text-red-500">{anime.title}</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block">
                Sinopsis Lengkap
              </span>
              <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                {anime.synopsis}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Genre
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {anime.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-1 rounded-full bg-zinc-800 text-xs font-medium text-zinc-300 border border-white/5"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Tahun Rilis
                </span>
                <span className="text-zinc-200 font-semibold">{anime.year}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Tersedia Audio & Subtitle
                </span>
                <p className="text-xs text-zinc-300">
                  Audio: Jepang (Dolby 5.1), Indonesia Dub, English Dub
                </p>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Subtitle: Bahasa Indonesia, English, Romaji
                </p>
              </div>

              <div>
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Format Sumber Video
                </span>
                <span className="text-xs text-zinc-300">
                  File Lokal, Google Drive API, HTTP Direct Stream
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Similar Recommendations Shelf */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wide">
              Judul Serupa yang Mungkin Anda Suka
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {similarAnimes.map((sim) => (
              <AnimeCard
                key={sim.id}
                anime={sim}
                onPlay={(a) => router.push(`/player/${a.id}`)}
                onSelect={(a) => router.push(`/anime/${a.id}`)}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
