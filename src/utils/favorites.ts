const FAVORITES_STORAGE_KEY = "animeku_user_favorites";

export function getFavoriteAnimeIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read favorites from localStorage", err);
    return [];
  }
}

export function isAnimeFavorite(animeId: string): boolean {
  const favs = getFavoriteAnimeIds();
  return favs.includes(animeId);
}

export function toggleFavoriteAnime(animeId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const favs = getFavoriteAnimeIds();
    const index = favs.indexOf(animeId);
    let isNowFav = false;
    let updated: string[];

    if (index >= 0) {
      updated = favs.filter((id) => id !== animeId);
      isNowFav = false;
    } else {
      updated = [...favs, animeId];
      isNowFav = true;
    }

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event so other components across the window can react instantly
    window.dispatchEvent(
      new CustomEvent("animeku:favorites_updated", {
        detail: { animeId, isFavorite: isNowFav, allFavorites: updated },
      })
    );

    // Optimistically sync to backend API if available
    fetch(`/api/favorites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ animeId, action: isNowFav ? "add" : "remove" }),
    }).catch(() => {
      // Ignore background sync errors gracefully
    });

    return isNowFav;
  } catch (err) {
    console.error("Failed to toggle favorite in localStorage", err);
    return false;
  }
}

export async function syncFavoritesFromApi(): Promise<string[]> {
  if (typeof window === "undefined") return [];
  try {
    const res = await fetch("/api/favorites");
    const json = await res.json();
    if (json.success && Array.isArray(json.favoriteIds)) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(json.favoriteIds));
      return json.favoriteIds;
    }
  } catch (err) {
    console.error("Failed to sync favorites from API", err);
  }
  return getFavoriteAnimeIds();
}
