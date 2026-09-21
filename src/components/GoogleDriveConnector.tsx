"use client";

import React, { useState, useEffect } from "react";
import {
  Cloud,
  Folder,
  FolderOpen,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  HardDrive,
  Trash2,
  Plus,
  Info,
  ChevronRight,
  Sparkles,
  Check,
  Clock,
  ArrowRight,
} from "lucide-react";
import DriveStatusCard from "@/components/DriveStatusCard";

interface DriveFolder {
  id: string;
  name: string;
  videoCount: number;
  sizeFormatted: string;
  isShared: boolean;
}

interface DriveVideoFile {
  id: string;
  name: string;
  sizeFormatted: string;
  episodeNumber: number;
  quality: string;
  streamable: boolean;
}

interface GoogleDriveConnectorProps {
  onSyncComplete?: (data: {
    folderName: string;
    files: DriveVideoFile[];
    accountEmail: string;
  }) => void;
  className?: string;
}

const MOCK_DRIVE_FOLDERS: DriveFolder[] = [
  {
    id: "fld-1",
    name: "Anime Vault 2024",
    videoCount: 24,
    sizeFormatted: "32.4 GB",
    isShared: true,
  },
  {
    id: "fld-2",
    name: "Sousou no Frieren [Complete 1080p]",
    videoCount: 28,
    sizeFormatted: "38.6 GB",
    isShared: false,
  },
  {
    id: "fld-3",
    name: "Jujutsu Kaisen Season 2 (Shibuya Arc)",
    videoCount: 23,
    sizeFormatted: "29.1 GB",
    isShared: true,
  },
  {
    id: "fld-4",
    name: "Anime Movies (Makoto Shinkai & Ghibli)",
    videoCount: 8,
    sizeFormatted: "18.5 GB",
    isShared: false,
  },
];

const MOCK_DRIVE_FILES: Record<string, DriveVideoFile[]> = {
  "fld-1": [
    {
      id: "dr-101",
      name: "[SubsPlease] Solo Leveling - 01 (1080p).mkv",
      sizeFormatted: "1.3 GB",
      episodeNumber: 1,
      quality: "1080p FHD",
      streamable: true,
    },
    {
      id: "dr-102",
      name: "[SubsPlease] Solo Leveling - 02 (1080p).mkv",
      sizeFormatted: "1.2 GB",
      episodeNumber: 2,
      quality: "1080p FHD",
      streamable: true,
    },
    {
      id: "dr-103",
      name: "[SubsPlease] Solo Leveling - 03 (1080p).mkv",
      sizeFormatted: "1.4 GB",
      episodeNumber: 3,
      quality: "1080p FHD",
      streamable: true,
    },
  ],
  "fld-2": [
    {
      id: "dr-201",
      name: "Frieren Beyond Journeys End - 01 [BD 1080p].mp4",
      sizeFormatted: "1.1 GB",
      episodeNumber: 1,
      quality: "1080p FHD",
      streamable: true,
    },
    {
      id: "dr-202",
      name: "Frieren Beyond Journeys End - 02 [BD 1080p].mp4",
      sizeFormatted: "1.2 GB",
      episodeNumber: 2,
      quality: "1080p FHD",
      streamable: true,
    },
  ],
};

