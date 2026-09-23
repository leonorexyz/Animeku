"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocalFileImporter from "@/components/LocalFileImporter";
import GoogleDriveConnector from "@/components/GoogleDriveConnector";
import DirectStreamLinkImporter from "@/components/DirectStreamLinkImporter";
import MetadataMatcherModal, { AnimeCandidate } from "@/components/MetadataMatcherModal";
import {
  HardDrive,
  Cloud,
  Link2,
  FolderUp,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Trash2,
  RefreshCw,
  Sparkles,
  Plus,
  ArrowRight,
  ExternalLink,
  Sliders,
  Check,
  Film,
  Layers,
  Info,
  Clock,
  X,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface ConnectedSourceItem {
  id: string;
  name: string;
  type: "local" | "drive" | "link";
  details: string;
  itemCount: number;
  lastSynced: string;
  status: "active" | "syncing" | "error";
}

const INITIAL_SOURCES: ConnectedSourceItem[] = [
  {
    id: "src-1",
    name: "Folder Anime Lokal (D:/Anime/Series)",
    type: "local",
    details: "12 Serial • 148 File Video (.mp4, .mkv)",
    itemCount: 12,
    lastSynced: "Baru saja",
    status: "active",
  },
  {
    id: "src-2",
    name: "Google Drive (animeku.collection@gmail.com)",
    type: "drive",
    details: "Shared Folder: /Anime Vault 2024",
    itemCount: 8,
    lastSynced: "1 jam yang lalu",
    status: "active",
  },
  {
    id: "src-3",
    name: "Direct Stream CDN Mirror",
    type: "link",
    details: "HTTP Live Stream (HLS & Direct MP4)",
    itemCount: 15,
    lastSynced: "Kemarin",
    status: "active",
  },
];

export default function AddSourcePage() {
  const [activeTab, setActiveTab] = useState<"local" | "drive" | "link">("local");
  const [sources, setSources] = useState<ConnectedSourceItem[]>(INITIAL_SOURCES);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMetadataMatcher, setShowMetadataMatcher] = useState(false);
  const [globalError, setGlobalError] = useState<{
    title: string;
    message: string;
    onRetry?: () => void;
  } | null>(null);
  const [isSavingProgress, setIsSavingProgress] = useState(false);
  const [saveStepText, setSaveStepText] = useState("");
  const [saveStepProgress, setSaveStepProgress] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Form State: Local File/Folder
  const [localPath, setLocalPath] = useState("D:/Anime/Series");
  const [detectedLocalFiles, setDetectedLocalFiles] = useState<
    { name: string; size: string; ep: number }[]
  >([
    { name: "[SubsPlease] Frieren - 01 (1080p).mkv", size: "1.2 GB", ep: 1 },
    { name: "[SubsPlease] Frieren - 02 (1080p).mkv", size: "1.1 GB", ep: 2 },
    { name: "[SubsPlease] Frieren - 03 (1080p).mkv", size: "1.3 GB", ep: 3 },
  ]);

  // Form State: Google Drive
  const [driveConnected, setDriveConnected] = useState(true);
  const [driveFolderUrl, setDriveFolderUrl] = useState(
    "https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ"
  );
  const [driveAccount, setDriveAccount] = useState("animeku.collection@gmail.com");

  // Form State: Direct Link
  const [streamUrl, setStreamUrl] = useState("");
  const [streamTitle, setStreamTitle] = useState("");
  const [streamEpisode, setStreamEpisode] = useState("1");
  const [streamQuality, setStreamQuality] = useState("1080p");

  // Auto-Match Metadata
  const [autoMatchMetadata, setAutoMatchMetadata] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const executeWithProgress = (
    steps: { label: string; pct: number }[],
    onFinish: () => void,
    retryCallback?: () => void
  ) => {
    setGlobalError(null);
    setIsSavingProgress(true);
    let stepIndex = 0;

    const runStep = () => {
      if (stepIndex < steps.length) {
        setSaveStepText(steps[stepIndex].label);
        setSaveStepProgress(steps[stepIndex].pct);
        stepIndex++;
        setTimeout(runStep, 400);
      } else {
        setIsSavingProgress(false);
        setSaveStepProgress(100);
        onFinish();
      }
    };

    runStep();
  };

  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const mapped = files.map((f, idx) => {
        const sizeMb = (f.size / (1024 * 1024)).toFixed(1);
        const sizeStr = f.size > 1024 * 1024 * 1024
          ? `${(f.size / (1024 * 1024 * 1024)).toFixed(1)} GB`
          : `${sizeMb} MB`;
        return {
          name: f.name,
          size: sizeStr,
          ep: idx + 1,
        };
      });
      setDetectedLocalFiles(mapped);
      showToast(`${files.length} file video lokal berhasil dipilih!`);
    }
  };

  const handleAddLocalSource = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newSource: ConnectedSourceItem = {
        id: `src-${Date.now()}`,
        name: `Folder Lokal (${localPath})`,
        type: "local",
        details: `${detectedLocalFiles.length} file terdeteksi`,
        itemCount: 1,
        lastSynced: "Baru saja",
        status: "active",
      };
      setSources([newSource, ...sources]);
      showToast("Sumber folder lokal berhasil ditambahkan ke katalog!");
    }, 800);
  };

  const handleAddDriveSource = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newSource: ConnectedSourceItem = {
        id: `src-${Date.now()}`,
        name: `Google Drive (${driveAccount})`,
        type: "drive",
        details: "Sinkronisasi folder cloud otomatis",
        itemCount: 5,
        lastSynced: "Baru saja",
        status: "active",
      };
      setSources([newSource, ...sources]);
      showToast("Folder Google Drive berhasil dihubungkan!");
    }, 800);
  };

  const handleAddLinkSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!streamUrl.trim() || !streamTitle.trim()) {
      showToast("Mohon isi URL streaming dan judul anime.");
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const newSource: ConnectedSourceItem = {
        id: `src-${Date.now()}`,
        name: `${streamTitle} (Episode ${streamEpisode})`,
        type: "link",
        details: `Direct Stream • ${streamQuality}`,
        itemCount: 1,
        lastSynced: "Baru saja",
        status: "active",
      };
      setSources([newSource, ...sources]);
      setStreamUrl("");
      setStreamTitle("");
      showToast("Tautan streaming anime berhasil ditambahkan!");
    }, 800);
  };

  const handleDeleteSource = (id: string) => {
    setSources(sources.filter((s) => s.id !== id));
    showToast("Sumber anime berhasil dilepas dari katalog.");
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white">
      <Navbar />

      {/* Hero Banner Header */}
      <div className="relative pt-28 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-zinc-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Multi-Source Anime Streaming</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Tambah Sumber Anime
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Hubungkan file anime dari hard drive komputer Anda, akun Google Drive,
              atau tautan streaming langsung untuk dinikmati dengan pemutar personal Netflix-style.
            </p>
          </div>

          {/* Quick Stats & Action Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowMetadataMatcher(true)}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500/20 to-rose-500/20 hover:from-amber-500/30 hover:to-rose-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-2xl text-xs font-bold transition-all shadow-lg hover:scale-105 cursor-pointer backdrop-blur-md"
              title="Buka alat pencocok judul dan poster resmi"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Rapikan Judul & Poster</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCancelModal(true)}
              className="flex items-center gap-2 px-3.5 py-3 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-2xl text-xs font-bold transition-all cursor-pointer backdrop-blur-md"
              title="Batalkan proses penambahan sumber"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Batal / Reset</span>
            </button>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center min-w-[100px] backdrop-blur-sm">
              <span className="text-2xl font-black text-red-500 block">
                {sources.length}
              </span>
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Sumber Aktif
              </span>
            </div>
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-center min-w-[100px] backdrop-blur-sm">
              <span className="text-2xl font-black text-emerald-400 block">
                {sources.reduce((acc, s) => acc + s.itemCount, 0)}
              </span>
              <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Judul Terhubung
              </span>
            </div>
          </div>
        </div>

        {/* Global Error Alert Banner */}
        {globalError && (
          <div className="mt-6 p-4 rounded-2xl bg-red-950/80 border border-red-500/50 flex items-start justify-between gap-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-red-200">{globalError.title}</h4>
                <p className="text-xs text-red-300/80 mt-1">{globalError.message}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {globalError.onRetry && (
                <button
                  type="button"
                  onClick={globalError.onRetry}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setGlobalError(null)}
                className="p-1.5 text-red-400 hover:text-white rounded-lg hover:bg-red-900/50 transition-colors cursor-pointer"
                title="Tutup Pesan Error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Global Save Progress Banner */}
        {isSavingProgress && (
          <div className="mt-6 p-4 rounded-2xl bg-zinc-900/90 border border-red-500/30 backdrop-blur-md animate-in fade-in space-y-3 shadow-xl">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 font-bold text-white">
                <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                <span>{saveStepText || "Menyimpan perubahan ke katalog..."}</span>
              </span>
              <span className="text-red-400 font-bold">{saveStepProgress}%</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${saveStepProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Floating Notification Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-red-500/50 text-white text-sm font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left Column (7 cols): Input & Source Form */}
          <div className="lg:col-span-7 space-y-6">
            {/* Source Type Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTab("local")}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "local"
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                <HardDrive className="w-4 h-4" />
                <span>File Lokal</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("drive")}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "drive"
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>Google Drive</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("link")}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeTab === "link"
                    ? "bg-red-600 text-white shadow-lg shadow-red-600/30"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }`}
              >
                <Link2 className="w-4 h-4" />
                <span>Link Streaming</span>
              </button>
            </div>

            {/* TAB 1: FILE & FOLDER LOKAL */}
            {activeTab === "local" && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-6 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-red-500" />
                    <h2 className="text-lg font-bold text-white">
                      Impor File & Folder Lokal
                    </h2>
                  </div>
                  <span className="text-xs text-zinc-400 bg-zinc-800/80 px-2.5 py-1 rounded-full border border-white/5">
                    MP4, MKV, WebM
                  </span>
                </div>

                <LocalFileImporter
                  onImportComplete={(imported) => {
                    executeWithProgress(
                      [
                        { label: "Membaca header dan metadata file lokal...", pct: 30 },
                        { label: "Menyusun nomor urut episode dan thumbnail...", pct: 70 },
                        { label: "Menyimpan ke katalog koleksi...", pct: 95 },
                      ],
                      () => {
                        const newSource: ConnectedSourceItem = {
                          id: `src-${Date.now()}`,
                          name: `Koleksi Lokal: ${imported.animeTitle}`,
                          type: "local",
                          details: `${imported.files.length} episode berhasil diimpor`,
                          itemCount: 1,
                          lastSynced: "Baru saja",
                          status: "active",
                        };
                        setSources((prev) => [newSource, ...prev]);
                        showToast(
                          `Serial "${imported.animeTitle}" (${imported.files.length} Ep) berhasil ditambahkan ke katalog!`
                        );
                      }
                    );
                  }}
                />
              </div>
            )}

            {/* TAB 2: GOOGLE DRIVE */}
            {activeTab === "drive" && (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-6 backdrop-blur-sm animate-in fade-in duration-200">
                <GoogleDriveConnector
                  onSyncComplete={(synced) => {
                    executeWithProgress(
                      [
                        { label: "Menyambungkan token Google Drive OAuth 2.0...", pct: 30 },
                        { label: `Memindai direktori folder "${synced.folderName}"...`, pct: 65 },
                        { label: "Mendaftarkan tautan streaming cloud...", pct: 95 },
                      ],
                      () => {
                        const newSource: ConnectedSourceItem = {
                          id: `src-${Date.now()}`,
                          name: `Google Drive: ${synced.folderName}`,
                          type: "drive",
                          details: `${synced.files.length} episode disinkronkan (${synced.accountEmail})`,
                          itemCount: 1,
                          lastSynced: "Baru saja",
                          status: "active",
                        };
                        setSources((prev) => [newSource, ...prev]);
                        showToast(`Folder Drive "${synced.folderName}" berhasil ditambahkan ke katalog!`);
                      }
                    );
                  }}
                />
              </div>
            )}

            {/* TAB 3: LINK STREAMING LANGSUNG */}
            {activeTab === "link" && (
              <DirectStreamLinkImporter
                onAddStream={(stream) => {
                  executeWithProgress(
                    [
                      { label: "Menguji ketersediaan endpoint video...", pct: 35 },
                      { label: `Memverifikasi stream "${stream.title}" (${stream.quality})...`, pct: 75 },
                      { label: "Mendaftarkan link video langsung ke database...", pct: 95 },
                    ],
                    () => {
                      const newSource: ConnectedSourceItem = {
                        id: `src-${Date.now()}`,
                        name: `${stream.title} (Ep ${stream.episodeNumber})`,
                        type: "link",
                        details: `Direct Stream • ${stream.quality} • ${stream.serverLabel}`,
                        itemCount: 1,
                        lastSynced: "Baru saja",
                        status: "active",
                      };
                      setSources((prev) => [newSource, ...prev]);
                      showToast(`Tautan streaming "${stream.title}" (Ep ${stream.episodeNumber}) berhasil ditambahkan!`);
                    }
                  );
                }}
              />
            )}
          </div>

          {/* Right Column (5 cols): Connected Sources Management */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-500" />
                  <h3 className="text-base font-bold text-white">
                    Daftar Sumber Terhubung
                  </h3>
                </div>
                <span className="text-xs text-zinc-400">
                  {sources.length} Sumber
                </span>
              </div>

              {/* Source Items List */}
              <div className="space-y-3">
                {sources.map((src) => (
                  <div
                    key={src.id}
                    className="p-4 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        {src.type === "local" && (
                          <HardDrive className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        {src.type === "drive" && (
                          <Cloud className="w-4 h-4 text-blue-400 shrink-0" />
                        )}
                        {src.type === "link" && (
                          <Link2 className="w-4 h-4 text-amber-400 shrink-0" />
                        )}
                        <h4 className="font-bold text-xs sm:text-sm text-white truncate max-w-[200px]">
                          {src.name}
                        </h4>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteSource(src.id)}
                        className="p-1 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Hapus Sumber"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {src.details}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-900 text-[11px] text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>Sinkron: {src.lastSynced}</span>
                      </div>
                      <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Aktif
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Help & Documentation Card */}
              <div className="p-4 rounded-xl bg-red-600/5 border border-red-500/20 text-xs text-zinc-300 space-y-2 mt-4">
                <div className="flex items-center gap-1.5 font-bold text-red-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tips Menata File Anime</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Gunakan penamaan standar seperti <code>Judul - 01.mkv</code> agar pemutar dapat mengurutkan episode secara berurutan dan mengunduh subtitle otomatis.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-semibold mt-1"
                >
                  <span>Kembali ke Beranda</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Batalkan Proses Tambah Sumber?
                </h3>
                <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed">
                  Semua input atau pemilihan berkas yang belum disimpan akan dikosongkan. Tindakan ini tidak menghapus sumber anime yang sudah terdaftar sebelumnya.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Kembali Mengedit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCancelModal(false);
                  setGlobalError(null);
                  showToast("Proses tambah sumber telah dibatalkan & di-reset.");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metadata Matcher Modal (Rapikan Judul & Poster) */}
      <MetadataMatcherModal
        isOpen={showMetadataMatcher}
        onClose={() => setShowMetadataMatcher(false)}
        onApplyMetadata={(cand) => {
          showToast(`Metadata & poster resmi untuk "${cand.title}" berhasil diterapkan!`);
        }}
      />

      <Footer />
    </div>
  );
}
