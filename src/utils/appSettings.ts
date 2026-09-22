import { AppSettings, MOCK_SETTINGS } from "@/data/mockSettings";

export const APP_SETTINGS_STORAGE_KEY = "animeku_app_settings";

/**
 * Mengambil preferensi pengaturan aplikasi dari localStorage
 * dengan fallback ke nilai bawaan (MOCK_SETTINGS).
 */
export function getStoredAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return MOCK_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(APP_SETTINGS_STORAGE_KEY);
    if (!raw) {
      return MOCK_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      ...MOCK_SETTINGS,
      ...parsed,
    };
  } catch (err) {
    console.warn("Gagal membaca pengaturan dari localStorage:", err);
    return MOCK_SETTINGS;
  }
}

/**
 * Menyimpan preferensi pengaturan aplikasi ke localStorage
 * dan menyiarkan event global agar komponen lain langsung sinkron.
 */
export function saveStoredAppSettings(partial: Partial<AppSettings>): AppSettings {
  if (typeof window === "undefined") {
    return { ...MOCK_SETTINGS, ...partial };
  }

  try {
    const current = getStoredAppSettings();
    const updated: AppSettings = {
      ...current,
      ...partial,
    };

    localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(updated));

    // Sinkronkan juga tema ke theme storage key jika ada
    if (partial.theme) {
      localStorage.setItem("animeku_theme_preference", partial.theme);
    }

    // Broadcast global custom event
    window.dispatchEvent(
      new CustomEvent("animeku:settings_updated", {
        detail: updated,
      })
    );

    return updated;
  } catch (err) {
    console.warn("Gagal menyimpan preferensi ke localStorage:", err);
    return { ...MOCK_SETTINGS, ...partial };
  }
}

/**
 * Reset seluruh preferensi pengaturan kembali ke setelan default pabrik
 */
export function resetStoredAppSettings(): AppSettings {
  if (typeof window === "undefined") {
    return MOCK_SETTINGS;
  }

  try {
    localStorage.setItem(APP_SETTINGS_STORAGE_KEY, JSON.stringify(MOCK_SETTINGS));
    localStorage.setItem("animeku_theme_preference", MOCK_SETTINGS.theme);

    window.dispatchEvent(
      new CustomEvent("animeku:settings_updated", {
        detail: MOCK_SETTINGS,
      })
    );

    return MOCK_SETTINGS;
  } catch (err) {
    console.warn("Gagal reset pengaturan:", err);
    return MOCK_SETTINGS;
  }
}

/**
 * Mengambil pengaturan dari server database via API /api/settings
 * dan menyinkronkannya dengan cache lokal.
 */
export async function fetchRemoteAppSettings(): Promise<AppSettings> {
  try {
    const res = await fetch("/api/settings", { cache: "no-store" });
    const data = await res.json();
    if (data.success && data.settings) {
      saveStoredAppSettings(data.settings);
      return data.settings;
    }
  } catch (err) {
    console.warn("Gagal memuat pengaturan dari server, menggunakan cache lokal:", err);
  }
  return getStoredAppSettings();
}

/**
 * Menyimpan pengaturan ke server database via API /api/settings
 */
export async function syncAppSettingsToRemote(settings: Partial<AppSettings>): Promise<boolean> {
  try {
    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (err) {
    console.warn("Gagal sinkronisasi pengaturan ke server:", err);
    return false;
  }
}
