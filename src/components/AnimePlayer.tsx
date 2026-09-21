"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
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
} from "lucide-react";
import { Anime } from "@/types/anime";
import { ExtendedEpisode } from "@/data/mockEpisodes";

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

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);

  // Settings & overlays
  const [showEpisodeDrawer, setShowEpisodeDrawer] = useState(false);
  const [showAudioSubMenu, setShowAudioSubMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [selectedSub, setSelectedSub] = useState("id");
  const [selectedAudio, setSelectedAudio] = useState("ja");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [nextEpCountdown, setNextEpCountdown] = useState<number | null>(null);

  // Subtitle & Audio options
  const subtitles = [
    { id: "off", label: "Nonaktif" },
    { id: "id", label: "Bahasa Indonesia (Resmi)" },
    { id: "en", label: "English" },
    { id: "ja-romaji", label: "Romaji / Karaoke" },
  ];

  const audioTracks = [
    { id: "ja", label: "Jepang (Original Dolby 5.1)" },
    { id: "en", label: "English Dub" },
  ];

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  // Mouse activity timer to hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const timeout = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
    setControlsTimeout(timeout);
  };

  // Toggle play/pause
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  // Skip time (-10s / +10s)
  const skip = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, videoRef.current.currentTime + seconds)
    );
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
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
        setIsPlaying(true);
      }
    }
  };

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.warn("PiP not supported or rejected", err);
    }
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    setCurrentTime(cur);

    // Auto next episode trigger when 10 seconds remain
    if (duration > 20 && duration - cur <= 10 && nextEp && nextEpCountdown === null) {
      setNextEpCountdown(10);
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
    setDuration(videoRef.current.duration);
    videoRef.current.playbackRate = playbackRate;
    videoRef.current.volume = isMuted ? 0 : volume;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      videoRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const setSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  // Keyboard shortcuts (Space, Left/Right, F, M)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skip(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skip(10);
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

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen bg-black overflow-hidden select-none font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentEp.sourceUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Top Header Overlay */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent flex items-center justify-between z-30 transition-opacity duration-300 ${
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
            </div>
            <h1 className="text-sm sm:text-lg font-extrabold text-white">
              {anime.title}{" "}
              <span className="text-zinc-400 font-normal">
                — Ep {currentEp.episodeNumber}: {currentEp.title}
              </span>
            </h1>
          </div>
        </div>

        {/* Right Header Button: Episode List */}
        <button
          onClick={() => setShowEpisodeDrawer(!showEpisodeDrawer)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-xs font-semibold text-zinc-200 border border-white/10 backdrop-blur-md transition-colors"
        >
          <ListVideo className="w-4 h-4 text-red-500" />
          <span className="hidden sm:inline">Daftar Episode</span>
        </button>
      </div>

      {/* Next Episode Auto Countdown Popup */}
      {nextEpCountdown !== null && nextEp && (
        <div className="absolute bottom-28 right-8 z-40 bg-zinc-950/95 border border-zinc-700 rounded-xl p-4 shadow-2xl backdrop-blur-md max-w-sm animate-in slide-in-from-bottom-5">
          <div className="flex items-center justify-between gap-4 mb-2">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
              Episode Selanjutnya ({nextEpCountdown}s)
            </span>
            <button
              onClick={() => setNextEpCountdown(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm font-bold text-white mb-3">
            Ep {nextEp.episodeNumber}: {nextEp.title}
          </p>

          <div className="flex gap-2">
            <button
              onClick={playNextEpisode}
              className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-red-600/30"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              Putar Sekarang
            </button>
            <button
              onClick={() => setNextEpCountdown(null)}
              className="py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs font-medium"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Bottom Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-30 transition-opacity duration-300 ${
          showControls ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Scrubber Timeline Bar */}
        <div className="relative mb-3 group/timeline">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600 hover:h-2.5 transition-all"
            aria-label="Progress timeline"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left: Play, Skip, Volume, Time */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-transform hover:scale-110"
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
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              title="Mundur 10 detik"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Skip +10s */}
            <button
              onClick={() => skip(10)}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              title="Maju 10 detik"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Next Episode Button */}
            {nextEp && (
              <button
                onClick={playNextEpisode}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                title={`Episode Selanjutnya (Ep ${nextEp.episodeNumber})`}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            )}

            {/* Volume Control */}
            <div className="flex items-center space-x-2 group/volume">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
                title={isMuted ? "Bunyikan" : "Bisukan"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-20 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-red-600 hidden group-hover/volume:inline-block transition-all"
                aria-label="Volume"
              />
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
                className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
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
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            selectedSub === sub.id
                              ? "bg-red-600/20 text-red-400 font-bold"
                              : "hover:bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          <span>{sub.label}</span>
                          {selectedSub === sub.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
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
                          onClick={() => {
                            setSelectedAudio(aud.id);
                            setShowAudioSubMenu(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                            selectedAudio === aud.id
                              ? "bg-red-600/20 text-red-400 font-bold"
                              : "hover:bg-zinc-800 text-zinc-300"
                          }`}
                        >
                          <span>{aud.label}</span>
                          {selectedAudio === aud.id && <Check className="w-3.5 h-3.5" />}
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
                className="p-2 rounded-full hover:bg-white/20 text-white text-xs font-bold transition-colors"
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors ${
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
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
              title="Jendela Mini (Picture-in-Picture)"
            >
              <Tv className="w-5 h-5" />
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full hover:bg-white/20 text-white transition-colors"
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
                  className="p-1 rounded-full text-zinc-400 hover:text-white"
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
    </div>
  );
}
