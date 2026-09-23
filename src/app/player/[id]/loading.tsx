import React from "react";
import { Film } from "lucide-react";

export default function PlayerLoading() {
  return (
    <div className="w-full h-screen bg-black flex flex-col items-center justify-center space-y-4 select-none">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center animate-pulse">
          <Film className="w-8 h-8 text-red-500 animate-spin" style={{ animationDuration: "3s" }} />
        </div>
      </div>
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-white tracking-wide">Memuat Pemutar Video...</p>
        <p className="text-xs text-zinc-500 font-medium">Menyiapkan tayangan anime</p>
      </div>
    </div>
  );
}
