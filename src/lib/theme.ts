import { useState } from "react";

const KEY = "theme";
export type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function initTheme() {
  applyTheme(getInitialTheme());
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    localStorage.setItem(KEY, next);
    applyTheme(next);
    setTheme(next);
  };

  return { theme, toggle };
}