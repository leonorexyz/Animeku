"use client";

import React, { useState, useEffect } from "react";
import {
  HardDrive,
  Cloud,
  Globe,
  CheckCircle2,
  XCircle,
  Unlink,
  RefreshCw,
  AlertTriangle,
  Film,
  Layers,
  ExternalLink,
  Check,
} from "lucide-react";

export interface ConnectedSourceItem {
  id: string;
  provider: "drive" | "local" | "link" | string;
  name: string;
  accountLabel: string | null;
  isConnected: boolean;
  connectedAt: string | null;
  animeCount: number;
  episodesCount: number;
  description: string;
  badge: string;
  supportsDisconnect: boolean;
}

interface ConnectedSourcesListProps {
  onNotification?: (message: string) => void;
}

export default function ConnectedSourcesList({ onNotification }: ConnectedSourcesListProps) {
  const [sources, setSources] = useState<ConnectedSourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [targetSource, setTargetSource] = useState<ConnectedSourceItem | null>(null);
  const [removeCatalog, setRemoveCatalog] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Fetch sources
  const loadSources = async () => {
    try {
      const res = await fetch("/api/sources", { cache: "no-store" });
      const data = await res.json();
      if (data.success && Array.isArray(data.sources)) {
        setSources(data.sources);
      }
    } catch (err) {
      console.error("Gagal mengambil data sumber terhubung:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSources();
  };

  const openDisconnectModal = (source: ConnectedSourceItem) => {
    setTargetSource(source);
    setRemoveCatalog(false);
    setDisconnectModalOpen(true);
  };

  const handleConfirmDisconnect = async () => {
    if (!targetSource) return;

    setIsDisconnecting(true);
    try {
      if (targetSource.provider === "drive") {
        const res = await fetch("/api/sources/drive/disconnect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ removeCatalog }),
        });
        const data = await res.json();

        if (data.success) {
          onNotification?.(
            data.message || "Sambungan Google Drive berhasil diputus."
          );
        } else {
          onNotification?.("Gagal memutus sambungan: " + (data.error || "Terjadi kesalahan"));
        }
      } else {
        onNotification?.("Sumber ini merupakan default sistem dan tidak dapat dinonaktifkan.");
      }
    } catch (err: any) {
      console.error("Disconnect error:", err);
      onNotification?.("Terjadi kesalahan jaringan saat memutus sambungan.");
    } finally {
      setIsDisconnecting(false);
      setDisconnectModalOpen(false);
      setTargetSource(null);
      loadSources();
    }
  };

  const getSourceIcon = (provider: string) => {
    switch (provider) {
      case "drive":
        return <Cloud className="w-6 h-6 text-blue-400" />;
      case "local":
        return <HardDrive className="w-6 h-6 text-emerald-400" />;
      case "link":
      default:
        return <Globe className="w-6 h-6 text-violet-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-zinc-800/80">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            Daftar Sumber Terhubung
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Kelola akun cloud storage, penyimpanan lokal, dan umpan streaming video eksternal.
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing || loading}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-red-500" : ""}`} />
          <span>Perbarui Status</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800 animate-pulse flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-zinc-800"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
                <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-4 sm:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Left Info */}
              <div className="flex items-start gap-3.5">
                <div className="p-3 rounded-xl bg-zinc-800/70 border border-zinc-700/60 shrink-0">
                  {getSourceIcon(src.provider)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{src.name}</h4>
                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] text-zinc-400 font-medium">
                      {src.badge}
                    </span>
                    {src.isConnected ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Terhubung
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-[10px] font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
                        Tidak Terhubung
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-400 max-w-xl line-clamp-2">
                    {src.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-zinc-400 pt-1">
                    {src.accountLabel && (
                      <span className="text-zinc-300 font-medium">
                        Akun / Lokasi: <span className="text-white">{src.accountLabel}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Film className="w-3 h-3 text-red-500" />
                      {src.animeCount} Anime
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3 h-3 text-amber-500" />
                      {src.episodesCount} Episode
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Action */}
              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {src.provider === "drive" && (
                  <>
                    {src.isConnected ? (
                      <button
                        onClick={() => openDisconnectModal(src)}
                        className="px-3.5 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Putus sambungan Google Drive"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                        <span>Putus Sambungan</span>
                      </button>
                    ) : (
                      <a
                        href="/drive"
                        className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-red-600/20"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Hubungkan Drive</span>
                      </a>
                    )}
                  </>
                )}

                {src.provider === "local" && (
                  <span className="text-[11px] text-zinc-500 bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-700/50">
                    Sistem Internal
                  </span>
                )}

                {src.provider === "link" && (
                  <span className="text-[11px] text-zinc-500 bg-zinc-800/60 px-3 py-1.5 rounded-xl border border-zinc-700/50">
                    Sistem Internal
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {disconnectModalOpen && targetSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Putus Sambungan Sumber?</h3>
                <p className="text-xs text-zinc-400">
                  Anda akan memutuskan akun {targetSource.name}.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/50 text-xs text-zinc-300 space-y-2">
              <div className="font-semibold text-white">Dampak pemutusan:</div>
              <ul className="list-disc list-inside space-y-1 text-zinc-400 text-[11px]">
                <li>Token otentikasi Google Drive akan dihapus dari sistem.</li>
                <li>Penyinkronan otomatis folder video drive akan dihentikan.</li>
                <li>Anda dapat menghubungkan kembali akun kapan saja melalui menu Drive.</li>
              </ul>
            </div>

            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-800/40 border border-zinc-800 hover:bg-zinc-800/70 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={removeCatalog}
                onChange={(e) => setRemoveCatalog(e.target.checked)}
                className="mt-0.5 rounded border-zinc-700 bg-zinc-800 text-red-600 focus:ring-red-500"
              />
              <span className="text-xs text-zinc-300">
                Hapus juga seluruh anime dan episode yang bersumber dari Drive dari katalog aplikasi ({targetSource.animeCount} anime).
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDisconnectModalOpen(false);
                  setTargetSource(null);
                }}
                disabled={isDisconnecting}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/30 cursor-pointer disabled:opacity-50"
              >
                {isDisconnecting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Memutus...</span>
                  </>
                ) : (
                  <>
                    <Unlink className="w-3.5 h-3.5" />
                    <span>Ya, Putus Sambungan</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
