import React from "react";

export default function AnimeDetailLoading() {
  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col animate-pulse">
      {/* Skeleton Hero */}
      <div className="relative w-full h-[70vh] bg-zinc-900 flex items-end p-8 sm:p-12">
        <div className="space-y-4 max-w-xl w-full">
          <div className="h-6 w-32 bg-zinc-800 rounded-full" />
          <div className="h-12 w-3/4 bg-zinc-800 rounded-xl" />
          <div className="h-4 w-full bg-zinc-800/80 rounded" />
          <div className="h-4 w-2/3 bg-zinc-800/80 rounded" />
          <div className="flex gap-3 pt-2">
            <div className="h-12 w-44 bg-red-900/40 rounded-xl" />
            <div className="h-12 w-32 bg-zinc-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
