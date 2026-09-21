"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Home, PlayCircle, Layers, FolderHeart, PlusCircle } from "lucide-react";

interface MobileBottomNavProps {
  onAddClick?: () => void;
}

export default function MobileBottomNav({ onAddClick }: MobileBottomNavProps) {
  const [activeTab, setActiveTab] = useState("beranda");

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141414]/95 backdrop-blur-lg border-t border-white/10 pb-safe">
      <nav className="flex items-center justify-around py-2 px-1 text-[10px] font-medium">
        {/* Beranda */}
        <Link
          href="/"
          onClick={() => setActiveTab("beranda")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === "beranda" ? "text-red-500 font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Beranda</span>
        </Link>

        {/* Lanjut Nonton */}
        <Link
          href="#continue-watching"
          onClick={() => setActiveTab("continue")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === "continue" ? "text-red-500 font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          <PlayCircle className="w-5 h-5" />
          <span>Lanjut</span>
        </Link>

        {/* Tambah Sumber Cepat */}
        {onAddClick && (
          <button
            onClick={onAddClick}
            className="flex flex-col items-center gap-1 py-1 px-3 text-red-500 hover:text-red-400 cursor-pointer"
          >
            <div className="p-1.5 rounded-full bg-red-600 text-white shadow-md shadow-red-600/40">
              <PlusCircle className="w-5 h-5" />
            </div>
            <span className="font-bold text-[9px] text-zinc-300">Tambah</span>
          </button>
        )}

        {/* Kategori */}
        <Link
          href="#kategori"
          onClick={() => setActiveTab("kategori")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === "kategori" ? "text-red-500 font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>Kategori</span>
        </Link>

        {/* Koleksi */}
        <Link
          href="#favorit"
          onClick={() => setActiveTab("koleksi")}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
            activeTab === "koleksi" ? "text-red-500 font-bold" : "text-zinc-400 hover:text-white"
          }`}
        >
          <FolderHeart className="w-5 h-5" />
          <span>Koleksi</span>
        </Link>
      </nav>
    </div>
  );
}
