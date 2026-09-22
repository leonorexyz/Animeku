"use client";

import React, { useState } from "react";
import { AppSettings, MOCK_SETTINGS } from "@/data/mockSettings";
import {
  PlaySquare,
  Volume2,
  Subtitles,
  Gauge,
  RotateCcw,
  Check,
  FastForward,
  Sparkles,
  Tv,
  Layers,
} from "lucide-react";

interface PlayerPreferencesPanelProps {
  settings: AppSettings;
  onChange: (updated: Partial<AppSettings>) => void;
  onReset?: () => void;
}

export default function PlayerPreferencesPanel({
  settings,
  onChange,
  onReset,
}: PlayerPreferencesPanelProps) {
  const [resetConfirm, setResetConfirm] = useState(false);

  const handleReset = () => {
    if (onReset) {
      onReset();
    } else {
      onChange({
        defaultQuality: MOCK_SETTINGS.defaultQuality,
        defaultSubtitle: MOCK_SETTINGS.defaultSubtitle,
        playbackSpeed: MOCK_SETTINGS.playbackSpeed,
        autoPlayNext: MOCK_SETTINGS.autoPlayNext,
        skipIntroSeconds: MOCK_SETTINGS.skipIntroSeconds,
        resumePlayback: MOCK_SETTINGS.resumePlayback,
      });
    }
    setResetConfirm(false);
  };

  return (
    <div className="space-y-6">
      {/* Resolusi & Kualitas Streaming */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tv className="w-4 h-4 text-red-500" />
              Kualitas Video & Resolusi Utama
            </h3>
            <p className="text-xs text-zinc-400 mt-1">
              Resolusi target yang otomatis dipilih setiap kali Anda memutar video anime baru.
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-red-600/10 text-red-400 border border-red-500/20 text-[11px] font-bold">
            {settings.defaultQuality.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { id: "auto", label: "Auto", desc: "Adaptif Jaringan" },
            { id: "1080p", label: "1080p", desc: "Full HD Jernih" },
            { id: "720p", label: "720p", desc: "HD Seimbang" },
            { id: "480p", label: "480p", desc: "Hemat Kuota" },
            { id: "360p", label: "360p", desc: "Koneksi Lambat" },
          ].map((q) => {
            const isSelected = settings.defaultQuality === q.id;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onChange({ defaultQuality: q.id as any })}
                className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                  isSelected
                    ? "border-red-500 bg-red-950/30 text-white shadow-md shadow-red-900/20"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400"
                }`}
              >
                <div className="text-xs font-bold text-white mb-0.5">{q.label}</div>
                <div className="text-[10px] text-zinc-400">{q.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtitle & Bahasa Teks */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Subtitles className="w-4 h-4 text-red-500" />
            Preferensi Subtitle Bawaan
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Bahasa takarir otomatis yang diaktifkan pertama kali saat streaming dibuka.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: "id", label: "Bahasa Indonesia", desc: "Takarir resmi terjemahan Indonesia" },
            { id: "en", label: "English", desc: "English official translation" },
            { id: "none", label: "Nonaktifkan", desc: "Tonton video tanpa subtitle otomatis" },
          ].map((sub) => {
            const isSelected = settings.defaultSubtitle === sub.id;
            return (
              <button
                key={sub.id}
                type="button"
                onClick={() => onChange({ defaultSubtitle: sub.id as any })}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "border-red-500 bg-red-950/20 text-white"
                    : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 text-zinc-400"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{sub.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-red-500 stroke-[3]" />}
                </div>
                <div className="text-[10px] text-zinc-400">{sub.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kecepatan Putar & Tombol Lompat Intro */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Gauge className="w-4 h-4 text-red-500" />
          Kecepatan Putar & Navigasi Intro
        </h3>

        <div>
          <label className="block text-xs font-semibold text-zinc-300 mb-2">
            Kecepatan Pemutaran Standar ({settings.playbackSpeed}x)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {[0.75, 1.0, 1.25, 1.5, 2.0].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => onChange({ playbackSpeed: spd })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  settings.playbackSpeed === spd
                    ? "bg-red-600 text-white shadow-md shadow-red-600/30 scale-105"
                    : "bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Skip Intro Settings */}
        <div className="pt-2 border-t border-zinc-800">
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Durasi Lompat Intro Lagu Pembuka (Skip Intro)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={10}
              max={180}
              value={settings.skipIntroSeconds}
              onChange={(e) => onChange({ skipIntroSeconds: Number(e.target.value) || 85 })}
              className="w-24 px-3.5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs text-white text-center font-bold focus:outline-none focus:border-red-500"
            />
            <span className="text-xs text-zinc-400">detik</span>

            <div className="flex items-center gap-1.5 ml-auto">
              {[60, 85, 90].map((presetSec) => (
                <button
                  key={presetSec}
                  type="button"
                  onClick={() => onChange({ skipIntroSeconds: presetSec })}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                    settings.skipIntroSeconds === presetSec
                      ? "bg-red-600/20 text-red-400 border border-red-500/30"
                      : "bg-zinc-800/80 text-zinc-400 hover:text-white"
                  }`}
                >
                  {presetSec}s
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-1.5">
            Lagu anime pembuka (TV size) umumnya berdurasi 85–90 detik.
          </p>
        </div>
      </div>

      {/* Otomasi Pemutaran (Toggles) */}
      <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 shadow-md divide-y divide-zinc-800">
        <div className="flex items-center justify-between pb-4">
          <div>
            <div className="text-sm font-semibold text-white">Lanjut Episode Otomatis (Auto-Next)</div>
            <div className="text-xs text-zinc-400">
              Otomatis memutar episode berikutnya ketika episode saat ini telah selesai.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.autoPlayNext}
              onChange={(e) => onChange({ autoPlayNext: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between pt-4">
          <div>
            <div className="text-sm font-semibold text-white">Lanjutkan Posisi Terakhir (Resume Playback)</div>
            <div className="text-xs text-zinc-400">
              Melanjutkan video dari menit/detik terakhir Anda berhenti menonton.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.resumePlayback}
              onChange={(e) => onChange({ resumePlayback: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
          </label>
        </div>
      </div>

      {/* Panel Reset Khusus Pemutar */}
      <div className="p-5 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
            Reset Preferensi Pemutar Saja
          </div>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Mengembalikan kualitas (1080p), takarir (Indonesia), kecepatan (1.0x), dan auto-next ke default.
          </p>
        </div>

        {resetConfirm ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors shadow-sm cursor-pointer"
            >
              Ya, Reset Pemutar
            </button>
            <button
              type="button"
              onClick={() => setResetConfirm(false)}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setResetConfirm(true)}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Preferensi Pemutar</span>
          </button>
        )}
      </div>
    </div>
  );
}