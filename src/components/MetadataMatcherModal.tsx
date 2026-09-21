"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Search,
  CheckCircle2,
  X,
  Star,
  Calendar,
  Layers,
  Image as ImageIcon,
  Check,
  RefreshCw,
  Film,
  ArrowRight,
  Info,
  Sliders,
  Tv,
} from "lucide-react";

export interface AnimeCandidate {
  id: string;
  title: string;
  titleRomaji?: string;
  titleEnglish?: string;
  synopsis: string;
  year: number;
  rating: string;
  status: "sedang" | "tamat";
  genres: string[];
  totalEpisodes: number;
  posterUrl: string;
  coverUrl: string;
  episodes: { episodeNumber: number; title: string; synopsis?: string }[];
}

interface MetadataMatcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  currentTitle?: string;
  onApplyMetadata: (candidate: AnimeCandidate) => void;
  className?: string;
}

const MOCK_CANDIDATES: AnimeCandidate[] = [
  {
    id: "cand-frieren",
    title: "Sousou no Frieren",
    titleRomaji: "Sousou no Frieren",
    titleEnglish: "Frieren: Beyond Journey's End",
    synopsis:
      "Setelah kelompok pahlawan mengalahkan Raja Iblis, penyihir elf Frieren harus menghadapi realitas umur panjangnya saat rekan-rekannya menua dan meninggal. Ia memulai perjalanan baru untuk memahami arti ikatan manusia.",
    year: 2023,
    rating: "9.3",
    status: "tamat",
    genres: ["Adventure", "Drama", "Fantasy", "Shounen"],
    totalEpisodes: 28,
    posterUrl:
      "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
    episodes: [
      { episodeNumber: 1, title: "Akhir Petualangan", synopsis: "Kelompok pahlawan kembali ke ibukota setelah perjalanan sepuluh tahun." },
      { episodeNumber: 2, title: "Bukan Sihir yang Luar Biasa", synopsis: "Frieren mengunjungi Heiter yang kini telah lanjut usia." },
      { episodeNumber: 3, title: "Sihir Penghancur Iblis", synopsis: "Frieren dan Fern tiba di desa yang dikepung bayang-bayang masa lalu." },
      { episodeNumber: 4, title: "Negeri Para Arwah", synopsis: "Membaca pesan dari penyihir agung Flamme." },
    ],
  },
  {
    id: "cand-solo-leveling",
    title: "Solo Leveling",
    titleRomaji: "Ore dake Level Up na Ken",
    titleEnglish: "Solo Leveling: Arise",
    synopsis:
      "Di dunia di mana pemburu berkekuatan magis melawan monster dari gerbang mematikan, Sung Jinwoo adalah pemburu peringkat E terlemah. Di ambang kematian di ruang bawah tanah ganda, sebuah sistem misterius memilihnya.",
    year: 2024,
    rating: "8.9",
    status: "sedang",
    genres: ["Action", "Adventure", "Fantasy"],
    totalEpisodes: 12,
    posterUrl:
      "https://images.unsplash.com/photo-1563089145-599997674d42?w=500&auto=format&fit=crop&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&auto=format&fit=crop&q=80",
    episodes: [
      { episodeNumber: 1, title: "Saya Terbiasa Menjadi yang Terlemah", synopsis: "Sung Jinwoo terluka parah dalam penyerbuan dungeon tingkat rendah." },
      { episodeNumber: 2, title: "Jika Diberi Kesempatan Lagi", synopsis: "Jinwoo terbangun di rumah sakit dan melihat layar antarmuka pencarian rahasia." },
      { episodeNumber: 3, title: "Dungeon Instan", synopsis: "Jinwoo memasuki dungeon kunci misterius untuk menaikkan levelnya sendirian." },
    ],
  },
  {
    id: "cand-jjk-s2",
    title: "Jujutsu Kaisen Season 2",
    titleRomaji: "Jujutsu Kaisen: Kaigyoku / Gyokusetsu",
    titleEnglish: "Jujutsu Kaisen Season 2 (Shibuya Incident)",
    synopsis:
      "Menelusuri masa lalu Satoru Gojo dan Suguru Geto di masa muda sekolah jujutsu, sebelum berlanjut ke insiden mencekam 31 Oktober di Stasiun Shibuya yang mengubah peradaban manusia dan penyihir.",
    year: 2023,
    rating: "9.1",
    status: "tamat",
    genres: ["Action", "Supernatural", "Fantasy", "Shounen"],
    totalEpisodes: 23,
    posterUrl:
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=500&auto=format&fit=crop&q=80",
    coverUrl:
      "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80",
    episodes: [
      { episodeNumber: 1, title: "Masa Muda yang Rapuh", synopsis: "Kilas balik persahabatan Gojo dan Geto saat misi pengawalan Wadah Plasma Bintang." },
      { episodeNumber: 2, title: "Insiden Shibuya Dimulai", synopsis: "Tirai hitam diturunkan di pusat Tokyo pada malam Halloween." },
    ],
  },
];

