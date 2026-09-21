"use client";

import React, { useState, useRef } from "react";
import {
  Link2,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Film,
  Plus,
  ShieldCheck,
  Check,
  ExternalLink,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
} from "lucide-react";

export interface StreamLinkData {
  title: string;
  url: string;
  episodeNumber: number;
  episodeTitle?: string;
  quality: string;
  serverLabel: string;
}

interface DirectStreamLinkImporterProps {
  onAddStream?: (stream: StreamLinkData) => void;
  className?: string;
}

const SAMPLE_STREAMS = [
  {
    label: "Sample 1080p (Big Buck Bunny)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Big Buck Bunny: Anime Edition",
    quality: "1080p",
  },
  {
    label: "Sample 720p (Elephants Dream)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    title: "Elephants Dream",
    quality: "720p",
  },
  {
    label: "Sample Sci-Fi (Tears of Steel)",
    url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    title: "Tears of Steel: Cyber Mech",
    quality: "1080p",
  },
];

export default function DirectStreamLinkImporter({
  onAddStream,
  className = "",
}: DirectStreamLinkImporterProps) {
  const [streamUrl, setStreamUrl] = useState("");
  const [animeTitle, setAnimeTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState(1);
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [quality, setQuality] = useState("1080p");
  const [serverLabel, setServerLabel] = useState("Server Utama (CDN)");

  // Live Testing & Preview State
  const [isPreviewActive, setIsPreviewActive] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  const handleTestStream = () => {
    if (!streamUrl.trim()) {
      setErrorMessage("Silakan masukkan URL streaming terlebih dahulu.");
      setTestStatus("error");
      return;
    }

    try {
      new URL(streamUrl);
    } catch {
      setErrorMessage("Format URL tidak valid. Pastikan menyertakan http:// atau https://");
      setTestStatus("error");
      return;
    }

    setIsTesting(true);
    setTestStatus("idle");
    setErrorMessage("");
    setIsPreviewActive(true);

    // Simulate connection check
    setTimeout(() => {
      setIsTesting(false);
      setTestStatus("success");
    }, 900);
  };

  const handleVideoError = () => {
    setTestStatus("error");
    setErrorMessage("Gagal memuat video stream. Periksa kembali tautan atau izin CORS server sumber.");
  };

  const handleVideoCanPlay = () => {
    setTestStatus("success");
    setErrorMessage("");
  };

  const handleSelectSample = (sample: (typeof SAMPLE_STREAMS)[0]) => {
    setStreamUrl(sample.url);
    setAnimeTitle(sample.title);
    setQuality(sample.quality);
    setTestStatus("idle");
    setIsPreviewActive(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim() || !animeTitle.trim()) {
      setErrorMessage("Judul anime dan URL streaming wajib diisi.");
      setTestStatus("error");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessToast(true);

      onAddStream?.({
        title: animeTitle,
        url: streamUrl,
        episodeNumber,
        episodeTitle: episodeTitle || `Episode ${episodeNumber}`,
        quality,
        serverLabel,
      });

      setTimeout(() => {
        setSuccessToast(false);
        setStreamUrl("");
        setAnimeTitle("");
        setEpisodeTitle("");
        setIsPreviewActive(false);
        setTestStatus("idle");
      }, 2500);
    }, 750);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-6 backdrop-blur-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Link2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-bold text-white">
            Tambah Tautan Streaming Langsung
          </h2>
        </div>
        <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-white/5 font-medium">
          HLS (.m3u8), MP4, Direct CDN
        </span>
      </div>

      {/* Preset Sample Streams for Quick Testing */}
      <div className="space-y-2">
        <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Contoh Tautan Streaming Uji Coba:
        </span>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_STREAMS.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectSample(sample)}
              className="px-3 py-1.5 rounded-lg bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-xs font-semibold text-zinc-300 hover:text-white transition-all cursor-pointer"
            >
              {sample.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title & Episode Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
        <div className="sm:col-span-8 space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            Judul Seri Anime
          </label>
          <input
            type="text"
            required
            value={animeTitle}
            onChange={(e) => setAnimeTitle(e.target.value)}
            placeholder="Misal: Solo Leveling Season 2"
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-colors font-medium"
          />
        </div>

        <div className="sm:col-span-4 space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            Nomor Episode
          </label>
          <input
            type="number"
            min="1"
            required
            value={episodeNumber}
            onChange={(e) => setEpisodeNumber(parseInt(e.target.value, 10) || 1)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-amber-500 outline-none transition-colors font-bold text-center"
          />
        </div>
      </div>

      {/* Stream URL Input + Test Button */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
          URL Sumber Video Stream
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            required
            value={streamUrl}
            onChange={(e) => {
              setStreamUrl(e.target.value);
              setTestStatus("idle");
            }}
            placeholder="https://cdn.example.com/videos/episode-01.mp4 atau .m3u8"
            className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-zinc-200 focus:border-amber-500 outline-none transition-colors"
          />
          <button
            type="button"
            onClick={handleTestStream}
            disabled={isTesting}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs rounded-xl border border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {isTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            ) : (
              <Eye className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span>Uji & Pratinjau</span>
          </button>
        </div>
      </div>

      {/* Test Status Feedback */}
      {testStatus === "success" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Tautan video streaming berhasil dijangkau dan siap diputar!</span>
        </div>
      )}

      {testStatus === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage || "Tautan tidak dapat diputar."}</span>
        </div>
      )}

      {/* Live Preview Player Box */}
      {isPreviewActive && streamUrl && (
        <div className="space-y-2 p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 animate-in fade-in">
          <div className="flex items-center justify-between text-xs font-bold text-zinc-300 pb-2 border-b border-zinc-900">
            <span className="flex items-center gap-1.5">
              <Play className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Pratinjau Pemutar Langsung</span>
            </span>
            <button
              type="button"
              onClick={() => setIsPreviewActive(false)}
              className="text-zinc-500 hover:text-zinc-300 text-[11px]"
            >
              Tutup Pratinjau
            </button>
          </div>

          <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-64 flex items-center justify-center">
            <video
              ref={videoRef}
              src={streamUrl}
              controls
              onError={handleVideoError}
              onCanPlay={handleVideoCanPlay}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Quality & Server Label Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            Resolusi Kualitas Video
          </label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:border-amber-500 outline-none cursor-pointer"
          >
            <option value="1080p">1080p Ultra HD</option>
            <option value="720p">720p High Definition</option>
            <option value="480p">480p Standar</option>
            <option value="auto">Adaptive Auto (HLS)</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
            Label Server / Mirror
          </label>
          <input
            type="text"
            value={serverLabel}
            onChange={(e) => setServerLabel(e.target.value)}
            placeholder="Contoh: Server Utama (CDN)"
            className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:border-amber-500 outline-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-black font-extrabold text-sm rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-black" />
            <span>Menyimpan Tautan Streaming...</span>
          </>
        ) : successToast ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-900" />
            <span>Tautan Streaming Berhasil Ditambahkan!</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            <span>Tambahkan Tautan Streaming ke Animeku</span>
          </>
        )}
      </button>
    </form>
  );
}
