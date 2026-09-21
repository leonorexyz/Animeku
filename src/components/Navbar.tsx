"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, Film, PlayCircle, FolderHeart, HardDrive } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[#141414]/95 backdrop-blur-md shadow-lg border-b border-white/5 py-3"
          : "bg-gradient-to-b from-black/90 via-black/40 to-transparent py-5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Brand & Navigation */}
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white flex items-center">
              ANIME<span className="text-red-500">KU</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="text-white hover:text-red-400 transition-colors font-semibold flex items-center gap-1.5"
            >
              Beranda
            </Link>
            <Link
              href="#continue-watching"
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <PlayCircle className="w-4 h-4 text-red-500" />
              Lanjut Nonton
            </Link>
            <Link
              href="#kategori"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Kategori
            </Link>
            <Link
              href="#favorit"
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <FolderHeart className="w-4 h-4 text-zinc-400" />
              Koleksi
            </Link>
          </nav>
        </div>

        {/* Right: Search, Source status, Profile */}
        <div className="flex items-center space-x-4">
          {/* Active Source indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Katalog Pribadi</span>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center">
            {searchOpen ? (
              <div className="flex items-center bg-zinc-900/90 border border-zinc-700 rounded-full px-3 py-1.5 shadow-inner">
                <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Cari judul anime..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  onBlur={() => !searchQuery && setSearchOpen(false)}
                  className="bg-transparent text-sm text-white focus:outline-none w-36 sm:w-52"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-zinc-400 hover:text-white ml-1"
                  >
                    ✕
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-full transition-colors"
                title="Cari anime"
              >
                <Search className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Notification */}
          <button className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-full transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#141414]"></span>
          </button>

          {/* Profile Avatar */}
          <div className="flex items-center space-x-2 pl-2 border-l border-zinc-800">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-zinc-700/50">
              AK
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
