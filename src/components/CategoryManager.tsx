"use client";

import React, { useState } from "react";
import {
  FolderHeart,
  Plus,
  Edit2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Film,
  X,
  RefreshCw,
  Search,
  Check,
} from "lucide-react";
import { Anime } from "@/types/anime";
import { MOCK_CATALOG_DATA } from "@/data/mockAnime";

export interface CategoryItem {
  id: string;
  name: string;
  type: "category" | "genre" | "collection";
  sortOrder: number;
  description?: string;
  colorTheme?: string;
  animeIds: string[];
}

interface CategoryManagerProps {
  initialCategories?: CategoryItem[];
  availableAnime?: Anime[];
  onSaveCategory?: (category: CategoryItem) => void;
  onDeleteCategory?: (categoryId: string) => void;
  onReorder?: (categories: CategoryItem[]) => void;
  className?: string;
}

const DEFAULT_MOCK_CATEGORIES: CategoryItem[] = [
  {
    id: "cat-1",
    name: "Sedang Tren Minggu Ini",
    type: "category",
    sortOrder: 1,
    description: "Anime teratas yang sedang ramai ditonton dan dibahas minggu ini.",
    colorTheme: "red",
    animeIds: ["anime-1", "anime-2", "anime-3"],
  },
  {
    id: "cat-2",
    name: "Aksi & Petualangan Penuh Adrenalin",
    type: "genre",
    sortOrder: 2,
    description: "Pertarungan seru, jurus pamungkas, dan kisah kepahlawanan.",
    colorTheme: "amber",
    animeIds: ["anime-2", "anime-3", "anime-4", "anime-5"],
  },
  {
    id: "cat-3",
    name: "Koleksi Maraton Akhir Pekan",
    type: "collection",
    sortOrder: 3,
    description: "Serial yang seru ditonton berturut-turut saat santai di rumah.",
    colorTheme: "purple",
    animeIds: ["anime-6", "anime-7", "anime-8"],
  },
  {
    id: "cat-4",
    name: "Misteri & Sci-Fi Menegangkan",
    type: "genre",
    sortOrder: 4,
    description: "Teka-teki waktu, penyelidikan kasus rumit, dan teknologi masa depan.",
    colorTheme: "blue",
    animeIds: ["anime-10", "anime-11"],
  },
];

const COLOR_OPTIONS = [
  { id: "red", label: "Merah Crimson", bg: "bg-red-600", text: "text-red-400", border: "border-red-500" },
  { id: "amber", label: "Amber Gold", bg: "bg-amber-500", text: "text-amber-400", border: "border-amber-500" },
  { id: "emerald", label: "Hijau Emerald", bg: "bg-emerald-500", text: "text-emerald-400", border: "border-emerald-500" },
  { id: "blue", label: "Biru Neon", bg: "bg-blue-600", text: "text-blue-400", border: "border-blue-500" },
  { id: "purple", label: "Ungu Nebula", bg: "bg-purple-600", text: "text-purple-400", border: "border-purple-500" },
  { id: "rose", label: "Rose Pink", bg: "bg-rose-600", text: "text-rose-400", border: "border-rose-500" },
];

