"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Upload,
  FolderUp,
  FileVideo,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Sparkles,
  ArrowUpDown,
  Plus,
  RefreshCw,
  Film,
  HardDrive,
  Info,
  Layers,
  Check,
  X,
  Play,
} from "lucide-react";

export interface ParsedVideoFile {
  id: string;
  file: File;
  name: string;
  sizeFormatted: string;
  detectedTitle: string;
  episodeNumber: number;
  seasonNumber: number;
  quality: string;
  selected: boolean;
}

interface LocalFileImporterProps {
  onImportComplete?: (data: {
    animeTitle: string;
    files: ParsedVideoFile[];
  }) => void;
  existingAnimeTitles?: string[];
  className?: string;
}

/**
 * Utilitas regex untuk mem-parsing nama berkas video anime umum
 * Contoh: "[SubsPlease] Solo Leveling - 02 (1080p) [ABCD1234].mkv"
 */
export function parseAnimeFilename(filename: string): {
  title: string;
  episodeNumber: number;
  seasonNumber: number;
  quality: string;
} {
  // Buang ekstensi
  const nameWithoutExt = filename.replace(/\.(mp4|mkv|webm|avi|mov|ts)$/i, "");

  // Deteksi kualitas resolusi
  const qualityMatch = nameWithoutExt.match(/(1080p|720p|480p|2160p|4k)/i);
  const quality = qualityMatch ? qualityMatch[1].toLowerCase() : "1080p";

  // Hilangkan tag rilis seperti [SubsPlease], [Erai-raws], dsb di awal
  let cleanName = nameWithoutExt.replace(/^\[[^\]]+\]\s*/, "");
  // Hilangkan hash atau info di kurung siku di akhir
  cleanName = cleanName.replace(/\s*\[[^\]]+\]$/, "");

  // Deteksi Season jika ada (misal S02, S2, Season 2)
  let seasonNumber = 1;
  const seasonMatch = cleanName.match(/(?:S|Season\s*)(\d+)/i);
  if (seasonMatch) {
    seasonNumber = parseInt(seasonMatch[1], 10);
  }

  // Deteksi Episode (misal "- 01", "E01", "Episode 1", " 01 ")
  let episodeNumber = 1;
  const epMatch = cleanName.match(/(?:[-_\s]|ep|episode|e)\s*0*(\d{1,4})(?:\s*v\d+)?(?:\s*\(|$|\s)/i);
  if (epMatch) {
    episodeNumber = parseInt(epMatch[1], 10);
  }

  // Ambil Judul Bersih
  let title = cleanName
    .replace(/(?:[-_\s]+)?(?:ep|episode|e)?\s*0*\d{1,4}.*$/i, "")
    .replace(/(?:S|Season\s*)\d+.*/i, "")
    .replace(/[_\.]/g, " ")
    .trim();

  if (!title) {
    title = cleanName;
  }

  return { title, episodeNumber, seasonNumber, quality };
}

