"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AnimeCard from "@/components/AnimeCard";
import {
  MOCK_CATEGORIES,
  MOCK_CATALOG_DATA,
  MOCK_CONTINUE_WATCHING,
} from "@/data/mockAnime";
import { Anime } from "@/types/anime";
import {
  FolderHeart,
  Plus,
  Compass,
  CheckCircle2,
  ChevronRight,
  X,
  RefreshCw,
} from "lucide-react";

interface CategoryWithMeta {
  id: string;
  name: string;
  type: "category" | "genre" | "collection";
  sortOrder: number;
  description?: string;
  items: Anime[];
}

const INITIAL_MOCK_SECTIONS: CategoryWithMeta[] = [
  {
    id: "cat-trending",
    name: "Sedang Tren Minggu Ini",
    type: "category",
    sortOrder: 1,
    description: "Anime paling banyak ditonton dan dibicarakan komunitas minggu ini.",
    items: [
      MOCK_CATALOG_DATA[0],
      MOCK_CATALOG_DATA[1],
      MOCK_CATALOG_DATA[2],
      MOCK_CONTINUE_WATCHING[0],
      MOCK_CATALOG_DATA[3],
    ],
  },
  {
    id: "cat-action",
    name: "Aksi & Petualangan Penuh Adrenalin",
    type: "genre",
    sortOrder: 2,
    description: "Pertarungan epik, sihir tingkat tinggi, dan petualangan tanpa henti.",
    items: [
      MOCK_CONTINUE_WATCHING[1],
      MOCK_CONTINUE_WATCHING[2],
      MOCK_CATALOG_DATA[0],
      MOCK_CATALOG_DATA[4],
      MOCK_CONTINUE_WATCHING[3],
    ],
  },
  {
    id: "cat-fantasy",
    name: "Dunia Isekai & Fantasi Epik",
    type: "genre",
    sortOrder: 3,
    description: "Penjelajahan dimensi lain, dungeon crawler, dan sihir fantasi.",
    items: [
      MOCK_CONTINUE_WATCHING[0],
      MOCK_CONTINUE_WATCHING[2],
      MOCK_CATALOG_DATA[0],
      MOCK_CATALOG_DATA[5],
    ],
  },
  {
    id: "cat-drama",
    name: "Drama, Slice of Life & Romantis",
    type: "genre",
    sortOrder: 4,
    description: "Kisah hangat persahabatan, cinta remaja, dan perjalanan hidup emosional.",
    items: [
      MOCK_CATALOG_DATA[1],
      MOCK_CATALOG_DATA[2],
      MOCK_CATALOG_DATA[5],
      MOCK_CATALOG_DATA[7],
      MOCK_CONTINUE_WATCHING[0],
    ],
  },
  {
    id: "cat-mystery",
    name: "Misteri & Sci-Fi Menegangkan",
    type: "genre",
    sortOrder: 5,
    description: "Konspirasi rumit, perjalanan waktu, dan investigasi detektif beroktan tinggi.",
    items: [
      MOCK_CATALOG_DATA[5],
      MOCK_CATALOG_DATA[6],
      MOCK_CATALOG_DATA[1],
      MOCK_CONTINUE_WATCHING[3],
      MOCK_CATALOG_DATA[4],
    ],
  },
  {
    id: "col-weekend",
    name: "Koleksi Nonton Maraton Akhir Pekan",
    type: "collection",
    sortOrder: 6,
    description: "Serial pilihan yang tamat dan cocok dinikmati sekaligus dalam satu hari.",
    items: [
      MOCK_CATALOG_DATA[2],
      MOCK_CATALOG_DATA[4],
      MOCK_CATALOG_DATA[6],
      MOCK_CATALOG_DATA[7],
    ],
  },
  {
    id: "col-masterpiece",
    name: "Koleksi Rating Tertinggi (Masterpiece)",
    type: "collection",
    sortOrder: 7,
    description: "Karya animasi dengan skor di atas 8.8 di komunitas internasional.",
    items: [
      MOCK_CONTINUE_WATCHING[0],
      MOCK_CATALOG_DATA[6],
      MOCK_CONTINUE_WATCHING[3],
      MOCK_CATALOG_DATA[2],
      MOCK_CATALOG_DATA[5],
    ],
  },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithMeta[]>(INITIAL_MOCK_SECTIONS);
  const [activeTab, setActiveTab] = useState<"all" | "category" | "genre" | "collection">("all");
  const [searchFilter, setSearchFilter] = useState("");
  const [selectedSort, setSelectedSort] = useState<"order" | "name" | "count">("order");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State: Create Category
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"category" | "genre" | "collection">("category");
  const [newCatDescription, setNewCatDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Try fetching API data, falling back smoothly to mock data
  useEffect(() => {
    async function fetchApiCategories() {
      try {
        const res = await fetch("/api/categories");
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const apiSections: CategoryWithMeta[] = json.data.map(
              (item: any, idx: number) => ({
                id: item.id || `api-cat-${idx}`,
                name: item.name,
                type: item.type || "category",
                sortOrder: idx + 1,
                description: `Koleksi anime untuk kategori ${item.name}`,
                items: Array.isArray(item.items) && item.items.length > 0
                  ? item.items
                  : MOCK_CATEGORIES[idx % MOCK_CATEGORIES.length]?.items || [],
              })
            );
            // Gabungkan dengan koleksi mock kustom agar pengalaman lengkap
            setCategories([
              ...apiSections,
              ...INITIAL_MOCK_SECTIONS.filter((s) => s.type === "collection"),
            ]);
          }
        }
      } catch (err) {
        console.warn("API categories offline, using rich mock data fallback:", err);
      }
    }
    fetchApiCategories();
  }, []);

  // Filter based on tab & search query
  const filteredCategories = categories
    .filter((cat) => {
      if (activeTab === "all") return true;
      return cat.type === activeTab;
    })
    .filter((cat) => {
      if (!searchFilter.trim()) return true;
      const query = searchFilter.toLowerCase();
      const matchName = cat.name.toLowerCase().includes(query);
      const matchItem = cat.items.some((item) =>
        item.title.toLowerCase().includes(query)
      );
      return matchName || matchItem;
    })
    .sort((a, b) => {
      if (selectedSort === "name") return a.name.localeCompare(b.name);
      if (selectedSort === "count") return b.items.length - a.items.length;
      return a.sortOrder - b.sortOrder;
    });

  const totalAnimeCount = Array.from(
    new Set(categories.flatMap((c) => c.items.map((i) => i.id)))
  ).length;

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast("Nama kategori/koleksi wajib diisi!");
      return;
    }

    setIsSubmitting(true);

    try {
      // Send to API in background
      await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCatName.trim(),
          type: newCatType === "collection" ? "category" : newCatType,
          sortOrder: categories.length + 1,
        }),
      }).catch(() => {});
    } catch {}

    const createdSection: CategoryWithMeta = {
      id: `custom-cat-${Date.now()}`,
      name: newCatName.trim(),
      type: newCatType,
      sortOrder: categories.length + 1,
      description: newCatDescription.trim() || `Koleksi khusus buatan pengguna: ${newCatName.trim()}`,
      items: [MOCK_CATALOG_DATA[0], MOCK_CATALOG_DATA[1]], // default sample items
    };

    setCategories((prev) => [createdSection, ...prev]);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setNewCatName("");
    setNewCatDescription("");
    showToast(`Kategori "${createdSection.name}" berhasil dibuat!`);
  };

  return (
    <div className="min-h-screen bg-[#141414] text-white flex flex-col selection:bg-red-600 selection:text-white">
      <Navbar />

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-red-500/50 text-white text-sm font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Section */}
      <section className="relative pt-28 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-8 border-b border-zinc-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/10 border border-red-500/20 text-red-400 text-xs font-semibold mb-3">
              <FolderHeart className="w-3.5 h-3.5" />
              <span>Pustaka & Pengelompokan Anime</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Koleksi & Kategori
            </h1>
            <p className="text-zinc-400 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
              Jelajahi seluruh anime Anda berdasarkan genre favorit, kurasi tren mingguan,
              dan koleksi khusus yang dipersonalisasi ala antarmuka Netflix.
            </p>
          </div>

          {/* Quick Action & Stats Cards */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-lg hover:shadow-red-600/30 hover:scale-105 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Kategori Baru</span>
            </button>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 text-center min-w-[90px] backdrop-blur-sm">
              <span className="text-2xl font-black text-red-500 block">
                {categories.length}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Grup / Kategori
              </span>
            </div>

            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-3.5 sm:p-4 text-center min-w-[90px] backdrop-blur-sm">
              <span className="text-2xl font-black text-emerald-400 block">
                {totalAnimeCount}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                Total Judul
              </span>
            </div>
          </div>
        </div>

        {/* Filter Bar & Controls */}
        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === "all"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              Semua ({categories.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("genre")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === "genre"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              Genre ({categories.filter((c) => c.type === "genre").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("category")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === "category"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              Kategori Umum ({categories.filter((c) => c.type === "category").length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("collection")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                activeTab === "collection"
                  ? "bg-red-600 text-white shadow-md shadow-red-600/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              Koleksi Kustom ({categories.filter((c) => c.type === "collection").length})
            </button>
          </div>

          {/* Search within Categories & Sort selector */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <input
                type="text"
                placeholder="Cari kategori atau judul..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedSort}
              onChange={(e) => setSelectedSort(e.target.value as any)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:border-red-500 outline-none cursor-pointer"
            >
              <option value="order">Urutkan: Default</option>
              <option value="name">Urutkan: Nama (A-Z)</option>
              <option value="count">Urutkan: Jumlah Judul</option>
            </select>
          </div>
        </div>
      </section>

      {/* Main Categories Sections List */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-20 space-y-12">
        {filteredCategories.length === 0 ? (
          <div className="py-20 text-center bg-zinc-900/30 border border-zinc-800/60 rounded-3xl p-8 max-w-lg mx-auto">
            <Compass className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">Tidak ada kategori ditemukan</h3>
            <p className="text-xs text-zinc-400 mt-1">
              Coba kata kunci pencarian lain atau pilih tab kategori yang berbeda.
            </p>
            <button
              onClick={() => {
                setSearchFilter("");
                setActiveTab("all");
              }}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold rounded-xl text-white transition-colors cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredCategories.map((section) => (
            <div key={section.id} className="space-y-4">
              {/* Category Header Row */}
              <div className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-6 rounded-full ${
                      section.type === "genre"
                        ? "bg-amber-500"
                        : section.type === "collection"
                        ? "bg-purple-500"
                        : "bg-red-600"
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {section.name}
                      </h2>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          section.type === "genre"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : section.type === "collection"
                            ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                            : "bg-red-600/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {section.type === "genre"
                          ? "Genre"
                          : section.type === "collection"
                          ? "Koleksi"
                          : "Kategori"}
                      </span>
                    </div>
                    {section.description && (
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {section.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 font-medium hidden sm:inline">
                    {section.items.length} Judul
                  </span>
                  <Link
                    href={`/search?genre=${encodeURIComponent(section.name)}`}
                    className="flex items-center gap-1 text-xs font-bold text-red-500 hover:text-red-400 transition-colors"
                  >
                    <span>Lihat Semua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Anime Cards Horizontal Row / Responsive Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {section.items.map((anime) => (
                  <AnimeCard key={`${section.id}-${anime.id}`} anime={anime} />
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal Buat Kategori Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-white">
                  Buat Kategori / Koleksi Baru
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Nama Kategori / Koleksi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Anime Favorit 2024, Mecha & Robot..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Jenis Pengelompokan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewCatType("category")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newCatType === "category"
                        ? "bg-red-600/20 border-red-500 text-red-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Kategori
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType("genre")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newCatType === "genre"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Genre
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCatType("collection")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      newCatType === "collection"
                        ? "bg-purple-500/20 border-purple-500 text-purple-400"
                        : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Koleksi
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 block">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Ceritakan tujuan atau isi kurasi koleksi ini..."
                  value={newCatDescription}
                  onChange={(e) => setNewCatDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-red-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Simpan Kategori</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
