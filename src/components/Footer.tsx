import React from "react";
import { Film, Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-black/60 mt-16 py-12 px-4 sm:px-6 lg:px-8 text-zinc-500 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Film className="w-4 h-4 text-red-500" />
          <span className="font-bold tracking-wider text-zinc-300">ANIMEKU PLAYER</span>
          <span>— Pemutar anime personal bergaya Netflix</span>
        </div>

        <div className="flex items-center space-x-6">
          <span>Katalog Lokal & Cloud</span>
          <span>Fase 1: Fondasi Menonton</span>
        </div>
      </div>
    </footer>
  );
}