export default function LocalFileImporter({
  onImportComplete,
  existingAnimeTitles = [],
  className = "",
}: LocalFileImporterProps) {
  const [dragOver, setDragOver] = useState(false);
  const [parsedFiles, setParsedFiles] = useState<ParsedVideoFile[]>([]);
  const [targetTitle, setTargetTitle] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const processFiles = (files: File[]) => {
    const videoExtensions = [".mp4", ".mkv", ".webm", ".avi", ".mov", ".ts"];
    const validFiles = files.filter((f) =>
      videoExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
    );

    if (validFiles.length === 0) return;

    let autoTitle = targetTitle;

    const parsedList: ParsedVideoFile[] = validFiles.map((file, idx) => {
      const parsed = parseAnimeFilename(file.name);
      if (!autoTitle && idx === 0) {
        autoTitle = parsed.title;
      }

      const sizeMb = file.size / (1024 * 1024);
      const sizeFormatted =
        sizeMb >= 1024
          ? `${(sizeMb / 1024).toFixed(1)} GB`
          : `${sizeMb.toFixed(0)} MB`;

      return {
        id: `file-${Date.now()}-${idx}-${file.name}`,
        file,
        name: file.name,
        sizeFormatted,
        detectedTitle: parsed.title,
        episodeNumber: parsed.episodeNumber,
        seasonNumber: parsed.seasonNumber,
        quality: parsed.quality,
        selected: true,
      };
    });

    // Urutkan default berdasarkan nomor episode
    parsedList.sort((a, b) => a.episodeNumber - b.episodeNumber);

    setParsedFiles((prev) => [...prev, ...parsedList]);
    if (!targetTitle && autoTitle) {
      setTargetTitle(autoTitle);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  }, [targetTitle]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const handleToggleSelectAll = (select: boolean) => {
    setParsedFiles((prev) => prev.map((f) => ({ ...f, selected: select })));
  };

  const handleToggleSelect = (id: string) => {
    setParsedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const handleUpdateEpisodeNumber = (id: string, newEp: number) => {
    setParsedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, episodeNumber: newEp } : f))
    );
  };

  const handleRemoveFile = (id: string) => {
    setParsedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSortByEpisode = () => {
    setParsedFiles((prev) =>
      [...prev].sort((a, b) => a.episodeNumber - b.episodeNumber)
    );
  };

  const handleSortByName = () => {
    setParsedFiles((prev) =>
      [...prev].sort((a, b) => a.name.localeCompare(b.name))
    );
  };

  const handleExecuteImport = () => {
    const selectedFiles = parsedFiles.filter((f) => f.selected);
    if (selectedFiles.length === 0) return;

    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setImportSuccess(true);
      onImportComplete?.({
        animeTitle: targetTitle || "Anime Koleksi Lokal",
        files: selectedFiles,
      });
      setTimeout(() => {
        setImportSuccess(false);
        setParsedFiles([]);
        setTargetTitle("");
      }, 2500);
    }, 1200);
  };

  const selectedCount = parsedFiles.filter((f) => f.selected).length;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Drag and Drop Box */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all ${
          dragOver
            ? "border-red-500 bg-red-500/10 scale-[1.01]"
            : "border-zinc-800 hover:border-zinc-700 bg-zinc-950/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/x-matroska,video/webm,video/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
        {/* Hidden Folder Picker */}
        <input
          ref={folderInputRef}
          type="file"
          // @ts-ignore
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-red-500 shadow-xl group-hover:scale-105 transition-transform">
            <FolderUp className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Tarik & Letakkan File atau Folder Anime ke Sini
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Mendukung format video MP4, MKV, WebM, dan AVI beresolusi hingga 4K.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2"
            >
              <FileVideo className="w-4 h-4" />
              <span>Pilih File Video</span>
            </button>

            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs rounded-xl border border-white/10 hover:border-white/20 transition-all cursor-pointer flex items-center gap-2"
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Pilih Satu Folder Penuh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Title and Detected Files */}
      {parsedFiles.length > 0 && (
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-5 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Target Anime Title Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Judul Seri Anime</span>
            </label>
            <input
              type="text"
              value={targetTitle}
              onChange={(e) => setTargetTitle(e.target.value)}
              placeholder="Contoh: Sousou no Frieren"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-4 py-3 text-sm font-semibold text-white focus:border-red-500 outline-none transition-colors"
            />
          </div>

          {/* Action Bar: Sort & Bulk Select */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-800/80 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-zinc-300">
                {selectedCount} dari {parsedFiles.length} file dipilih
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(true)}
                  className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  Pilih Semua
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleSelectAll(false)}
                  className="px-2 py-1 rounded bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  Lepas
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSortByEpisode}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>Urut No. Episode</span>
              </button>
              <button
                type="button"
                onClick={handleSortByName}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white font-medium cursor-pointer"
              >
                <span>Urut Nama File</span>
              </button>
            </div>
          </div>

          {/* Files List Table */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {parsedFiles.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border text-xs transition-all ${
                  item.selected
                    ? "bg-zinc-950/80 border-zinc-800 text-zinc-200"
                    : "bg-zinc-950/30 border-zinc-900 text-zinc-500 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 truncate max-w-[60%] sm:max-w-[70%]">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={() => handleToggleSelect(item.id)}
                    className="w-4 h-4 accent-red-600 rounded cursor-pointer shrink-0"
                  />
                  <FileVideo className="w-4 h-4 text-red-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold block truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {item.sizeFormatted} • {item.quality}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1">
                    <span className="text-zinc-500 text-[10px] font-bold">Ep</span>
                    <input
                      type="number"
                      min="1"
                      value={item.episodeNumber}
                      onChange={(e) =>
                        handleUpdateEpisodeNumber(
                          item.id,
                          parseInt(e.target.value, 10) || 1
                        )
                      }
                      className="w-10 bg-transparent text-white font-bold text-center outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Hapus dari daftar"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Execute Button */}
          <button
            type="button"
            disabled={isImporting || selectedCount === 0}
            onClick={handleExecuteImport}
            className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl shadow-lg hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Membuat Entri Katalog Lokal...</span>
              </>
            ) : importSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Berhasil Diimpor ke Koleksi!</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Impor {selectedCount} Episode ke Animeku</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
