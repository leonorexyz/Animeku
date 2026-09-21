const STORAGE_KEY = "animeku_search_history";
const MAX_HISTORY = 10;

export function getSearchHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to read search history from localStorage", err);
    return [];
  }
}

export function addSearchHistory(query: string): string[] {
  if (typeof window === "undefined") return [];
  const clean = query.trim();
  if (!clean || clean.length < 2) return getSearchHistory();

  try {
    const current = getSearchHistory();
    // Remove if already exists so it moves to front
    const filtered = current.filter((item) => item.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...filtered].slice(0, MAX_HISTORY);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch event to sync across components
    window.dispatchEvent(
      new CustomEvent("animeku:search_history_updated", {
        detail: { history: updated },
      })
    );

    // Sync ke API di latar belakang
    fetch("/api/search/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword: clean }),
    }).catch(() => {});

    return updated;
  } catch (err) {
    console.error("Failed to update search history in localStorage", err);
    return [];
  }
}

export function removeSearchHistoryItem(query: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const current = getSearchHistory();
    const updated = current.filter((item) => item.toLowerCase() !== query.toLowerCase());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(
      new CustomEvent("animeku:search_history_updated", {
        detail: { history: updated },
      })
    );

    // Sync ke API di latar belakang
    fetch(`/api/search/history?keyword=${encodeURIComponent(query)}`, {
      method: "DELETE",
    }).catch(() => {});

    return updated;
  } catch (err) {
    console.error("Failed to remove search history item", err);
    return [];
  }
}

export function clearSearchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent("animeku:search_history_updated", {
        detail: { history: [] },
      })
    );

    // Sync ke API di latar belakang
    fetch("/api/search/history?action=clear", {
      method: "DELETE",
    }).catch(() => {});
  } catch (err) {
    console.error("Failed to clear search history", err);
  }
}

export async function syncSearchHistoryFromApi(): Promise<{
  history: string[];
  trending: string[];
}> {
  if (typeof window === "undefined") return { history: [], trending: [] };
  try {
    const res = await fetch("/api/search/history");
    const data = await res.json();
    if (data.success && Array.isArray(data.history)) {
      if (data.history.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.history));
      }
      return {
        history: data.history,
        trending: data.trending || [],
      };
    }
  } catch (err) {
    console.error("Failed to fetch search history from API", err);
  }
  return {
    history: getSearchHistory(),
    trending: [],
  };
}