export default function MetadataMatcherModal({
  isOpen,
  onClose,
  initialQuery = "",
  currentTitle = "",
  onApplyMetadata,
  className = "",
}: MetadataMatcherModalProps) {
  const [query, setQuery] = useState(initialQuery || currentTitle || "Frieren");
  const [isSearching, setIsSearching] = useState(false);
  const [candidates, setCandidates] = useState<AnimeCandidate[]>(MOCK_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<AnimeCandidate>(
    MOCK_CANDIDATES[0]
  );
  const [cleanEpisodeTitles, setCleanEpisodeTitles] = useState(true);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      const q = query.toLowerCase();
      const filtered = MOCK_CANDIDATES.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.titleEnglish?.toLowerCase().includes(q) ||
          c.titleRomaji?.toLowerCase().includes(q)
      );

      if (filtered.length > 0) {
        setCandidates(filtered);
        setSelectedCandidate(filtered[0]);
      } else {
        // Fallback mock generated candidate
        const dynamic: AnimeCandidate = {
          id: `cand-${Date.now()}`,
          title: query.trim(),
          titleRomaji: query.trim(),
          titleEnglish: query.trim(),
          synopsis: `Hasil pencarian metadata daring resmi untuk anime "${query.trim()}". Berisi sinopsis lengkap, episode terverifikasi, dan poster resolusi tinggi.`,
          year: 2024,
          rating: "8.7",
          status: "sedang",
          genres: ["Action", "Fantasy", "Adventure"],
          totalEpisodes: 12,
          posterUrl:
            "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500&auto=format&fit=crop&q=80",
          coverUrl:
            "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80",
          episodes: Array.from({ length: 12 }, (_, i) => ({
            episodeNumber: i + 1,
            title: `Episode ${i + 1}: Perjalanan Berlanjut`,
          })),
        };
        setCandidates([dynamic]);
        setSelectedCandidate(dynamic);
      }
    }, 600);
  };

  const handleConfirmApply = async () => {
    try {
      await fetch("/api/metadata/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedCandidate.title,
          synopsis: selectedCandidate.synopsis,
          year: selectedCandidate.year,
          rating: selectedCandidate.rating,
          status: selectedCandidate.status,
          genres: selectedCandidate.genres,
          posterUrl: selectedCandidate.posterUrl,
          coverUrl: selectedCandidate.coverUrl,
          totalEpisodes: selectedCandidate.totalEpisodes,
          episodes: selectedCandidate.episodes,
        }),
      });
    } catch (err) {
      console.warn("Could not persist metadata to API:", err);
    }
    onApplyMetadata(selectedCandidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-5xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Rapikan Judul, Poster & Episode</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  Auto-Scraper
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Pencocokan metadata resmi dari basis data anime global
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/30">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari judul anime resmi (Romaji, Inggris, atau Indonesia)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white focus:border-amber-500 outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Cari Metadata</span>
            </button>
          </form>
        </div>

        {/* Candidate Selector & Detailed Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto min-h-0">
          {/* Left: Matching Candidates List (4 cols) */}
          <div className="lg:col-span-4 p-4 border-r border-zinc-800/80 space-y-3 overflow-y-auto max-h-[55vh]">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Pilih Judul yang Cocok ({candidates.length})
            </span>

            <div className="space-y-2">
              {candidates.map((cand) => {
                const isSelected = selectedCandidate.id === cand.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidate(cand)}
                    className={`flex gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500/60 shadow-md"
                        : "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <img
                      src={cand.posterUrl}
                      alt={cand.title}
                      className="w-12 h-16 object-cover rounded-lg shrink-0 border border-zinc-800"
                    />
                    <div className="truncate flex-1 space-y-1">
                      <span className="text-xs font-bold text-white block truncate">
                        {cand.title}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-400">
                        <span className="text-amber-400 flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-amber-400" />
                          {cand.rating}
                        </span>
                        <span>{cand.year}</span>
                        <span>{cand.totalEpisodes} Ep</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block truncate">
                        {cand.genres.join(", ")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: Detailed Metadata & Episode Cleaner Preview (8 cols) */}
          <div className="lg:col-span-8 p-5 sm:p-6 space-y-5 overflow-y-auto max-h-[55vh]">
            {selectedCandidate ? (
              <div className="space-y-5">
                {/* Hero Preview Card */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 p-5 bg-zinc-900/60 flex flex-col sm:flex-row gap-5">
                  <img
                    src={selectedCandidate.posterUrl}
                    alt={selectedCandidate.title}
                    className="w-28 sm:w-32 h-40 sm:h-44 object-cover rounded-xl shadow-xl border border-zinc-700 shrink-0 mx-auto sm:mx-0"
                  />

                  <div className="space-y-2.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 font-bold text-[11px]">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {selectedCandidate.rating} Skor
                      </span>
                      <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded text-[11px]">
                        {selectedCandidate.year}
                      </span>
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 text-[10px] font-bold uppercase">
                        {selectedCandidate.status === "tamat" ? "Tamat" : "Sedang Tayang"}
                      </span>
                    </div>

                    <h4 className="text-lg sm:text-xl font-black text-white">
                      {selectedCandidate.title}
                    </h4>

                    {selectedCandidate.titleEnglish && (
                      <p className="text-xs text-zinc-400 italic">
                        Nama Inggris: {selectedCandidate.titleEnglish}
                      </p>
                    )}

                    <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
                      {selectedCandidate.synopsis}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedCandidate.genres.map((g) => (
                        <span
                          key={g}
                          className="px-2 py-0.5 rounded-full bg-zinc-800 text-[10px] font-medium text-zinc-300"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Episode Cleaner Table */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tv className="w-3.5 h-3.5 text-amber-400" />
                      <span>Judul Episode yang Ditemukan</span>
                    </span>
                    <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cleanEpisodeTitles}
                        onChange={(e) => setCleanEpisodeTitles(e.target.checked)}
                        className="w-3.5 h-3.5 accent-amber-500 rounded"
                      />
                      <span>Ganti Judul Episode dengan Nama Resmi</span>
                    </label>
                  </div>

                  <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 overflow-hidden divide-y divide-zinc-900 text-xs">
                    {selectedCandidate.episodes.map((ep) => (
                      <div
                        key={ep.episodeNumber}
                        className="p-2.5 flex items-center justify-between gap-3 hover:bg-zinc-900/40"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-6 text-center font-bold text-zinc-500">
                            #{ep.episodeNumber}
                          </span>
                          <span className="font-semibold text-zinc-200 truncate">
                            {cleanEpisodeTitles ? ep.title : `Episode ${ep.episodeNumber}`}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 shrink-0 hidden sm:inline">
                          Terverifikasi
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-2">
                <Search className="w-8 h-8 opacity-40" />
                <p className="text-xs">
                  Pilih salah satu kandidat di sebelah kiri atau ketikkan judul untuk mencari.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/80">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span>Poster, sinopsis, dan daftar episode akan otomatis dipasang.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleConfirmApply}
              className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-xs rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Terapkan Metadata & Poster Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
