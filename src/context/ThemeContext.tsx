"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "dark" | "light" | "netflix" | "oled" | "system";
export type ResolvedTheme = "dark" | "light" | "oled";

interface ThemeContextValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleDarkMode: () => void;
}

const THEME_STORAGE_KEY = "animeku_theme_preference";

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("netflix");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");
  const [mounted, setMounted] = useState(false);

  // Baca preferensi tersimpan saat komponen di-mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null;
      if (saved && ["dark", "light", "netflix", "oled", "system"].includes(saved)) {
        setThemeState(saved);
      } else {
        setThemeState("netflix");
      }
    } catch {
      setThemeState("netflix");
    }
    setMounted(true);
  }, []);

  // Terapkan class dan dataset ke elemen HTML
  useEffect(() => {
    if (!mounted) return;

    let effectiveTheme: ResolvedTheme = "dark";

    if (theme === "system") {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      effectiveTheme = systemDark ? "dark" : "light";
    } else if (theme === "light") {
      effectiveTheme = "light";
    } else if (theme === "oled") {
      effectiveTheme = "oled";
    } else {
      effectiveTheme = "dark";
    }

    setResolvedTheme(effectiveTheme);

    const root = document.documentElement;
    root.classList.remove("light", "dark", "oled");

    if (effectiveTheme === "light") {
      root.classList.add("light");
      root.setAttribute("data-theme", "light");
      root.style.colorScheme = "light";
    } else if (effectiveTheme === "oled") {
      root.classList.add("dark", "oled");
      root.setAttribute("data-theme", "oled");
      root.style.colorScheme = "dark";
    } else {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
      root.style.colorScheme = "dark";
    }

    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
      window.dispatchEvent(
        new CustomEvent("animeku:theme_changed", {
          detail: { theme, resolvedTheme: effectiveTheme },
        })
      );
    } catch (e) {
      console.warn("Gagal menyimpan preferensi tema ke localStorage", e);
    }
  }, [theme, mounted]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleDarkMode = () => {
    if (resolvedTheme === "light") {
      setThemeState("netflix");
    } else {
      setThemeState("light");
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        setTheme,
        toggleDarkMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback safe defaults if used outside provider
    return {
      theme: "netflix" as ThemeMode,
      resolvedTheme: "dark" as ResolvedTheme,
      setTheme: () => {},
      toggleDarkMode: () => {},
    };
  }
  return context;
}
