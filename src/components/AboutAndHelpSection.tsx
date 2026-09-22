"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  Info,
  BookOpen,
  Keyboard,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cloud,
  HardDrive,
  Tv,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  FolderOpen,
  Sliders,
  Heart,
  Play,
  RotateCcw,
} from "lucide-react";

interface GuideItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export default function AboutAndHelpSection() {
  const [openGuide, setOpenGuide] = useState<string | null>("guide-drive");
  const [activeFaq, setActiveFaq] = useState<string | null>(null);

  const toggleGuide = (id: string) => {
    setOpenGuide(openGuide === id ? null : id);
  };

  const toggleFaq = (id: string) => {
    setActiveFaq(activeFaq === id ? null : id);
  };

  const guides: GuideItem[] = [
    {
      id: "guide-drive",
      title: "1. Menghubungkan Google Drive untuk Koleksi Cloud",
      icon: <Cloud className="w-4 h-4 text-blue-400" />,
      content: (
        <div className="space-y-2 text-xs text-zinc-300">
          <p>
            Animeku memungkinkan Anda streaming langsung file anime yang tersimpan di Google Drive tanpa mengunduh seluruh file ke server:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-zinc-400">
            <li>
              Buka menu <strong className="text-zinc-200">Sumber Video &gt; Google Drive</strong> atau tab <strong className="text-zinc-200">Sumber & Memori</strong>.
            </li>
            <li>
              Klik tombol <strong className="text-zinc-200">Hubungkan Google Drive</strong> dan login dengan akun Google Anda yang menyimpan koleksi anime.
            </li>
            <li>
              Pilih folder utama anime Anda. Sistem akan memindai sub-folder judul anime dan episode video secara otomatis.
            </li>
            <li>
              Aktifkan opsi <strong className="text-zinc-200">Auto-Sinkronisasi</strong> agar episode baru otomatis terdeteksi saat Anda menambahkan file ke Google Drive.
            </li>
          </ol>
        </div>
      ),
    },
    {
      id: "guide-local",
      title: "2. Menambahkan Video dari Penyimpanan Lokal Server",
      icon: <HardDrive className="w-4 h-4 text-emerald-400" />,
      content: (
        <div className="space-y-2 text-xs text-zinc-300">
          <p>
            Jika Anda memiliki berkas video di disk lokal komputer/server:
          </p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 text-zinc-400">
            <li>
              Masuk ke halaman <strong className="text-zinc-200">Tambah Sumber &gt; File Lokal</strong>.
            </li>
            <li>
              Tarik atau pilih berkas video (<code className="text-rose-400">.mp4</code>, <code className="text-rose-400">.mkv</code>, <code className="text-rose-400">.webm</code>).
            </li>
            <li>
              Gunakan konvensi penamaan standar untuk deteksi otomatis judul dan nomor episode, contoh:
              <div className="mt-1 p-2 rounded bg-zinc-800 text-[11px] font-mono text-zinc-300">
                [Fansub] Frieren Beyond Journeys End - 01 [1080p].mp4
              </div>
            </li>
            <li>
              Metadata seperti sinopsis dan poster akan dicocokkan otomatis melalui database katalog.
            </li>
          </ol>
        </div>
      ),
    },
    {
      id: "guide-links",
      title: "3. Menggunakan Tautan Streaming Langsung (Direct Stream / HLS)",
      icon: <Tv className="w-4 h-4 text-violet-400" />,
      content: (
        <div className="space-y-2 text-xs text-zinc-300">
          <p>
            Anda juga dapat memasukkan tautan langsung video dari server CDN atau storage pihak ketiga:
          </p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400">
            <li>Dukungan stream video: URL langsung file <code className="text-zinc-300">.mp4</code>, <code className="text-zinc-300">.webm</code>, dan manifest <code className="text-zinc-300">.m3u8 (HLS)</code>.</li>
            <li>Dapat menyertakan opsi multi-resolusi (1080p, 720p, 480p) pada episode yang sama.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "guide-hotkeys",
      title: "4. Pintasan Keyboard (Hotkeys) Pemutar Video",
      icon: <Keyboard className="w-4 h-4 text-amber-400" />,
      content: (
        <div className="space-y-2 text-xs text-zinc-300">
          <p>Gunakan tombol pintasan berikut saat memutar episode untuk kendali instan:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <span className="text-zinc-300 font-medium">Putar / Jeda Video</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-200 text-[11px] font-mono">Spasi / K</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <span className="text-zinc-300 font-medium">Layar Penuh (Fullscreen)</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-200 text-[11px] font-mono">F</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <span className="text-zinc-300 font-medium">Bisu / Suara (Mute)</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-200 text-[11px] font-mono">M</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <span className="text-zinc-300 font-medium">Maju / Mundur 10 Detik</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-200 text-[11px] font-mono">← / →</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <span className="text-zinc-300 font-medium">Atur Volume Suara</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-200 text-[11px] font-mono">↑ / ↓</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <span className="text-zinc-300 font-medium">Lewati Intro (85 detik)</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-200 text-[11px] font-mono">S</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60">
              <span className="text-zinc-300 font-medium">Episode Berikutnya</span>
              <kbd className="px-2 py-0.5 rounded bg-zinc-700 text-zinc-200 text-[11px] font-mono">N</kbd>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const faqs = [
    {
      q: "Mengapa video dari Google Drive tidak dapat dimuat?",
      a: "Pastikan izin berbagi folder atau file video di Google Drive disetel ke 'Siapa saja yang memiliki tautan' atau pastikan otentikasi Google Drive Anda masih aktif di tab Sumber. Jika token kedaluwarsa, klik putus sambungan dan hubungkan ulang.",
    },
    {
      q: "Format video dan audio apa yang didukung?",
      a: "Format wadah video MP4, MKV, dan WebM didukung. Untuk kompatibilitas optimal di semua browser (Chrome, Firefox, Safari), gunakan codec video H.264 (AVC) atau H.265 dengan audio AAC.",
    },
    {
      q: "Bagaimana cara melanjutkan tontonan di perangkat lain?",
      a: "Progres tontonan dan riwayat episode disimpan di database server untuk akun Anda, sehingga Anda dapat melanjutkan tontonan secara mulus di perangkat manapun.",
    },
    {
      q: "Apakah data anime saya aman?",
      a: "Ya. Animeku Player dirancang sebagai platform streaming personal mandiri (self-hosted). Berkas video Anda tidak pernah dibagikan ke pihak ketiga.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & App Summary Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-red-950/30 border border-zinc-800/80 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 to-rose-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-red-600/30 ring-2 ring-red-500/20">
              A
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">Animeku Player</h3>
                <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Pemutar streaming anime personal dengan antarmuka sinematik Netflix.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700/60 text-zinc-300 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Versi Stabil
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Animeku Player dibuat untuk mengorganisir dan menyajikan koleksi anime personal Anda dari berbagai sumber,
          termasuk penyimpanan cloud Google Drive, berkas lokal komputer, dan tautan streaming langsung,
          lengkap dengan resume tontonan, favorit, dan pengaturan kategori rak beranda.
        </p>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
          <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/40 text-center">
            <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
              <Tv className="w-3.5 h-3.5 text-red-500" /> Netflix UI
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Tata letak beranda modern</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/40 text-center">
            <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-blue-400" /> Cloud & Local
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Multi-sumber fleksibel</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/40 text-center">
            <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" /> Favorit & Rak
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Kustomisasi urutan kategori</div>
          </div>

          <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/40 text-center">
            <div className="text-xs font-bold text-white flex items-center justify-center gap-1">
              <Play className="w-3.5 h-3.5 text-emerald-400" /> Smart Player
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Skip intro & resume</div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Quick Guides */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-red-500" />
            Panduan Singkat Penggunaan
          </h3>
          <span className="text-[11px] text-zinc-400">Klik panduan untuk membaca</span>
        </div>

        <div className="space-y-2.5">
          {guides.map((g) => {
            const isOpen = openGuide === g.id;
            return (
              <div
                key={g.id}
                className="rounded-xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleGuide(g.id)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-800/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {g.icon}
                    <span className="text-xs font-bold text-white">{g.title}</span>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 border-t border-zinc-800/60 animate-in fade-in duration-150">
                    {g.content}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Frequently Asked Questions (FAQ) */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          Pertanyaan Umum (FAQ) & Pemecahan Masalah
        </h3>

        <div className="space-y-2">
          {faqs.map((faq, idx) => {
            const faqId = `faq-${idx}`;
            const isOpen = activeFaq === faqId;
            return (
              <div
                key={faqId}
                className="rounded-xl bg-zinc-800/30 border border-zinc-800/70 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(faqId)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-800/50 transition-colors"
                >
                  <span className="text-xs font-semibold text-zinc-200">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0 ml-2" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 pb-3.5 pt-1 text-xs text-zinc-400 border-t border-zinc-800/60 leading-relaxed animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Footer Information & System Diagnostic */}
      <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-zinc-500" />
          <span>Animeku Player — Dikembangkan untuk streaming personal mandiri.</span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-zinc-500">
          <span>Lisensi: Personal Use</span>
          <span>•</span>
          <span>Status: Aktif</span>
        </div>
      </div>
    </div>
  );
}