export default function CategoryManager({
  initialCategories = DEFAULT_MOCK_CATEGORIES,
  availableAnime = MOCK_CATALOG_DATA,
  onSaveCategory,
  onDeleteCategory,
  onReorder,
  className = "",
}: CategoryManagerProps) {
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [type, setType] = useState<"category" | "genre" | "collection">("category");
  const [sortOrder, setSortOrder] = useState(1);
  const [description, setDescription] = useState("");
  const [colorTheme, setColorTheme] = useState("red");
  const [selectedAnimeIds, setSelectedAnimeIds] = useState<string[]>([]);

  // Search in list & anime picker
  const [listSearch, setListSearch] = useState("");
  const [animePickerSearch, setAnimePickerSearch] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setName(cat.name);
    setType(cat.type);
    setSortOrder(cat.sortOrder);
    setDescription(cat.description || "");
    setColorTheme(cat.colorTheme || "red");
    setSelectedAnimeIds(cat.animeIds || []);
    setFormError(null);
    window.scrollTo({ top: 300, behavior: "smooth" });
  };

  const handleCancelForm = () => {
    setEditingId(null);
    setName("");
    setType("category");
    setSortOrder(categories.length + 1);
    setDescription("");
    setColorTheme("red");
    setSelectedAnimeIds([]);
    setFormError(null);
  };

  const handleToggleAnimeSelection = (id: string) => {
    setSelectedAnimeIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Nama kategori/koleksi wajib diisi.");
      return;
    }

    if (editingId) {
      // Update existing
      try {
        await fetch(`/api/categories/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            type,
            sortOrder,
            description: description.trim(),
            colorTheme,
            animeIds: selectedAnimeIds,
          }),
        });
      } catch (err) {
        console.warn("Could not sync category update to API:", err);
      }

      const updatedList = categories.map((cat) => {
        if (cat.id === editingId) {
          return {
            ...cat,
            name: name.trim(),
            type,
            sortOrder,
            description: description.trim(),
            colorTheme,
            animeIds: selectedAnimeIds,
          };
        }
        return cat;
      });
      setCategories(updatedList);
      onReorder?.(updatedList);
      onSaveCategory?.(updatedList.find((c) => c.id === editingId)!);
      showToast(`Kategori "${name.trim()}" berhasil diperbarui!`);
    } else {
      // Create new
      let assignedId = `cat-${Date.now()}`;
      try {
        const res = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            type,
            sortOrder: Number(sortOrder) || categories.length + 1,
            description: description.trim(),
            colorTheme,
            animeIds: selectedAnimeIds,
          }),
        });
        if (res.ok) {
          const json = await res.json();
          if (json.data?.id) assignedId = json.data.id;
        }
      } catch (err) {
        console.warn("Could not sync category creation to API:", err);
      }

      const newCategory: CategoryItem = {
        id: assignedId,
        name: name.trim(),
        type,
        sortOrder: Number(sortOrder) || categories.length + 1,
        description: description.trim(),
        colorTheme,
        animeIds: selectedAnimeIds,
      };
      const updatedList = [...categories, newCategory];
      setCategories(updatedList);
      onSaveCategory?.(newCategory);
      onReorder?.(updatedList);
      showToast(`Kategori baru "${name.trim()}" berhasil dibuat!`);
    }

    handleCancelForm();
  };

  const handleDelete = async (id: string, catName: string) => {
    try {
      await fetch(`/api/categories/${id}`, { method: "DELETE" });
    } catch (err) {
      console.warn("Could not sync category delete to API:", err);
    }

    const updatedList = categories.filter((c) => c.id !== id);
    setCategories(updatedList);
    onDeleteCategory?.(id);
    onReorder?.(updatedList);
    if (editingId === id) {
      handleCancelForm();
    }
    showToast(`Kategori "${catName}" telah dihapus.`);
  };

  const handleMoveOrder = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= categories.length) return;

    const copy = [...categories];
    const temp = copy[index];
    copy[index] = copy[newIdx];
    copy[newIdx] = temp;

    // Reassign sortOrder sequentially
    const reordered = copy.map((c, idx) => ({ ...c, sortOrder: idx + 1 }));
    setCategories(reordered);
    onReorder?.(reordered);

    // Persist new order to backend API
    fetch("/api/categories/order", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orders: reordered.map((c) => ({ id: c.id, sortOrder: c.sortOrder })),
      }),
    }).catch((err) => {
      console.warn("Gagal menyimpan urutan kategori ke API:", err);
    });

    showToast("Urutan kategori berhasil diubah!");
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(listSearch.toLowerCase())
  );

  const filteredAvailableAnime = availableAnime.filter((a) =>
    a.title.toLowerCase().includes(animePickerSearch.toLowerCase())
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-emerald-500/50 text-white text-sm font-semibold rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2-Column Grid: Left is Form, Right is List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left (5 cols): Category Form */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-white">
                  {editingId ? "Edit Kategori" : "Buat Kategori Baru"}
                </h3>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                >
                  Batal Edit
                </button>
              )}
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Nama Kategori */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Nama Kategori / Koleksi *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Anime Romcom Populer"
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
                />
              </div>

              {/* Tipe Kategori */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Tipe Pengelompokan
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType("category")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      type === "category"
                        ? "bg-red-600/20 border-red-500 text-red-400"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Kategori
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("genre")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      type === "genre"
                        ? "bg-amber-500/20 border-amber-500 text-amber-400"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Genre
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("collection")}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      type === "collection"
                        ? "bg-purple-500/20 border-purple-500 text-purple-400"
                        : "bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-white"
                    }`}
                  >
                    Koleksi
                  </button>
                </div>
              </div>

              {/* Urutan Tampil */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Urutan Tampil (Sort Order)
                </label>
                <input
                  type="number"
                  min="1"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:border-red-500 outline-none"
                />
              </div>

              {/* Tema Warna Aksen */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Warna Aksen Kategori
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setColorTheme(c.id)}
                      className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-all cursor-pointer ${
                        colorTheme === c.id
                          ? "ring-2 ring-white scale-110 shadow-lg"
                          : "opacity-60 hover:opacity-100"
                      }`}
                      title={c.label}
                    >
                      {colorTheme === c.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deskripsi */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                  Deskripsi Kategori (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Keterangan singkat tentang kelompok anime ini..."
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none resize-none"
                />
              </div>

              {/* Pilih Anime untuk Kategori ini */}
              <div className="space-y-2 pt-2 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider block">
                    Pilih Anime Terkait ({selectedAnimeIds.length} dipilih)
                  </label>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={animePickerSearch}
                    onChange={(e) => setAnimePickerSearch(e.target.value)}
                    placeholder="Cari judul anime untuk ditambahkan..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                  {filteredAvailableAnime.map((anime) => {
                    const isSelected = selectedAnimeIds.includes(anime.id);
                    return (
                      <div
                        key={anime.id}
                        onClick={() => handleToggleAnimeSelection(anime.id)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "bg-red-950/40 border-red-500/50 text-white"
                            : "bg-zinc-950/40 border-zinc-800/80 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="accent-red-600 rounded"
                          />
                          <span className="truncate font-medium">{anime.title}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 shrink-0">
                          {anime.year} • ⭐ {anime.rating || "8.5"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-800 transition-colors cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-lg hover:shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingId ? "Perbarui Kategori" : "Simpan Kategori"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right (7 cols): Categories List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-bold text-white">
                  Daftar Kategori & Urutan Tampil
                </h3>
              </div>

              {/* Search Filter */}
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari dalam daftar..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
                />
              </div>
            </div>

            {/* List items */}
            <div className="space-y-3">
              {filteredCategories.length === 0 ? (
                <div className="py-12 text-center text-xs text-zinc-500">
                  Tidak ada kategori yang cocok dengan pencarian.
                </div>
              ) : (
                filteredCategories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      editingId === cat.id
                        ? "bg-red-950/30 border-red-500/60 ring-1 ring-red-500/40"
                        : "bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-black text-zinc-500">
                          #{cat.sortOrder}
                        </span>
                        <h4 className="font-bold text-sm text-white">{cat.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            cat.type === "genre"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : cat.type === "collection"
                              ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                              : "bg-red-600/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {cat.type}
                        </span>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-zinc-400 line-clamp-1">
                          {cat.description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-zinc-500 pt-1">
                        <Film className="w-3 h-3 text-red-400" />
                        <span>{cat.animeIds.length} Judul Terhubung</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      {/* Move Up */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveOrder(idx, "up")}
                        className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Naikkan Urutan"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      {/* Move Down */}
                      <button
                        type="button"
                        disabled={idx === filteredCategories.length - 1}
                        onClick={() => handleMoveOrder(idx, "down")}
                        className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Turunkan Urutan"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 text-zinc-400 hover:text-amber-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="p-1.5 text-zinc-400 hover:text-red-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
