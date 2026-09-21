"use client";

import React, { useState, useEffect } from "react";
import {
  FolderHeart,
  Plus,
  Check,
  X,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
  Tag,
  RefreshCw,
  Film,
} from "lucide-react";
import { Anime } from "@/types/anime";

export interface CategoryOption {
  id: string;
  name: string;
  type: "category" | "genre" | "collection";
  color?: string;
}

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  // Kategori Umum
  { id: "cat-trending", name: "Sedang Tren", type: "category", color: "red" },
  { id: "cat-ongoing", name: "Sedang Tayang (Ongoing)", type: "category", color: "emerald" },
  { id: "cat-completed", name: "Tamat (Completed)", type: "category", color: "blue" },
  { id: "cat-featured", name: "Pilihan Editor (Featured)", type: "category", color: "purple" },

  // Genre Populer
  { id: "gnr-action", name: "Aksi", type: "genre", color: "amber" },
  { id: "gnr-adventure", name: "Petualangan", type: "genre", color: "amber" },
  { id: "gnr-fantasy", name: "Fantasi", type: "genre", color: "amber" },
  { id: "gnr-comedy", name: "Komedi", type: "genre", color: "amber" },
  { id: "gnr-drama", name: "Drama", type: "genre", color: "amber" },
  { id: "gnr-romance", name: "Romantis", type: "genre", color: "amber" },
  { id: "gnr-scifi", name: "Sci-Fi", type: "genre", color: "amber" },
  { id: "gnr-mystery", name: "Misteri", type: "genre", color: "amber" },
  { id: "gnr-sliceoflife", name: "Slice of Life", type: "genre", color: "amber" },
  { id: "gnr-supernatural", name: "Supernatural", type: "genre", color: "amber" },

  // Koleksi Kustom
  { id: "col-marathon", name: "Maraton Akhir Pekan", type: "collection", color: "purple" },
  { id: "col-masterpiece", name: "Rating Tertinggi (Masterpiece)", type: "collection", color: "purple" },
  { id: "col-comfort", name: "Tontonan Santai (Comfort Watch)", type: "collection", color: "purple" },
  { id: "col-dark", name: "Plot Gelap & Psikologis", type: "collection", color: "purple" },
];

interface AnimeCategoryPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: Anime;
  initialSelectedCategoryIds?: string[];
  onSave?: (selectedCategories: CategoryOption[]) => void;
  className?: string;
}

