"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export type ThemePreference = "light" | "dark" | "system";

const STORAGE_KEY = "sparkyq-theme";
const THEME_EVENT = "sparkyq-theme-change";

function getSystemDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function applyThemePreference(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  const isDark = pref === "dark" || (pref === "system" && getSystemDark());
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", isDark ? "#0f172a" : "#f1f5f9");
  }
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncFromStorage = () => {
      const stored = localStorage.getItem(STORAGE_KEY) as ThemePreference | null;
      const pref: ThemePreference =
        stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
      setPreference(pref);
      const isDark = pref === "dark" || (pref === "system" && getSystemDark());
      setResolvedTheme(isDark ? "dark" : "light");
    };

    syncFromStorage();
    setMounted(true);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const stored = (localStorage.getItem(STORAGE_KEY) as ThemePreference | null) ?? "system";
      if (stored === "system") {
        applyThemePreference("system");
        setResolvedTheme(getSystemDark() ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    window.addEventListener(THEME_EVENT, syncFromStorage);
    window.addEventListener("storage", syncFromStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener(THEME_EVENT, syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  function setTheme(next: ThemePreference) {
    localStorage.setItem(STORAGE_KEY, next);
    applyThemePreference(next);
    setPreference(next);
    const isDark = next === "dark" || (next === "system" && getSystemDark());
    setResolvedTheme(isDark ? "dark" : "light");
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  return { preference, resolvedTheme, mounted, setTheme, toggleTheme };
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, mounted, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={
        mounted
          ? `Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`
          : "Toggle theme"
      }
      aria-label="Toggle color theme"
      className={cn(
        "inline-flex items-center justify-center rounded-lg border border-ink-800 bg-ink-900 p-2 text-ink-400 transition hover:border-ink-600 hover:text-ink-50",
        className
      )}
    >
      {mounted && resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4 text-spark-400" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}

export function ThemeSelector() {
  const { preference, mounted, setTheme } = useTheme();

  const options: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ];

  return (
    <div className="inline-flex rounded-lg border border-ink-700 bg-ink-950 p-1">
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = mounted && preference === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={active}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
              active
                ? "bg-ink-900 text-ink-50 shadow-xs ring-1 ring-ink-700"
                : "text-ink-400 hover:text-ink-100"
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", active && "text-spark-400")} />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
