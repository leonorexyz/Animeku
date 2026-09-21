"use client";

import React, { useState } from "react";
import {
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HardDrive,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Clock,
  X,
  Lock,
  Layers,
} from "lucide-react";

export interface DriveAccountStatus {
  email: string;
  name: string;
  avatarUrl?: string;
  connectedSince: string;
  lastSynced: string;
  totalSpaceGb: number;
  usedAnimeGb: number;
  usedOtherGb: number;
  linkedFoldersCount: number;
  linkedEpisodesCount: number;
  tokenStatus: "valid" | "expiring_soon" | "expired";
}

interface DriveStatusCardProps {
  status?: DriveAccountStatus;
  isConnected: boolean;
  onConnect: () => void;
  onDisconnect: (removeIndexFromCatalog: boolean) => void;
  onManualSync?: () => Promise<void> | void;
  className?: string;
}

const DEFAULT_DRIVE_STATUS: DriveAccountStatus = {
  email: "animeku.collection@gmail.com",
  name: "Animeku Cloud Storage",
  connectedSince: "12 Januari 2024",
  lastSynced: "5 menit yang lalu",
  totalSpaceGb: 100,
  usedAnimeGb: 38.4,
  usedOtherGb: 6.8,
  linkedFoldersCount: 4,
  linkedEpisodesCount: 83,
  tokenStatus: "valid",
};

export default function DriveStatusCard({
  status = DEFAULT_DRIVE_STATUS,
  isConnected,
  onConnect,
  onDisconnect,
  onManualSync,
  className = "",
}: DriveStatusCardProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [removeIndexChecked, setRemoveIndexChecked] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    if (onManualSync) {
      await onManualSync();
    } else {
      await new Promise((r) => setTimeout(r, 1200));
    }
    setIsSyncing(false);
    setSyncToast("Sinkronisasi folder Google Drive berhasil!");
    setTimeout(() => setSyncToast(null), 3000);
  };

  const handleConfirmDisconnect = () => {
    onDisconnect(removeIndexChecked);
    setShowDisconnectModal(false);
  };

  const freeSpaceGb = Math.max(
    0,
    status.totalSpaceGb - status.usedAnimeGb - status.usedOtherGb
  );
  const animePercentage = (status.usedAnimeGb / status.totalSpaceGb) * 100;
  const otherPercentage = (status.usedOtherGb / status.totalSpaceGb) * 100;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Toast Alert */}
      {syncToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-zinc-900 border border-emerald-500/60 text-white text-xs font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Main Status Container */}
      <div className="bg-zinc-950/70 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-6">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-900">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/30 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-md">
              <Cloud className="w-6 h-6" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">
                  Google Drive Cloud
                </span>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Terhubung
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[11px] font-bold">
                    Terputus
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                {isConnected ? status.email : "Tidak ada akun Drive yang terhubung"}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  title="Sinkronkan ulang folder Drive"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-blue-400" : "text-zinc-400"}`}
                  />
                  <span>{isSyncing ? "Menyinkronkan..." : "Sinkronkan"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDisconnectModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
                  title="Putuskan sambungan Google Drive"
                >
                  Putuskan
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onConnect}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Cloud className="w-4 h-4" />
                <span>Hubungkan Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Detailed Stats (If connected) */}
        {isConnected && (
          <div className="space-y-5">
            {/* Storage Quota Multi-bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                  <span>Penggunaan Kapasitas Drive</span>
                </span>
                <span className="text-zinc-400">
                  <strong className="text-white">
                    {(status.usedAnimeGb + status.usedOtherGb).toFixed(1)} GB
                  </strong>{" "}
                  dari {status.totalSpaceGb} GB
                </span>
              </div>

              {/* Multi-segment Progress Bar */}
              <div className="h-2.5 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{ width: `${animePercentage}%` }}
                  title={`Anime: ${status.usedAnimeGb} GB`}
                />
                <div
                  className="bg-zinc-600 h-full transition-all"
                  style={{ width: `${otherPercentage}%` }}
                  title={`Lainnya: ${status.usedOtherGb} GB`}
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Anime ({status.usedAnimeGb} GB)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  <span>File Lain ({status.usedOtherGb} GB)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span>Tersedia ({freeSpaceGb.toFixed(1)} GB)</span>
                </span>
              </div>
            </div>

            {/* Quick Metrics 3-Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1">
                <span className="text-zinc-500 text-[11px] font-medium block">
                  Folder Tersinkron
                </span>
                <span className="text-base font-black text-white">
                  {status.linkedFoldersCount} Folder
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1">
                <span className="text-zinc-500 text-[11px] font-medium block">
                  Total Episode Video
                </span>
                <span className="text-base font-black text-emerald-400">
                  {status.linkedEpisodesCount} Episode
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs space-y-1">
                <span className="text-zinc-500 text-[11px] font-medium block">
                  Sinkron Terakhir
                </span>
                <span className="text-xs font-bold text-zinc-300">
                  {status.lastSynced}
                </span>
              </div>
            </div>

            {/* OAuth Security & Direct Stream Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-blue-600/5 border border-blue-500/20 text-xs">
              <div className="flex items-center gap-2 text-zinc-300">
                <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Token OAuth aman, otorisasi hanya untuk folder anime terpilih.</span>
              </div>
              <span className="text-emerald-400 font-bold text-[11px] hidden sm:inline">
                API Terverifikasi
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Putuskan Sambungan Google Drive?
                </h3>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Berkas video di akun Google Drive Anda <strong>tidak akan terhapus</strong>,
                  namun video streaming yang berasal dari Drive ini tidak dapat diputar
                  sampai akun disambungkan kembali.
                </p>
              </div>
            </div>

            {/* Checkbox option */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={removeIndexChecked}
                onChange={(e) => setRemoveIndexChecked(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-red-600 rounded"
              />
              <span>
                Hapus juga entri anime Google Drive ini dari katalog lokal saya
              </span>
            </label>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer"
              >
                Ya, Putuskan Sambungan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
