"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Film,
  PlayCircle,
  FolderHeart,
  HardDrive,
  Menu,
  X,
  Layers,
  Plus,
  Heart,
  Settings,
} from "lucide-react";
import LiveSearchInput from "@/components/LiveSearchInput";

export default function Navbar() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push(`/search`);
    }
  };

  const handleNavigate = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    setMobileMenuOpen(false);

    if (href.startsWith("#") || href.startsWith("/#")) {
      const hash = href.startsWith("/#") ? href.slice(1) : href;
      if (typeof window !== "undefined") {
        if (window.location.pathname === "/") {
          e.preventDefault();
          const targetEl = document.querySelector(hash);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth" });
            return;
          }
        } else {
          e.preventDefault();
          window.location.href = `/${hash}`;
          return;
        }
      }
    }

    e.preventDefault();
    router.push(href);
    setTimeout(() => {
      if (typeof window !== "undefined" && window.location.pathname !== href) {
        window.location.href = href;
      }
    }, 180);
  };

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
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-[#141414]/95 backdrop-blur-md shadow-lg border-b border-white/5 py-3"
            : "bg-gradient-to-b from-black/90 via-black/40 to-transparent py-4 sm:py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Left: Hamburger (Mobile) + Brand & Desktop Navigation */}
          <div className="flex items-center space-x-3 sm:space-x-8">
            {/* Hamburger Button on Mobile */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 text-zinc-300 hover:text-white rounded-lg hover:bg-zinc-800/60"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link
              href="/"
              onClick={(e) => handleNavigate(e, "/")}
              className="flex items-center space-x-2 group cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center">
                ANIME<span className="text-red-500">KU</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/"
                onClick={(e) => handleNavigate(e, "/")}
                className="text-white hover:text-red-400 transition-colors font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                Beranda
              </Link>
              <Link
                href="/search"
                onClick={(e) => handleNavigate(e, "/search")}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4 text-zinc-400" />
                Eksplorasi
              </Link>
              <Link
                href="/#continue-watching"
                onClick={(e) => handleNavigate(e, "/#continue-watching")}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <PlayCircle className="w-4 h-4 text-red-500" />
                Lanjut Nonton
              </Link>
              <Link
                href="/categories"
                onClick={(e) => handleNavigate(e, "/categories")}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Kategori
              </Link>
              <Link
                href="/collections"
                onClick={(e) => handleNavigate(e, "/collections")}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FolderHeart className="w-4 h-4 text-zinc-400" />
                Koleksi
              </Link>
              <Link
                href="/favorites"
                onClick={(e) => handleNavigate(e, "/favorites")}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Heart className="w-4 h-4 text-red-500" />
                Favorit
              </Link>
              <Link
                href="/sources"
                onClick={(e) => handleNavigate(e, "/sources")}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-red-500" />
                Tambah Sumber
              </Link>
              <Link
                href="/settings"
                onClick={(e) => handleNavigate(e, "/settings")}
                className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Pengaturan Aplikasi"
              >
                <Settings className="w-3.5 h-3.5 text-zinc-400 hover:text-white" />
                Pengaturan
              </Link>
            </nav>
          </div>

          {/* Right: Search, Source status, Profile */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Active Source indicator */}
            <Link
              href="/sources"
              onClick={(e) => handleNavigate(e, "/sources")}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Kelola Sumber Anime"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sumber Terhubung</span>
            </Link>

            {/* Search bar with live suggestions */}
            <div className="relative flex items-center">
              {searchOpen ? (
                <div className="relative w-48 sm:w-72 flex items-center">
                  <LiveSearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Cari judul..."
                    autoFocus
                    showDropdown={true}
                    inputClassName="!py-1.5 !pl-8 !pr-8 !text-xs !rounded-full !bg-zinc-900/95 !border-zinc-700 shadow-lg"
                  />
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                    }}
                    className="ml-1.5 p-1 text-zinc-400 hover:text-white text-xs rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
                    title="Tutup pencarian"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className="p-2 text-zinc-300 hover:text-white hover:bg-zinc-800/60 rounded-full transition-colors cursor-pointer"
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

            {/* Profile Avatar / Settings Link */}
            <div className="flex items-center space-x-2 pl-2 border-l border-zinc-800">
              <Link
                href="/settings"
                onClick={(e) => handleNavigate(e, "/settings")}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-white font-bold text-xs ring-2 ring-zinc-700/50 hover:ring-red-500 transition-all hover:scale-105 cursor-pointer"
                title="Buka Pengaturan"
              >
                AK
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md md:hidden animate-in fade-in duration-200"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-zinc-950 p-6 border-r border-zinc-800 shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-800">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white font-black">
                    A
                  </div>
                  <span className="font-bold text-white tracking-tight">
                    ANIME<span className="text-red-500">KU</span>
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                  aria-label="Tutup menu navigasi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Navigation Links */}
              <nav className="space-y-1">
                <Link
                  href="/"
                  onClick={(e) => handleNavigate(e, "/")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <Film className="w-4 h-4 text-red-500" />
                  Beranda
                </Link>
                <Link
                  href="/search"
                  onClick={(e) => handleNavigate(e, "/search")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-zinc-400" />
                  Eksplorasi
                </Link>
                <Link
                  href="/#continue-watching"
                  onClick={(e) => handleNavigate(e, "/#continue-watching")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <PlayCircle className="w-4 h-4 text-red-500" />
                  Lanjut Nonton
                </Link>
                <Link
                  href="/categories"
                  onClick={(e) => handleNavigate(e, "/categories")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <Layers className="w-4 h-4 text-zinc-400" />
                  Kategori
                </Link>
                <Link
                  href="/collections"
                  onClick={(e) => handleNavigate(e, "/collections")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <FolderHeart className="w-4 h-4 text-zinc-400" />
                  Koleksi & Kategori
                </Link>
                <Link
                  href="/favorites"
                  onClick={(e) => handleNavigate(e, "/favorites")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-red-500" />
                  Daftar Favorit
                </Link>
                <Link
                  href="/sources"
                  onClick={(e) => handleNavigate(e, "/sources")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-red-500" />
                  Tambah Sumber
                </Link>
                <Link
                  href="/settings"
                  onClick={(e) => handleNavigate(e, "/settings")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-900 cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-zinc-400" />
                  Pengaturan
                </Link>
              </nav>
            </div>

            {/* Drawer Bottom Info */}
            <div className="pt-4 border-t border-zinc-800">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                <span>Koleksi Lokal & Drive</span>
              </div>
              <p className="text-[10px] text-zinc-600 mt-1">Animeku Player v1.0</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
