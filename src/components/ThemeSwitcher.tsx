"use client";

import { useTheme, type Theme } from "@/hooks/useTheme";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: "light", label: "Light", icon: "☀️" },
    { value: "dark", label: "Dark", icon: "🌙" },
    { value: "purple", label: "Purple", icon: "🟣" },
  ];

  return (
    <div className="flex gap-3">
      {themes.map((t) => (
        <button
          key={t.value}
          onClick={() => setTheme(t.value)}
          className={`flex items-center gap-2 rounded-xl px-5 py-3 text-lg font-medium transition-colors ${
            theme === t.value
              ? "bg-green-600 text-white"
              : "bg-zinc-200 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 purple:bg-purple-900/50 purple:text-purple-200 purple:hover:bg-purple-800/50"
          }`}
          title={t.label}
        >
          <span className="text-xl">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}
