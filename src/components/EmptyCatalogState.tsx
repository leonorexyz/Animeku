"use client";

import React, { useRef, useState } from "react";
import {
  HardDrive,
  Cloud,
  Link as LinkIcon,
  Plus,
  FolderOpen,
  Sparkles,
  CheckCircle2,
  Film,
} from "lucide-react";

interface EmptyCatalogStateProps {
  onAddLocal?: (files: FileList) => void;
  onConnectDrive?: () => void;
  onAddLink?: (url: string, title: string) => void;
}

export default function EmptyCatalogState({
  onAddLocal,
  onConnectDrive,
  onAddLink,
}: EmptyCatalogStateProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [driveConnecting, setDriveConnecting] = useState(false);
  const [driveSuccess, setDriveSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (onAddLocal) {
        onAddLocal(e.target.files);
      } else {
        alert(
          `Berhasil memilih ${e.target.files.length} file video lokal:\n${Array.from(
            e.target.files
          )
            .map((f) => f.name)
            .join("\n")}`
        );
      }
    }
  };

  const handleDriveClick = () => {
    setDriveConnecting(true);
    setTimeout(() => {
      setDriveConnecting(false);
      setDriveSuccess(true);
      if (onConnectDrive) onConnectDrive();
      setTimeout(() => setDriveSuccess(false), 3000);
    }, 1200);
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;
    if (onAddLink) {
      onAddLink(linkUrl, linkTitle || "Anime Online");
    } else {
      alert(`Link anime ditambahkan: ${linkTitle || "Anime Baru"} (${linkUrl})`);
    }
    setLinkUrl("");
    setLinkTitle("");
    setShowLinkModal(false);
  };

  return (
    <div className="relative py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center animate-in fade-in duration-300">
      {/* Hidden File Picker Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/mp4,video/x-matroska,video/webm,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Hero Badge & Heading */}
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-6">
        <Sparkles className="w-3.5 h-3.5" />
        <span>Perpustakaan Anime Pribadi</span>
      </div>

      <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white mb-4">
        Koleksi Anime Kamu Masih Kosong
      </h2>

      <p className="text-zinc-400 text-sm sm:text-base max-w-2xl mx-auto mb-12 leading-relaxed">
        Animeku menyatukan semua sumber tontonanmu ke dalam satu katalog bergaya Netflix.
        Pilih salah satu sumber di bawah untuk mulai menonton koleksi favoritmu.
      </p>

      {/* 3 Source Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        {/* Source 1: File Lokal */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="group relative p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-red-500/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/60 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-lg">
              <HardDrive className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                Impor File Lokal
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Pilih file video (.mp4, .mkv) atau folder anime langsung dari komputer atau ponsel tanpa perlu upload.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300 group-hover:text-white">
            <span className="flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-red-500" />
              Buka File Explorer
            </span>
            <span className="text-red-400">Pilih →</span>
          </div>
        </div>

        {/* Source 2: Google Drive */}
        <div
          onClick={handleDriveClick}
          className="group relative p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-blue-500/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/60 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-lg">
              <Cloud className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                Sambung Google Drive
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Streaming langsung anime yang tersimpan di Google Drive kamu tanpa menguras penyimpanan lokal.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300 group-hover:text-white">
            <span className="flex items-center gap-1.5">
              {driveSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Cloud className="w-4 h-4 text-blue-400" />
              )}
              {driveConnecting
                ? "Menghubungkan..."
                : driveSuccess
                ? "Terhubung!"
                : "Google Drive"}
            </span>
            <span className="text-blue-400">
              {driveConnecting ? "..." : driveSuccess ? "✓" : "Hubungkan →"}
            </span>
          </div>
        </div>

        {/* Source 3: Link Streaming Online */}
        <div
          onClick={() => setShowLinkModal(true)}
          className="group relative p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 hover:border-purple-500/60 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-black/60 cursor-pointer flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-lg">
              <LinkIcon className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                Ambil dari Link URL
              </h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                Tempel link video langsung (.mp4, stream link, HLS) untuk segera diputar dalam antarmuka Netflix.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-300 group-hover:text-white">
            <span className="flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-400" />
              Input URL
            </span>
            <span className="text-purple-400">Tambah →</span>
          </div>
        </div>
      </div>

      {/* Link URL Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-zinc-900 rounded-2xl p-6 border border-zinc-700 shadow-2xl text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-purple-400" />
                Tambah Sumber Link Video
              </h3>
              <button
                onClick={() => setShowLinkModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLinkSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Judul Anime
                </label>
                <input
                  type="text"
                  placeholder="Misal: Hunter x Hunter"
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  URL Video (.mp4, .m3u8, direct stream)
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/video.mp4"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-600/30"
                >
                  Simpan & Putar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
