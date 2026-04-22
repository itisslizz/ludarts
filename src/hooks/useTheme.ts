"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "purple";

const THEME_KEY = "autodarts-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Load theme from localStorage
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    if (stored && ["light", "dark", "purple"].includes(stored)) {
      setThemeState(stored);
      applyTheme(stored);
    } else {
      // Default to dark
      applyTheme("dark");
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_KEY, newTheme);
    applyTheme(newTheme);
  };

  return { theme, setTheme };
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  
  // Remove all theme classes
  root.classList.remove("light", "dark", "purple");
  
  // Add the selected theme class
  root.classList.add(theme);
}