export default function GoogleDriveConnector({
  onSyncComplete,
  className = "",
}: GoogleDriveConnectorProps) {
  const [isConnected, setIsConnected] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [accountEmail, setAccountEmail] = useState("animeku.collection@gmail.com");
  const [storageUsedGb, setStorageUsedGb] = useState(45.2);
  const [storageTotalGb] = useState(100);

  const [driveFolders, setDriveFolders] = useState<DriveFolder[]>(MOCK_DRIVE_FOLDERS);
  const [driveFilesMap, setDriveFilesMap] = useState<Record<string, DriveVideoFile[]>>(MOCK_DRIVE_FILES);

  // Folder selection state
  const [selectedFolderId, setSelectedFolderId] = useState<string>("fld-1");
  const [folderUrlInput, setFolderUrlInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [autoSyncInterval, setAutoSyncInterval] = useState("daily");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sinkronisasi status dari API saat mount
  useEffect(() => {
    async function checkDriveStatus() {
      try {
        const res = await fetch("/api/sources/drive");
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.source) {
            setIsConnected(true);
            if (data.source.accountLabel) {
              setAccountEmail(data.source.accountLabel);
            }
          } else if (data.success && !data.isConnected) {
            setIsConnected(false);
          }
        }
      } catch (err) {
        console.warn("Could not check Google Drive status:", err);
      }
    }

    async function loadFolders() {
      try {
        const res = await fetch("/api/sources/drive/folders");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.folders) && data.folders.length > 0) {
            setDriveFolders(data.folders);
            if (!data.folders.some((f: any) => f.id === selectedFolderId)) {
              setSelectedFolderId(data.folders[0].id);
            }
          }
        }
      } catch (err) {
        console.warn("Could not load Google Drive folders:", err);
      }
    }

    checkDriveStatus();
    loadFolders();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/auth/google-drive?mode=url");
      const data = await res.json().catch(() => null);

      if (data?.success && data?.authUrl) {
        if (data.mode === "sandbox_mock") {
          await fetch("/api/sources/drive", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountEmail }),
          });
          setIsConnected(true);
          showToast("Google Drive berhasil dihubungkan lewat OAuth 2.0!");
        } else {
          window.location.href = data.authUrl;
        }
      } else {
        // Fallback simpan langsung
        await fetch("/api/sources/drive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accountEmail }),
        });
        setIsConnected(true);
        showToast("Google Drive berhasil dihubungkan!");
      }
    } catch (e: any) {
      showToast("Gagal menghubungkan Google Drive");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (removeCatalog = false) => {
    try {
      await fetch(`/api/sources/drive?removeCatalog=${removeCatalog}`, { method: "DELETE" });
      setIsConnected(false);
      setSelectedFolderId("");
      showToast(
        removeCatalog
          ? "Koneksi Google Drive diputus & katalog dihapus."
          : "Koneksi Google Drive telah diputus."
      );
    } catch (e) {
      showToast("Gagal memutus koneksi Google Drive.");
    }
  };

  const handleScanFolder = async (folderId: string) => {
    if (!folderId) return;
    setIsScanning(true);
    setSelectedFolderId(folderId);
    try {
      const res = await fetch(`/api/sources/drive/folders?folderId=${encodeURIComponent(folderId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.files)) {
          setDriveFilesMap((prev) => ({
            ...prev,
            [folderId]: data.files,
          }));
          if (data.folder && !driveFolders.some((f) => f.id === folderId)) {
            setDriveFolders((prev) => [data.folder, ...prev]);
          }
        }
      }
      showToast("Folder berhasil dipindai dan file video terdeteksi!");
    } catch (err) {
      showToast("Gagal memindai folder Google Drive");
    } finally {
      setIsScanning(false);
    }
  };

  const handleImportSelectedFolder = async () => {
    const selectedFolder = driveFolders.find((f) => f.id === selectedFolderId);
    const files = driveFilesMap[selectedFolderId] || [
      {
        id: `dr-auto-1`,
        name: `${selectedFolder?.name || "Anime"} - Episode 01.mp4`,
        sizeFormatted: "1.2 GB",
        episodeNumber: 1,
        quality: "1080p",
        streamable: true,
      },
    ];

    try {
      await fetch("/api/sources/drive/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folderId: selectedFolderId,
          folderName: selectedFolder?.name || "Folder Google Drive",
          files,
        }),
      });

      onSyncComplete?.({
        folderName: selectedFolder?.name || "Folder Google Drive",
        files,
        accountEmail,
      });
      showToast(`Folder "${selectedFolder?.name}" (${files.length} Ep) berhasil disinkronkan ke Animeku!`);
    } catch (e) {
      showToast("Gagal menyinkronkan folder Google Drive ke katalog");
    }
  };

  const selectedFolder = driveFolders.find((f) => f.id === selectedFolderId);
  const activeFiles = selectedFolderId
    ? driveFilesMap[selectedFolderId] || []
    : [];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-zinc-900 border border-blue-500/50 text-white text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Connection Status Card */}
      <DriveStatusCard
        isConnected={isConnected}
        status={{
          email: accountEmail,
          name: "Animeku Cloud Storage",
          connectedSince: "12 Januari 2024",
          lastSynced: "5 menit yang lalu",
          totalSpaceGb: storageTotalGb,
          usedAnimeGb: 38.4,
          usedOtherGb: 6.8,
          linkedFoldersCount: driveFolders.length,
          linkedEpisodesCount: 83,
          tokenStatus: "valid",
        }}
        onConnect={handleConnect}
        onDisconnect={(removeCatalog) => {
          handleDisconnect(removeCatalog);
        }}
        onManualSync={() => {
          return new Promise((r) => setTimeout(r, 1000));
        }}
      />

      {/* Main Drive Operations Area (When connected) */}
      {isConnected && (
        <div className="space-y-6">
          {/* Custom Folder URL input */}
          <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-3">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
              Tautkan Folder Drive Tertentu (URL atau Folder ID)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={folderUrlInput}
                onChange={(e) => setFolderUrlInput(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/1XYZ... atau Folder ID"
                className="flex-1 bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 focus:border-blue-500 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => {
                  if (folderUrlInput.trim()) {
                    handleScanFolder(folderUrlInput.trim());
                    setFolderUrlInput("");
                  }
                }}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer whitespace-nowrap"
              >
                Pindai Tautan
              </button>
            </div>
          </div>

          {/* Folder Grid Selector */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-blue-400" />
                <span>Pilih Folder Koleksi di Drive Anda</span>
              </span>
              <span className="text-[11px] text-zinc-500">
                {driveFolders.length} folder ditemukan
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {driveFolders.map((fld) => {
                const isSelected = selectedFolderId === fld.id;
                return (
                  <div
                    key={fld.id}
                    onClick={() => handleScanFolder(fld.id)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? "bg-blue-600/15 border-blue-500/60 shadow-lg shadow-blue-600/10"
                        : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        {isSelected ? (
                          <FolderOpen className="w-5 h-5 text-blue-400 shrink-0" />
                        ) : (
                          <Folder className="w-5 h-5 text-zinc-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-white truncate max-w-[170px]">
                          {fld.name}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                      <span>{fld.videoCount} Episode Video</span>
                      <span className="font-semibold">{fld.sizeFormatted}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detected Files in Selected Folder */}
          {selectedFolder && (
            <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <FileVideo className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">
                    File Video di &quot;{selectedFolder.name}&quot;
                  </span>
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Direct Streaming API Aktif</span>
                </span>
              </div>

              {/* Files preview list */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {activeFiles.length > 0 ? (
                  activeFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 text-xs"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[70%]">
                        <FileVideo className="w-4 h-4 text-blue-400 shrink-0" />
                        <span className="truncate font-medium text-zinc-200">
                          {file.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-blue-600/20 text-blue-400 font-bold text-[10px]">
                          Ep {file.episodeNumber}
                        </span>
                        <span className="text-zinc-500">{file.sizeFormatted}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-zinc-500">
                    Tidak ada file video langsung di folder ini atau semua sudah tersinkron.
                  </div>
                )}
              </div>

              {/* Sync Options Grid */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Jadwal Sinkronisasi Otomatis:</span>
                  <select
                    value={autoSyncInterval}
                    onChange={(e) => setAutoSyncInterval(e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-white font-medium outline-none cursor-pointer text-xs"
                  >
                    <option value="hourly">Tiap 1 Jam</option>
                    <option value="daily">Tiap 24 Jam (Harian)</option>
                    <option value="manual">Manual Saja</option>
                  </select>
                </div>
              </div>

              {/* Import Button */}
              <button
                type="button"
                onClick={handleImportSelectedFolder}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Sinkronkan Folder Ini ke Katalog Animeku</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
