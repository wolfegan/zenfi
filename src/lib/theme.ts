import { useState, useEffect } from "react";

export type ThemeMode = "dark" | "light";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem("zenfi_theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch (e) {
    console.error("Error reading theme from localStorage", e);
  }
  
  if (document.documentElement.classList.contains("dark")) return "dark";
  
  if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  
  return "light";
}

export function setStoredTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("zenfi_theme", theme);
  } catch (e) {
    console.error("Error saving theme to localStorage", e);
  }

  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  window.dispatchEvent(new CustomEvent("zenfi:theme-change", { detail: theme }));
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());

  useEffect(() => {
    // Initial sync
    const current = getStoredTheme();
    if (current === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setThemeState(current);

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<ThemeMode>;
      if (customEvent.detail === "dark" || customEvent.detail === "light") {
        setThemeState(customEvent.detail);
      }
    };

    window.addEventListener("zenfi:theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("zenfi:theme-change", handleThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setStoredTheme(next);
  };

  const setTheme = (next: ThemeMode) => {
    setStoredTheme(next);
  };

  return {
    theme,
    isDark: theme === "dark",
    toggleTheme,
    setTheme,
  };
}
