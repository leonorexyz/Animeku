"use client";

import React, { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { MOCK_SETTINGS, AppSettings } from "@/data/mockSettings";
import { useTheme, ThemeMode } from "@/context/ThemeContext";
import {
  Palette,
  PlaySquare,
  HardDrive,
  User,
  Check,
  RotateCcw,
  Save,
  Moon,
  Sun,
  Monitor,
  Film,
  Volume2,
  Subtitles,
  Gauge,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ChevronRight,
  Info,
} from "lucide-react";

export default function SettingsPage() {
  const { theme: globalTheme, setTheme: setGlobalTheme, resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<"appearance" | "player" | "storage" | "profile">("appearance");
  const [settings, setSettings] = useState<AppSettings>({
    ...MOCK_SETTINGS,
    theme: (globalTheme as any) || "netflix",
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      showToast("Pengaturan berhasil disimpan!");
    }, 600);
  };

  const handleReset = () => {
    if (confirm("Kembalikan semua preferensi ke pengaturan awal pabrik?")) {
      setSettings(MOCK_SETTINGS);
      showToast("Pengaturan telah direset ke nilai default.");
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white pb-20 md:pb-0">
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-28 pb-16">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">
              <span>Konfigurasi Personal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              Pengaturan Aplikasi
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              Sesuaikan preferensi tampilan tema, kualitas pemutar video, penyimpanan, dan sinkronisasi data.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-800 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Reset ke setelan bawaan"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold transition-all shadow-md shadow-red-600/30 flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation & Content Container */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-8">
          {/* Left: Tab Sidebar */}
          <aside className="md:col-span-1 space-y-1.5">
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                activeTab === "appearance"
                  ? "bg-red-600/15 text-red-500 border border-red-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <Palette className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Tampilan</div>
                <div className="text-[11px] font-normal text-zinc-500">Tema & kartu anime</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("player")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                activeTab === "player"
                  ? "bg-red-600/15 text-red-500 border border-red-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <PlaySquare className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Pemutar Video</div>
                <div className="text-[11px] font-normal text-zinc-500">Kualitas & subtitle</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("storage")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                activeTab === "storage"
                  ? "bg-red-600/15 text-red-500 border border-red-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <HardDrive className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Sumber & Memori</div>
                <div className="text-[11px] font-normal text-zinc-500">Cache & Drive sync</div>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer text-left ${
                activeTab === "profile"
                  ? "bg-red-600/15 text-red-500 border border-red-500/30 shadow-sm"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
              }`}
            >
              <User className="w-4 h-4 shrink-0" />
              <div className="flex-1">
                <div>Profil & Cadangan</div>
                <div className="text-[11px] font-normal text-zinc-500">Akun & ekspor data</div>
              </div>
            </button>
          </aside>

          {/* Right: Tab Panels */}
          <section className="md:col-span-3">
            {/* 1. Tab Tampilan */}
            {activeTab === "appearance" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Section: Tema Tampilan */}
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Palette className="w-4 h-4 text-red-500" />
                      Tema Aplikasi
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Pilih palet kontras antarmuka yang paling nyaman untuk mata Anda saat streaming.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      {
                        id: "netflix",
                        label: "Netflix Dark",
                        desc: "Hitam sinematik dengan aksen merah Netflix.",
                        icon: Moon,
                      },
                      {
                        id: "light",
                        label: "Mode Terang",
                        desc: "Latar putih bersih dengan kontras tinggi untuk siang hari.",
                        icon: Sun,
                      },
                      {
                        id: "oled",
                        label: "OLED Pitch Black",
                        desc: "Hitam pekat 100% tanpa backlight, hemat baterai.",
                        icon: Moon,
                      },
                      {
                        id: "system",
                        label: "Sistem (Otomatis)",
                        desc: "Menyesuaikan dengan preferensi perangkat OS Anda.",
                        icon: Monitor,
                      },
                    ].map((themeOpt) => {
                      const IconComponent = themeOpt.icon;
                      const isSelected = (globalTheme || settings.theme) === themeOpt.id;
                      return (
                        <div
                          key={themeOpt.id}
                          onClick={() => {
                            setGlobalTheme(themeOpt.id as ThemeMode);
                            setSettings({ ...settings, theme: themeOpt.id as any });
                            showToast(`Tema diubah ke ${themeOpt.label}`);
                          }}
                          className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-red-500 bg-red-950/20 shadow-lg shadow-red-900/20"
                              : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <IconComponent className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-bold text-white">{themeOpt.label}</span>
                            </div>
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400">{themeOpt.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section: Ukuran Kartu Anime */}
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Film className="w-4 h-4 text-red-500" />
                      Ukuran Kartu Poster Anime
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Atur skala visual kartu di rak beranda dan halaman eksplorasi.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "small", label: "Ringkas (Kecil)", desc: "Menampilkan lebih banyak judul sekaligus" },
                      { id: "medium", label: "Standar (Sedang)", desc: "Keseimbangan proporsional Netflix" },
                      { id: "large", label: "Besar (Lebar)", desc: "Detail poster lebih tajam dan jelas" },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        onClick={() => setSettings({ ...settings, cardSize: sz.id as any })}
                        className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          settings.cardSize === sz.id
                            ? "border-red-500 bg-red-950/20 text-white"
                            : "border-zinc-800 hover:border-zinc-700 text-zinc-400 bg-zinc-900/40"
                        }`}
                      >
                        <div className="text-xs font-bold text-white mb-1">{sz.label}</div>
                        <div className="text-[10px] text-zinc-400">{sz.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section: Tampilan Tambahan */}
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md divide-y divide-zinc-800">
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Auto-Play Cuplikan Hero Banner</div>
                      <div className="text-xs text-zinc-400">Putar animasi trailer otomatis saat menelusuri beranda</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.heroBannerAutoPlay}
                        onChange={(e) => setSettings({ ...settings, heroBannerAutoPlay: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Bahasa Antarmuka</div>
                      <div className="text-xs text-zinc-400">Bahasa teks navigasi dan label metadata</div>
                    </div>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                      className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                    >
                      <option value="id">Bahasa Indonesia</option>
                      <option value="en">English (US)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Tab Pemutar Video */}
            {activeTab === "player" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Resolusi & Subtitle */}
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-5">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <PlaySquare className="w-4 h-4 text-red-500" />
                    Preferensi Audio & Video
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Kualitas Video Bawaan
                      </label>
                      <select
                        value={settings.defaultQuality}
                        onChange={(e) => setSettings({ ...settings, defaultQuality: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="auto">Otomatis (Adaptif Bandwidth)</option>
                        <option value="1080p">1080p FHD (Tertinggi)</option>
                        <option value="720p">720p HD (Seimbang)</option>
                        <option value="480p">480p SD (Hemat Kuota)</option>
                        <option value="360p">360p Rendah</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                        Track Subtitle Utama
                      </label>
                      <select
                        value={settings.defaultSubtitle}
                        onChange={(e) => setSettings({ ...settings, defaultSubtitle: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700 text-xs text-white focus:outline-none focus:border-red-500 cursor-pointer"
                      >
                        <option value="id">Bahasa Indonesia</option>
                        <option value="en">English</option>
                        <option value="none">Nonaktifkan Subtitle Bawaan</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Kecepatan Pemutaran Favorit ({settings.playbackSpeed}x)
                    </label>
                    <div className="flex items-center gap-2">
                      {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
                        <button
                          key={spd}
                          type="button"
                          onClick={() => setSettings({ ...settings, playbackSpeed: spd })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            settings.playbackSpeed === spd
                              ? "bg-red-600 text-white shadow-sm"
                              : "bg-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Otomasi Pemutaran */}
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md divide-y divide-zinc-800">
                  <div className="flex items-center justify-between pb-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Lanjut Episode Otomatis (Auto-Next)</div>
                      <div className="text-xs text-zinc-400">
                        Otomatis memutar episode selanjutnya ketika tontonan selesai
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoPlayNext}
                        onChange={(e) => setSettings({ ...settings, autoPlayNext: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Ingat Posisi Terakhir (Resume)</div>
                      <div className="text-xs text-zinc-400">
                        Melanjutkan pemutaran video dari detik terakhir Anda berhenti
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.resumePlayback}
                        onChange={(e) => setSettings({ ...settings, resumePlayback: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div>
                      <div className="text-sm font-semibold text-white">Tombol Lompat Intro (Skip Intro)</div>
                      <div className="text-xs text-zinc-400">
                        Durasi lompatan default saat menekan tombol lewati lagu pembuka ({settings.skipIntroSeconds} detik)
                      </div>
                    </div>
                    <input
                      type="number"
                      min={10}
                      max={180}
                      value={settings.skipIntroSeconds}
                      onChange={(e) => setSettings({ ...settings, skipIntroSeconds: Number(e.target.value) || 85 })}
                      className="w-20 px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white text-center focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. Tab Sumber & Penyimpanan */}
            {activeTab === "storage" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-emerald-400" />
                        Sinkronisasi Google Drive & Sumber Cloud
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Pindai dan perbarui episode baru secara berkala dari folder drive yang terhubung.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      Aktif
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                      <div>
                        <div className="text-xs font-bold text-white">Auto-Sinkronisasi Folder</div>
                        <div className="text-[10px] text-zinc-400">Jalankan di latar belakang</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.autoSyncDrive}
                          onChange={(e) => setSettings({ ...settings, autoSyncDrive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>

                    <div className="p-3.5 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">Interval Pengecekan</div>
                        <div className="text-[10px] text-zinc-400">Setiap {settings.syncIntervalHours} Jam Sekali</div>
                      </div>
                      <select
                        value={settings.syncIntervalHours}
                        onChange={(e) => setSettings({ ...settings, syncIntervalHours: Number(e.target.value) })}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-xs text-white"
                      >
                        <option value={1}>1 Jam</option>
                        <option value={3}>3 Jam</option>
                        <option value={6}>6 Jam</option>
                        <option value={12}>12 Jam</option>
                        <option value={24}>24 Jam</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Manajemen Memori & Cache */}
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    Penyimpanan Cache & Thumbnail
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Katalog dan gambar anime disimpan dalam memori lokal browser untuk kecepatan pemuatan instan.
                  </p>

                  <div className="p-4 rounded-xl bg-zinc-800/40 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">Ukuran Cache Saat Ini</div>
                      <div className="text-[11px] text-zinc-400">~ 24.8 MB terpakai dari kuota 500 MB</div>
                    </div>
                    <button
                      onClick={() => showToast("Cache dan riwayat offline berhasil dibersihkan.")}
                      className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                    >
                      Bersihkan Cache
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Tab Profil & Data */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Informasi Akun */}
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-red-500" />
                    Profil Pengguna
                  </h3>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-zinc-700">
                      AK
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-sm font-bold text-white">{settings.userName}</div>
                      <div className="text-xs text-zinc-400">{settings.userEmail}</div>
                      <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> Akun Aktif Personal
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Nama Tampilan</label>
                      <input
                        type="text"
                        value={settings.userName}
                        onChange={(e) => setSettings({ ...settings, userName: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-400 mb-1">Email Cadangan</label>
                      <input
                        type="email"
                        value={settings.userEmail}
                        onChange={(e) => setSettings({ ...settings, userEmail: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Ekspor & Impor Data */}
                <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Download className="w-4 h-4 text-sky-400" />
                    Cadangan Data Koleksi & Riwayat
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Amankan daftar anime favorit, progres tontonan, dan kategori khusus Anda dalam format berkas JSON.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => showToast("Berkas cadangan Animeku_backup.json berhasil diunduh!")}
                      className="p-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-sky-400 font-bold text-xs mb-1">
                        <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        Ekspor Data (Backup)
                      </div>
                      <div className="text-[11px] text-zinc-400">Unduh data katalog & preferensi ke komputer</div>
                    </button>

                    <button
                      onClick={() => showToast("Fitur impor: Silakan pilih berkas JSON cadangan Anda.")}
                      className="p-4 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/60 text-left transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs mb-1">
                        <Upload className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                        Impor Data (Restore)
                      </div>
                      <div className="text-[11px] text-zinc-400">Pulihkan katalog dari berkas backup sebelumnya</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-zinc-900 border border-red-500/40 text-white text-xs font-semibold shadow-2xl shadow-black/80 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <Check className="w-4 h-4 text-red-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
