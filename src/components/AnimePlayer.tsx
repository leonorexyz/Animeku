"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume1,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Subtitles,
  ArrowLeft,
  SkipForward,
  Tv,
  ListVideo,
  X,
  Check,
  FastForward,
  Upload,
  HardDrive,
  FolderOpen,
  FileVideo,
  AlertCircle,
} from "lucide-react";
import { Anime } from "@/types/anime";
import { ExtendedEpisode } from "@/data/mockEpisodes";
import { saveWatchProgress, getWatchProgressForAnime } from "@/utils/watchProgress";
import { getStoredAppSettings } from "@/utils/appSettings";

interface AnimePlayerProps {
  anime: Anime;
  episodes: ExtendedEpisode[];
  initialEpisode?: ExtendedEpisode;
  onBack?: () => void;
}

export default function AnimePlayer({
  anime,
  episodes,
  initialEpisode,
  onBack,
}: AnimePlayerProps) {
  const currentEpisodesList = episodes.length > 0 ? episodes : [];
  const [currentEp, setCurrentEp] = useState<ExtendedEpisode>(
    initialEpisode || currentEpisodesList[0]
  );

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const lastSavedTimeRef = useRef<number>(0);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const previousVolumeRef = useRef(0.8);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Local file & error fallback state
  const [videoError, setVideoError] = useState<{
    type: "local_unreachable" | "playback_error";
    message: string;
  } | null>(null);
  const [localFileObjectUrl, setLocalFileObjectUrl] = useState<string | null>(null);
  const [localFilesCache, setLocalFilesCache] = useState<Map<number, File>>(new Map());
  const singleFileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Load volume preferences from localStorage
  useEffect(() => {
    try {
      const savedVol = localStorage.getItem("animeku_player_volume");
      const savedMuted = localStorage.getItem("animeku_player_muted");
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v)) {
          setVolume(v);
          if (v > 0) previousVolumeRef.current = v;
        }
      }
      if (savedMuted === "true") {
        setIsMuted(true);
      }

      // Terapkan preferensi pemutar dari pengaturan global aplikasi
      const appSettings = getStoredAppSettings();
      if (appSettings) {
        if (appSettings.playbackSpeed) {
          setPlaybackRate(appSettings.playbackSpeed);
        }
        if (appSettings.defaultSubtitle) {
          setSelectedSub(
            appSettings.defaultSubtitle === "none" ? "off" : appSettings.defaultSubtitle
          );
        }
        if (appSettings.autoPlayNext !== undefined) {
          setAutoplayNext(appSettings.autoPlayNext);
        }
      }
    } catch (e) {
      // Ignore localStorage access issues in sandbox
    }
  }, []);

  // Center feedback indicator (play, pause, skip)
  const [centerFeedback, setCenterFeedback] = useState<"play" | "pause" | "rewind" | "forward" | null>(null);

  // Scrubber Hover Tooltip
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState(0);

  // Settings & overlays
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [showAudioSubMenu, setShowAudioSubMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [selectedSub, setSelectedSub] = useState("id");
  const [selectedAudio, setSelectedAudio] = useState("ja");
  const [subSize, setSubSize] = useState<"sm" | "md" | "lg">("md");
  const [customSubName, setCustomSubName] = useState<string | null>(null);
  const subFileInputRef = useRef<HTMLInputElement>(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [nextEpCountdown, setNextEpCountdown] = useState<number | null>(null);
  const [autoplayNext, setAutoplayNext] = useState(true);

  // Subtitle & Audio options
  const subtitles = [
    { id: "off", label: "Nonaktif" },
    { id: "id", label: "Bahasa Indonesia (Resmi)" },
    { id: "en", label: "English" },
    { id: "ja-romaji", label: "Romaji / Karaoke" },
    ...(customSubName ? [{ id: "custom", label: `Kustom: ${customSubName}` }] : []),
  ];

  const [audioToast, setAudioToast] = useState<string | null>(null);
  const [resumeToast, setResumeToast] = useState<{ seconds: number } | null>(null);

  const audioTracks = [
    { id: "ja-51", label: "Jepang (Original Dolby 5.1)", badge: "JP 5.1" },
    { id: "ja-stereo", label: "Jepang (Stereo AAC)", badge: "JP 2.0" },
    { id: "en-dub", label: "English Dub (Stereo)", badge: "EN Dub" },
    { id: "id-dub", label: "Indonesia Dub (Stereo)", badge: "ID Dub" },
  ];

  const handleAudioChange = (aud: { id: string; label: string }) => {
    setSelectedAudio(aud.id);
    setShowAudioSubMenu(false);
    setAudioToast(`Audio aktif: ${aud.label}`);
    setTimeout(() => setAudioToast(null), 3000);
    try {
      localStorage.setItem("animeku_player_audio", aud.id);
    } catch (err) {}
  };

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleSubtitleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setCustomSubName(file.name);
      setSelectedSub("custom");
      try {
        localStorage.setItem("animeku_player_subtitle", "custom");
      } catch (err) {}
    }
  };

  const getSubtitleCue = () => {
    if (selectedSub === "off") return null;
    const cues: Record<string, string> = {
      id: "Nona Frieren, apakah kita akan bersiap melanjutkan perjalanan ke utara?",
      en: "Lady Frieren, shall we prepare to head further north?",
      "ja-romaji": "Frieren-sama, kita e to mukau junbi wo shimashou ka?",
      custom: `[${customSubName}] Menampilkan baris teks subtitle dari file lokal...`,
    };
    return cues[selectedSub] || cues.id;
  };

  // Mouse activity timer to hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
    setControlsTimeout(timeout);
  };

  const triggerFeedback = (type: "play" | "pause" | "rewind" | "forward") => {
    setCenterFeedback(type);
    setTimeout(() => {
      setCenterFeedback(null);
    }, 600);
  };

  // Handle local video playback
  const activeVideoUrl = localFileObjectUrl || currentEp.sourceUrl;

  useEffect(() => {
    // When switching episode, check cache
    if (localFilesCache.has(currentEp.episodeNumber)) {
      const file = localFilesCache.get(currentEp.episodeNumber)!;
      const url = URL.createObjectURL(file);
      setLocalFileObjectUrl(url);
      setVideoError(null);
    } else {
      setLocalFileObjectUrl(null);
    }
  }, [currentEp.id, currentEp.episodeNumber]);

  const handleVideoError = () => {
    console.warn("Video failed to play:", activeVideoUrl);
    setVideoError({
      type: "local_unreachable",
      message: "Berkas video lokal tidak dapat dijangkau secara langsung dari server cloud.",
    });
    setIsPlaying(false);
  };

  const handleSingleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLocalFileObjectUrl(url);
      setLocalFilesCache((prev) => {
        const m = new Map(prev);
        m.set(currentEp.episodeNumber, file);
        return m;
      });
      setVideoError(null);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
          setIsPlaying(true);
        }
      }, 150);
    }
  };

  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newMap = new Map<number, File>(localFilesCache);
      for (const f of files) {
        const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
        if ([".mp4", ".mkv", ".webm", ".avi", ".flv", ".mov", ".ts"].includes(ext)) {
          const base = f.name.replace(/\.[^/.]+$/, "");
          const match = base.match(/(?:ep|episode|e)?\s*0*(\d{1,4})/i);
          if (match && match[1]) {
            const num = parseInt(match[1], 10);
            newMap.set(num, f);
          }
        }
      }
      setLocalFilesCache(newMap);

      const curFile = newMap.get(currentEp.episodeNumber);
      if (curFile) {
        const url = URL.createObjectURL(curFile);
        setLocalFileObjectUrl(url);
        setVideoError(null);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
        }, 150);
      } else {
        const first = Array.from(newMap.values())[0];
        if (first) {
          const url = URL.createObjectURL(first);
          setLocalFileObjectUrl(url);
          setVideoError(null);
        }
      }
    }
  };

  const handlePlayDemoVideo = () => {
    setLocalFileObjectUrl("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
    setVideoError(null);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }, 150);
  };

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      triggerFeedback("pause");
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {
        handleVideoError();
      });
      triggerFeedback("play");
      setIsPlaying(true);
    }
  }, [isPlaying, activeVideoUrl]);

  // Skip time (-10s / +10s)
  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    triggerFeedback(seconds < 0 ? "rewind" : "forward");
  };

  // Next episode logic
  const currentEpIndex = currentEpisodesList.findIndex((e) => e.id === currentEp.id);
  const nextEp =
    currentEpIndex >= 0 && currentEpIndex < currentEpisodesList.length - 1
      ? currentEpisodesList[currentEpIndex + 1]
      : null;

  const playNextEpisode = () => {
    if (nextEp) {
      setCurrentEp(nextEp);
      setNextEpCountdown(null);
      setCurrentTime(0);
      lastSavedTimeRef.current = 0;
      setResumeToast(null);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  const [isPiP, setIsPiP] = useState(false);

  // Handle Fullscreen toggle with vendor support
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    const doc = document as any;
    const el = containerRef.current as any;

    if (
      !doc.fullscreenElement &&
      !doc.webkitFullscreenElement &&
      !doc.mozFullScreenElement &&
      !doc.msFullscreenElement
    ) {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen();
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  }, []);

  // Listen to fullscreen changes across browsers
  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      setIsFullscreen(
        !!(
          doc.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFsChange);
    document.addEventListener("webkitfullscreenchange", handleFsChange);
    document.addEventListener("mozfullscreenchange", handleFsChange);
    document.addEventListener("MSFullscreenChange", handleFsChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFsChange);
      document.removeEventListener("webkitfullscreenchange", handleFsChange);
      document.removeEventListener("mozfullscreenchange", handleFsChange);
      document.removeEventListener("MSFullscreenChange", handleFsChange);
    };
  }, []);

  // Handle Picture-in-Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
        setIsPiP(true);
      } else {
        alert("Browser Anda tidak mendukung Picture-in-Picture.");
      }
    } catch (err) {
      console.warn("PiP error", err);
    }
  };

  // PiP event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiP(true);
    const handleLeavePiP = () => setIsPiP(false);

    video.addEventListener("enterpictureinpicture", handleEnterPiP);
    video.addEventListener("leavepictureinpicture", handleLeavePiP);

    return () => {
      video.removeEventListener("enterpictureinpicture", handleEnterPiP);
      video.removeEventListener("leavepictureinpicture", handleLeavePiP);
    };
  }, []);

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Calculate buffer
    if (videoRef.current.buffered.length > 0 && duration > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBufferedPercent((bufferedEnd / duration) * 100);
    }

    // Auto next episode trigger when 8 seconds remain if autoplay is active
    if (autoplayNext && duration > 20 && duration - cur <= 8 && nextEp && nextEpCountdown === null) {
      setNextEpCountdown(8);
    }

    // Save watch progress periodically every 4 seconds
    if (Math.abs(cur - lastSavedTimeRef.current) >= 4) {
      lastSavedTimeRef.current = cur;
      saveWatchProgress({
        animeId: anime.id,
        animeTitle: anime.title,
        animePoster: anime.posterUrl,
        episodeId: currentEp.id,
        episodeNumber: currentEp.episodeNumber,
        episodeTitle: currentEp.title,
        positionSeconds: cur,
        durationSeconds: duration || videoRef.current.duration || 0,
      });
    }
  };

  const handleVideoEnded = () => {
    if (duration > 0) {
      saveWatchProgress({
        animeId: anime.id,
        animeTitle: anime.title,
        animePoster: anime.posterUrl,
        episodeId: currentEp.id,
        episodeNumber: currentEp.episodeNumber,
        episodeTitle: currentEp.title,
        positionSeconds: duration,
        durationSeconds: duration,
      });
    }

    if (autoplayNext && nextEp) {
      setNextEpCountdown(5);
    }
  };

  // Countdown timer for next episode
  useEffect(() => {
    if (nextEpCountdown === null) return;
    if (nextEpCountdown <= 0) {
      playNextEpisode();
      return;
    }
    const timer = setTimeout(() => {
      setNextEpCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(timer);
  }, [nextEpCountdown]);

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    const dur = videoRef.current.duration;
    setDuration(dur);
    videoRef.current.playbackRate = playbackRate;
    videoRef.current.volume = isMuted ? 0 : volume;

    // Check localStorage for saved watch progress
    const saved = getWatchProgressForAnime(anime.id);
    if (
      saved &&
      saved.episodeId === currentEp.id &&
      saved.positionSeconds > 5 &&
      dur > 0 &&
      saved.positionSeconds < dur - 10 &&
      !saved.isCompleted
    ) {
      videoRef.current.currentTime = saved.positionSeconds;
      setCurrentTime(saved.positionSeconds);
      setResumeToast({ seconds: saved.positionSeconds });
      setTimeout(() => setResumeToast(null), 6000);
    }
  };

  // Scrubber hover tracking
  const handleScrubberMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration === 0) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleScrubberMouseLeave = () => {
    setHoverTime(null);
  };

  const handleScrubberClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrubberRef.current || duration === 0 || !videoRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (val > 0) previousVolumeRef.current = val;
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    try {
      localStorage.setItem("animeku_player_volume", val.toString());
      localStorage.setItem("animeku_player_muted", (val === 0).toString());
    } catch (e) {}
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted || volume === 0) {
      const restored = previousVolumeRef.current > 0 ? previousVolumeRef.current : 0.8;
      videoRef.current.muted = false;
      videoRef.current.volume = restored;
      setVolume(restored);
      setIsMuted(false);
      try {
        localStorage.setItem("animeku_player_volume", restored.toString());
        localStorage.setItem("animeku_player_muted", "false");
      } catch (e) {}
    } else {
      previousVolumeRef.current = volume;
      videoRef.current.muted = true;
      setIsMuted(true);
      try {
        localStorage.setItem("animeku_player_muted", "true");
      } catch (e) {}
    }
  };

  const setSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      switch (e.code) {
        case "Space":
        case "KeyK":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
        case "KeyJ":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
        case "KeyL":
          e.preventDefault();
          skip(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume((v) => {
            const nextV = Math.min(1, v + 0.1);
            if (videoRef.current) videoRef.current.volume = nextV;
            return nextV;
          });
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume((v) => {
            const nextV = Math.max(0, v - 0.1);
            if (videoRef.current) videoRef.current.volume = nextV;
            return nextV;
          });
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay]);

  const formatSeconds = (sec: number) => {
    if (isNaN(sec)) return "00:00";
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen bg-black overflow-hidden select-none font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={activeVideoUrl}
        onError={handleVideoError}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onEnded={handleVideoEnded}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Hidden File & Folder Pickers for Local Media */}
      <input
        ref={singleFileInputRef}
        type="file"
        accept="video/*"
        onChange={handleSingleFileSelect}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
        className="hidden"
      />

      {/* Hidden Subtitle File Input */}
      <input
        ref={subFileInputRef}
        type="file"
        accept=".srt,.vtt,.ass"
        onChange={handleSubtitleUpload}
        className="hidden"
      />

      {/* On-Screen Live Subtitle Display */}
      {selectedSub !== "off" && (
        <div className="absolute bottom-24 left-4 right-4 flex justify-center pointer-events-none z-20 transition-all">
          <div
            className={`px-4 py-1.5 rounded-lg text-center max-w-2xl font-semibold select-none drop-shadow-md transition-all ${
              subSize === "sm"
                ? "text-sm sm:text-base"
                : subSize === "lg"
                ? "text-lg sm:text-2xl"
                : "text-base sm:text-xl"
            } text-yellow-300 bg-black/80 backdrop-blur-[2px] shadow-2xl border border-white/10`}
          >
            {getSubtitleCue()}
          </div>
        </div>
      )}

      {/* Center Action Feedback Ripple */}
      {centerFeedback && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <div className="p-6 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/20 animate-in zoom-in-75 fade-in duration-300">
            {centerFeedback === "play" && <Play className="w-12 h-12 fill-white ml-1" />}
            {centerFeedback === "pause" && <Pause className="w-12 h-12 fill-white" />}
            {centerFeedback === "rewind" && (
              <div className="flex flex-col items-center">
                <RotateCcw className="w-10 h-10" />
                <span className="text-xs font-bold mt-1">-10s</span>
              </div>
            )}
            {centerFeedback === "forward" && (
              <div className="flex flex-col items-center">
                <RotateCw className="w-10 h-10" />
                <span className="text-xs font-bold mt-1">+10s</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/95 via-black/40 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center space-x-4">
          <Link
            href="/"
            onClick={onBack}
            className="p-2.5 rounded-full bg-black/60 hover:bg-zinc-800 text-white border border-white/10 backdrop-blur-md transition-transform hover:scale-105"
            aria-label="Kembali ke Beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">
                Sedang Diputar
              </span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs text-zinc-300">1080p Full HD</span>
              <span className="text-xs text-zinc-400">•</span>
              <span className="text-xs bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-white/10">
                {audioTracks.find((a) => a.id === selectedAudio)?.badge || "JP 5.1"}
              </span>
            </div>
            <h1 className="text-sm sm:text-lg font-extrabold text-white">
              {anime.title}{" "}
              <span className="text-zinc-400 font-normal">
                — Ep {currentEp.episodeNumber}: {currentEp.title}
              </span>
            </h1>
          </div>
        </div>

        {/* Audio Toast Notification */}
        {audioToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 px-4 py-2 bg-zinc-900/95 border border-zinc-700 text-white text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2">
            {audioToast}
          </div>
        )}

        {/* Right Header Button: Episode List */}
        <button
          onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-white/10 backdrop-blur-md transition-colors cursor-pointer"
        >
          <ListVideo className="w-4 h-4 text-red-500" />
          <span className="hidden sm:inline">Daftar Episode</span>
        </button>
      </div>

      {/* Resume Watch Toast Notification */}
      {resumeToast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 bg-zinc-900/95 border border-red-500/40 text-white text-xs font-semibold rounded-full shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          <span>
            Melanjutkan dari{" "}
            <span className="text-red-400 font-mono font-bold">
              {formatSeconds(resumeToast.seconds)}
            </span>
          </span>
          <button
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
                setCurrentTime(0);
              }
              setResumeToast(null);
            }}
            className="text-xs text-zinc-300 hover:text-white underline cursor-pointer"
          >
            Mulai dari awal
          </button>
          <button
            onClick={() => setResumeToast(null)}
            className="text-zinc-400 hover:text-white text-xs cursor-pointer ml-1"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>
      )}

      {/* Next Episode Auto Countdown Popup */}
      {nextEpCountdown !== null && nextEp && (
        <div className="absolute bottom-28 right-6 sm:right-8 z-40 bg-zinc-950/95 border border-zinc-700/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md max-w-sm w-[90vw] animate-in slide-in-from-bottom-5">
          {/* Header with Circular Countdown Progress */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                <svg className="w-8 h-8 -rotate-90">
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    className="stroke-zinc-700"
                    strokeWidth="3"
                    fill="none"
                  />
                  <circle
                    cx="16"
                    cy="16"
                    r="13"
                    className="stroke-red-600 transition-all duration-1000"
                    strokeWidth="3"
                    strokeDasharray={81.68}
                    strokeDashoffset={81.68 * (1 - nextEpCountdown / 8)}
                    fill="none"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-white font-mono">
                  {nextEpCountdown}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">
                  Episode Selanjutnya
                </span>
                <span className="text-[10px] text-zinc-400">Putar otomatis dalam {nextEpCountdown} detik</span>
              </div>
            </div>

            <button
              onClick={() => setNextEpCountdown(null)}
              className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Batalkan putar otomatis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Episode Preview Card */}
          <div className="flex gap-3 bg-zinc-900/80 p-2.5 rounded-xl border border-white/5 mb-3">
            <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
              <img
                src={nextEp.thumbnailUrl}
                alt={nextEp.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1 right-1 bg-black/80 text-[9px] px-1 rounded text-zinc-300">
                24:00
              </div>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <p className="text-xs font-bold text-white truncate">
                Ep {nextEp.episodeNumber}: {nextEp.title}
              </p>
              <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                {nextEp.synopsis}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={playNextEpisode}
              className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-red-600/40 transition-transform active:scale-95 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Putar Sekarang
            </button>

            <button
              onClick={() => setNextEpCountdown(null)}
              className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-30 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Custom Interactive Scrubber Timeline Bar */}
        <div
          ref={scrubberRef}
          onMouseMove={handleScrubberMouseMove}
          onMouseLeave={handleScrubberMouseLeave}
          onClick={handleScrubberClick}
          className="relative w-full h-3 flex items-center cursor-pointer mb-3 group/timeline"
        >
          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 -translate-x-1/2 px-2 py-1 bg-zinc-900 text-[11px] font-bold text-white rounded border border-zinc-700 shadow-lg pointer-events-none"
              style={{ left: `${hoverPosition}%` }}
            >
              {formatSeconds(hoverTime)}
            </div>
          )}

          {/* Background rail */}
          <div className="w-full h-1.5 group-hover/timeline:h-2 bg-zinc-700/60 rounded-full overflow-hidden transition-all">
            {/* Buffer bar */}
            <div
              className="h-full bg-zinc-500/50 transition-all duration-300"
              style={{ width: `${bufferedPercent}%` }}
            />
          </div>

          {/* Played progress fill */}
          <div
            className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none"
            style={{ width: `${currentPercent}%` }}
          >
            <div className="w-full h-1.5 group-hover/timeline:h-2 bg-red-600 rounded-full" />
            {/* Scrub thumb handle */}
            <div className="w-3.5 h-3.5 bg-red-600 rounded-full shadow-md scale-0 group-hover/timeline:scale-100 transition-transform -mr-1.5 shrink-0" />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left: Play, Skip, Volume, Time */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-transform hover:scale-110 cursor-pointer"
              aria-label={isPlaying ? "Jeda video" : "Putar video"}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>

            {/* Skip -10s */}
            <button
              onClick={() => skip(-10)}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Mundur 10 detik (J atau ←)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Skip +10s */}
            <button
              onClick={() => skip(10)}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Maju 10 detik (L atau →)"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Next Episode Button */}
            {nextEp && (
              <button
                onClick={playNextEpisode}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={`Episode Selanjutnya (Ep ${nextEp.episodeNumber})`}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center space-x-1.5 group/volume bg-zinc-900/60 hover:bg-zinc-800/80 px-2 py-1 rounded-full border border-transparent hover:border-white/10 transition-all">
              <button
                onClick={toggleMute}
                className="p-1 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                title={isMuted ? "Bunyikan (M)" : "Bisukan (M)"}
                aria-label={isMuted ? "Bunyikan audio" : "Bisukan audio"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : volume <= 0.5 ? (
                  <Volume1 className="w-5 h-5 text-zinc-200" />
                ) : (
                  <Volume2 className="w-5 h-5 text-white" />
                )}
              </button>
              <div className="hidden group-hover/volume:flex items-center space-x-2 animate-in fade-in duration-150">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 sm:w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600 transition-all"
                  aria-label="Volume"
                />
                <span className="text-[10px] font-mono text-zinc-400 w-7 text-right">
                  {isMuted ? "0%" : `${Math.round(volume * 100)}%`}
                </span>
              </div>
            </div>

            {/* Time Stamp */}
            <span className="text-xs text-zinc-300 font-medium tracking-wider">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </span>
          </div>

          {/* Right: Subtitles, Audio, Speed, PiP, Fullscreen */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Audio & Subtitles Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAudioSubMenu(!showAudioSubMenu);
                  setShowSpeedMenu(false);
                }}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Audio & Subtitle"
              >
                <Subtitles className="w-5 h-5" />
              </button>

              {showAudioSubMenu && (
                <div className="absolute bottom-12 right-0 w-64 bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl backdrop-blur-md text-xs space-y-4 animate-in fade-in duration-150 z-50">
                  {/* Subtitles */}
                  <div>
                    <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                      Subtitle
                    </span>
                    <div className="space-y-1">
                      {subtitles.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => {
                            setSelectedSub(sub.id);
                            setShowAudioSubMenu(false);
                            try {
                              localStorage.setItem("animeku_player_subtitle", sub.id);
                            } catch (e) {}
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                            selectedSub === sub.id
                              ? "bg-red-600/20 text-red-400 font-bold"
                              : "hover:bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          <span className="truncate">{sub.label}</span>
                          {selectedSub === sub.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}

                      {/* Upload local subtitle button */}
                      <button
                        onClick={() => subFileInputRef.current?.click()}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer text-xs mt-1 border border-dashed border-zinc-700"
                      >
                        <Upload className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Unggah Subtitle (.srt / .vtt)</span>
                      </button>
                    </div>

                    {/* Subtitle Size Options */}
                    {selectedSub !== "off" && (
                      <div className="mt-3 pt-2 border-t border-zinc-800/80">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                          Ukuran Teks Subtitle
                        </span>
                        <div className="flex items-center gap-1.5">
                          {(["sm", "md", "lg"] as const).map((sz) => (
                            <button
                              key={sz}
                              onClick={() => {
                                setSubSize(sz);
                                try {
                                  localStorage.setItem("animeku_player_subtitle_size", sz);
                                } catch (e) {}
                              }}
                              className={`flex-1 py-1 rounded text-center text-xs font-semibold transition-colors cursor-pointer ${
                                subSize === sz
                                  ? "bg-red-600 text-white shadow"
                                  : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              }`}
                            >
                              {sz === "sm" ? "Kecil" : sz === "md" ? "Sedang" : "Besar"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Audio */}
                  <div className="pt-2 border-t border-zinc-800">
                    <span className="font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                      Audio
                    </span>
                    <div className="space-y-1">
                      {audioTracks.map((aud) => (
                        <button
                          key={aud.id}
                          onClick={() => handleAudioChange(aud)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                            selectedAudio === aud.id
                              ? "bg-red-600/20 text-red-400 font-bold"
                              : "hover:bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          <span className="truncate">{aud.label}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] bg-zinc-800 text-zinc-400 px-1 rounded border border-white/5">
                              {aud.badge}
                            </span>
                            {selectedAudio === aud.id && <Check className="w-3.5 h-3.5 text-red-400" />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Playback Speed Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowSpeedMenu(!showSpeedMenu);
                  setShowAudioSubMenu(false);
                }}
                className="p-2 rounded-full hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
                title="Kecepatan Putar"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-12 right-0 w-36 bg-zinc-900 border border-zinc-700 rounded-xl p-2 shadow-2xl backdrop-blur-md text-xs space-y-1 animate-in fade-in duration-150 z-50">
                  <span className="font-bold text-zinc-400 uppercase tracking-wider block px-2 py-1">
                    Kecepatan
                  </span>
                  {speeds.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeed(rate)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                        playbackRate === rate
                          ? "bg-red-600/20 text-red-400 font-bold"
                          : "hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      <span>{rate}x</span>
                      {playbackRate === rate && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            <button
              onClick={togglePiP}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isPiP
                  ? "bg-red-600 text-white shadow"
                  : "hover:bg-white/20 text-white"
              }`}
              title={isPiP ? "Keluar Jendela Mini" : "Jendela Mini (Picture-in-Picture)"}
            >
              <Tv className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Keluar Layar Penuh (F)" : "Layar Penuh (F)"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Episode Drawer Sidebar */}
      {showEpisodeDrawer && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200"
          onClick={() => setShowEpisodeDrawer(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md h-full bg-zinc-950 p-6 border-l border-zinc-800 shadow-2xl flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
                <h3 className="font-extrabold text-white text-base">
                  Episode {anime.title}
                </h3>
                <button
                  onClick={() => setShowEpisodeDrawer(false)}
                  className="p-1 rounded-full text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3">
                {currentEpisodesList.map((ep) => (
                  <div
                    key={ep.id}
                    onClick={() => {
                      setCurrentEp(ep);
                      setShowEpisodeDrawer(false);
                      setCurrentTime(0);
                      lastSavedTimeRef.current = 0;
                      setResumeToast(null);
                      if (videoRef.current) {
                        videoRef.current.currentTime = 0;
                        videoRef.current.play().catch(() => {});
                        setIsPlaying(true);
                      }
                    }}
                    className={`flex gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                      ep.id === currentEp.id
                        ? "bg-red-600/10 border-red-500/50"
                        : "bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800"
                    }`}
                  >
                    <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                      <img
                        src={ep.thumbnailUrl}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                      {ep.id === currentEp.id && (
                        <div className="absolute inset-0 bg-red-600/40 flex items-center justify-center">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          ep.id === currentEp.id ? "text-red-400" : "text-white"
                        }`}
                      >
                        Ep {ep.episodeNumber}: {ep.title}
                      </p>
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                        {ep.synopsis}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Local File / Playback Fallback Overlay */}
      {videoError && (
        <div className="absolute inset-0 z-40 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-500 shadow-xl">
              <HardDrive className="w-8 h-8 animate-pulse" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-black text-white">
                Berkas Video Lokal di PC Anda
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Serial ini berada di penyimpanan PC lokal:
                <br />
                <span className="font-mono text-xs text-red-400 bg-red-950/40 px-2 py-1 rounded inline-block mt-1.5 border border-red-900/40 truncate max-w-full">
                  {decodeURIComponent(currentEp.sourceUrl?.replace("/api/stream?file=", "") || "D:/Anime/Series")}
                </span>
              </p>
              <p className="text-[11px] text-zinc-500">
                Karena Anda membukanya via web cloud, pilih berkas secara langsung untuk memutarnya dengan lancar tanpa kuota internet!
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {/* Tombol Pilih File Video */}
              <button
                type="button"
                onClick={() => singleFileInputRef.current?.click()}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FileVideo className="w-4 h-4" />
                <span>Pilih File Episode Ini ({currentEp.title})</span>
              </button>

              {/* Tombol Pilih Satu Folder Penuh */}
              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-bold text-xs rounded-xl border border-zinc-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>Pilih Folder Seri Ini Sekaligus</span>
              </button>

              {/* Tombol Putar Video Demo */}
              <button
                type="button"
                onClick={handlePlayDemoVideo}
                className="w-full py-2.5 bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 text-xs font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-zinc-400 fill-zinc-400" />
                <span>Putar Video Contoh (Mode Pratinjau Demo)</span>
              </button>
            </div>

            <div className="border-t border-zinc-800 pt-3 text-[11px] text-zinc-500 text-left">
              💡 <strong>Ingin streaming otomatis tanpa memilih berkas?</strong> Jalankan <code className="bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">npm run dev</code> di terminal dan buka <a href="http://localhost:3000" className="text-red-400 hover:underline">http://localhost:3000</a> di browser PC Anda.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