export default function AnimeCategoryPickerModal({
  isOpen,
  onClose,
  anime,
  initialSelectedCategoryIds = [],
  onSave,
  className = "",
}: AnimeCategoryPickerModalProps) {
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedCategoryIds);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "category" | "genre" | "collection">("all");

  // Inline Quick Add Category
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatType, setNewCatType] = useState<"category" | "genre" | "collection">("collection");
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize selected IDs from anime genres or initial props
  useEffect(() => {
    if (initialSelectedCategoryIds.length > 0) {
      setSelectedIds(initialSelectedCategoryIds);
    } else if (anime && anime.genres) {
      // Map existing genres from anime to IDs
      const matched = DEFAULT_CATEGORY_OPTIONS.filter((c) =>
        anime.genres.some((g) => g.toLowerCase() === c.name.toLowerCase())
      ).map((c) => c.id);
      setSelectedIds(matched);
    }
  }, [anime, initialSelectedCategoryIds]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleRemoveChip = (id: string) => {
    setSelectedIds((prev) => prev.filter((item) => item !== id));
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newCategory: CategoryOption = {
      id: newId,
      name: newCatName.trim(),
      type: newCatType,
      color: newCatType === "genre" ? "amber" : newCatType === "collection" ? "purple" : "red",
    };

    setCategories((prev) => [newCategory, ...prev]);
    setSelectedIds((prev) => [...prev, newId]);
    setNewCatName("");
    setShowQuickAdd(false);
    showToast(`Kategori "${newCategory.name}" berhasil dibuat dan ditambahkan!`);
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const chosen = categories.filter((c) => selectedIds.includes(c.id));
      onSave?.(chosen);
      showToast("Kategori anime berhasil disimpan!");
      setTimeout(() => {
        onClose();
      }, 600);
    }, 500);
  };

  const filtered = categories.filter((c) => {
    if (activeTab !== "all" && c.type !== activeTab) return false;
    if (searchQuery.trim()) {
      return c.name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const selectedCategories = categories.filter((c) => selectedIds.includes(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div
        className={`bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 max-h-[90vh] flex flex-col ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <img
              src={anime.posterUrl}
              alt={anime.title}
              className="w-12 h-16 object-cover rounded-lg border border-zinc-700 shadow-md shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <FolderHeart className="w-4 h-4 text-red-500" />
                <h3 className="text-base font-bold text-white leading-tight">
                  Atur Kategori & Koleksi
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1 font-semibold truncate max-w-xs sm:max-w-sm">
                {anime.title} ({anime.year})
              </p>
              <p className="text-[11px] text-zinc-500">
                Pilih beberapa kategori, genre, atau koleksi untuk anime ini.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Currently Selected Chips */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-300">
              Kategori Terpilih ({selectedCategories.length})
            </span>
            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-[11px] text-red-400 hover:text-red-300 font-medium cursor-pointer"
              >
                Hapus Semua
              </button>
            )}
          </div>

          <div className="min-h-[42px] p-2 rounded-xl bg-zinc-950/70 border border-zinc-800/80 flex flex-wrap items-center gap-1.5 max-h-24 overflow-y-auto scrollbar-none">
            {selectedCategories.length === 0 ? (
              <span className="text-xs text-zinc-500 italic px-2">
                Belum ada kategori yang dipilih untuk anime ini.
              </span>
            ) : (
              selectedCategories.map((c) => (
                <span
                  key={c.id}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                    c.type === "genre"
                      ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                      : c.type === "collection"
                      ? "bg-purple-500/10 text-purple-300 border-purple-500/30"
                      : "bg-red-600/10 text-red-300 border-red-500/30"
                  }`}
                >
                  <span>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(c.id)}
                    className="hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* Filter Controls & Search */}
        <div className="space-y-2">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-xl overflow-x-auto scrollbar-none text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("genre")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "genre"
                  ? "bg-amber-500 text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Genre
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("category")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "category"
                  ? "bg-red-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Kategori Umum
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("collection")}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === "collection"
                  ? "bg-purple-600 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Koleksi Kustom
            </button>
          </div>

          {/* Search bar & Quick Add button */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari kategori atau genre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-red-500 outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-red-400" />
              <span>Kategori Baru</span>
            </button>
          </div>

          {/* Inline Quick Add Category Form */}
          {showQuickAdd && (
            <form
              onSubmit={handleQuickAdd}
              className="p-3 rounded-xl bg-zinc-950 border border-red-500/40 space-y-2 animate-in fade-in"
            >
              <span className="text-[11px] font-bold text-zinc-300 block">
                Tambah Kategori / Koleksi Kustom Cepat:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nama kategori..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                />
                <select
                  value={newCatType}
                  onChange={(e) => setNewCatType(e.target.value as any)}
                  className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-zinc-300 outline-none cursor-pointer"
                >
                  <option value="collection">Koleksi</option>
                  <option value="genre">Genre</option>
                  <option value="category">Kategori</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                >
                  Tambah
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Multi-Selection Checkbox List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 max-h-56 pr-1 scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-xs text-zinc-500">
              Tidak ada kategori yang sesuai dengan pencarian "{searchQuery}".
            </div>
          ) : (
            filtered.map((cat) => {
              const isChecked = selectedIds.includes(cat.id);
              return (
                <div
                  key={cat.id}
                  onClick={() => handleToggle(cat.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    isChecked
                      ? "bg-red-950/40 border-red-500/60 text-white"
                      : "bg-zinc-950/50 border-zinc-800/80 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-950"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                        isChecked
                          ? "bg-red-600 border-red-500 text-white"
                          : "border-zinc-700 bg-zinc-900"
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="font-semibold truncate">{cat.name}</span>
                  </div>

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
              );
            })
          )}
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-red-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Kategori ({selectedIds.length})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
