"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Heart, HardDrive } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Beranda", icon: Home, isActive: pathname === "/" },
    { href: "/search", label: "Katalog", icon: Compass, isActive: pathname === "/search" },
    { href: "/favorites", label: "Koleksi Saya", icon: Heart, isActive: pathname === "/favorites" || pathname === "/favorit" },
    { href: "/sources", label: "Sumber Media", icon: HardDrive, isActive: pathname === "/sources" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141414]/95 backdrop-blur-lg border-t border-white/10 pb-safe">
      <nav className="flex items-center justify-around py-2 px-1 text-[10px] font-medium">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                item.isActive ? "text-red-500 font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
