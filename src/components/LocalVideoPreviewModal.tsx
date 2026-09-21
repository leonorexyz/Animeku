"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Play,
  Pause,
  Camera,
  Maximize2,
  Volume2,
  VolumeX,
  Info,
  Film,
  Check,
  Sparkles,
  FileVideo,
  Clock,
  HardDrive,
} from "lucide-react";

interface LocalVideoPreviewModalProps {
  file: File | null;
  filename?: string;
  isOpen: boolean;
  onClose: () => void;
  onCaptureThumbnail?: (thumbnailDataUrl: string) => void;
}

export default function LocalVideoPreviewModal({
  file,
  filename,
  isOpen,
  onClose,
  onCaptureThumbnail,
}: LocalVideoPreviewModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoDimensions, setVideoDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);
  const [capturedToast, setCapturedToast] = useState(false);

  // Generate object URL for file
  useEffect(() => {
    if (!isOpen || !file) {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
        setVideoUrl(null);
      }
      return;
    }

    const url = URL.createObjectURL(file);
    setVideoUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isOpen]);

  // Keyboard shortcut: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !file) return null;

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
      setVideoDimensions({
        width: videoRef.current.videoWidth || 0,
        height: videoRef.current.videoHeight || 0,
      });
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleCaptureFrame = () => {
    if (!videoRef.current) return;
    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setCapturedThumbnail(dataUrl);
        setCapturedToast(true);
        onCaptureThumbnail?.(dataUrl);
        setTimeout(() => setCapturedToast(false), 2500);
      }
    } catch (err) {
      console.error("Gagal mengambil snapshot frame video:", err);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const displayName = filename || file.name;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/60">
          <div className="flex items-center gap-2.5 truncate max-w-[80%]">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
              <Film className="w-4 h-4" />
            </div>
            <div className="truncate">
              <h3 className="text-sm font-bold text-white truncate">
                Pratinjau Video Lokal
              </h3>
              <p className="text-xs text-zinc-400 truncate">{displayName}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Tutup Pratinjau (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Player Display Area */}
        <div className="relative bg-black flex items-center justify-center min-h-[300px] sm:min-h-[420px] overflow-hidden group">
          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              controls
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full max-h-[55vh] object-contain"
            />
          ) : (
            <div className="text-zinc-500 text-xs flex items-center gap-2">
              <Clock className="w-4 h-4 animate-spin" />
              <span>Memuat berkas video lokal...</span>
            </div>
          )}

          {/* Quick Capture Floating Button */}
          <button
            type="button"
            onClick={handleCaptureFrame}
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/75 hover:bg-zinc-900 text-white text-xs font-semibold border border-white/20 backdrop-blur-md transition-all shadow-lg hover:scale-105 cursor-pointer"
            title="Ambil frame saat ini sebagai gambar sampul episode"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>Ambil Thumbnail Frame</span>
          </button>

          {/* Toast Notification on Capture */}
          {capturedToast && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 bg-emerald-600/90 text-white font-bold text-xs rounded-full shadow-2xl backdrop-blur-md animate-in fade-in flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Gambar frame berhasil disalin sebagai thumbnail!</span>
            </div>
          )}
        </div>

        {/* Video Info & Controls Bar */}
        <div className="p-5 bg-zinc-900/40 border-t border-zinc-800/80 space-y-4">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
              {formatFileSize(file.size)}
            </span>

            {videoDimensions.width > 0 && (
              <span className="px-2.5 py-1 rounded-md bg-red-600/15 border border-red-500/30 text-red-400 font-bold">
                {videoDimensions.width} × {videoDimensions.height} (
                {videoDimensions.height >= 1080
                  ? "1080p FHD"
                  : videoDimensions.height >= 720
                  ? "720p HD"
                  : "SD"}
                )
              </span>
            )}

            {duration > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 font-medium">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Durasi: {formatSeconds(duration)}
              </span>
            )}

            <span className="px-2 py-1 rounded-md bg-zinc-800/80 text-zinc-400 text-[11px] font-mono uppercase">
              {file.type || file.name.split(".").pop()}
            </span>
          </div>

          {/* Captured Thumbnail Preview (if any) */}
          {capturedThumbnail && (
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800">
              <img
                src={capturedThumbnail}
                alt="Cuplikan Frame"
                className="w-16 h-10 object-cover rounded-lg border border-zinc-700"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">
                  Thumbnail Episode Siap Digunakan
                </span>
                <span className="text-[11px] text-zinc-400">
                  Frame cuplikan akan otomatis dipasang pada episode ini saat disimpan.
                </span>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              <span>Video diputar langsung secara lokal tanpa memakan kuota internet.</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs rounded-xl border border-white/10 transition-colors cursor-pointer"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
