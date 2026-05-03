"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

export const THEMES = [
  { id: "dark-pink",   label: "Dark Pink",   dark: true,  accent: "#E91E63" },
  { id: "light-pink",  label: "Light Pink",  dark: false, accent: "#E91E63" },
  { id: "dark-purple", label: "Dark Purple", dark: true,  accent: "#9C27B0" },
  { id: "light-purple",label: "Light Purple",dark: false, accent: "#9C27B0" },
  { id: "dark-blue",   label: "Dark Blue",   dark: true,  accent: "#3B82F6" },
  { id: "light-blue",  label: "Light Blue",  dark: false, accent: "#3B82F6" },
] as const;

export type ThemeId = (typeof THEMES)[number]["id"];

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  localStorage.setItem("theme", id);
}

export function useTheme() {
  const [active, setActive] = useState<ThemeId>("dark-pink");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) setActive(saved);
  }, []);

  function apply(id: ThemeId) {
    applyTheme(id);
    setActive(id);
  }

  return { active, apply };
}

interface ThemePickerDropdownProps {
  onClose: () => void;
}

export function ThemePickerDropdown({ onClose }: Readonly<ThemePickerDropdownProps>) {
  const { active, apply } = useTheme();

  return (
    <div className="py-1">
      {THEMES.map((t) => (
        <button
          key={t.id}
          onClick={() => { apply(t.id); onClose(); }}
          className={cn(
            "w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-colors",
            active === t.id
              ? "bg-primary/15 text-primary font-medium"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
          )}
        >
          <span
            className="size-3.5 rounded-full shrink-0"
            style={{ background: t.accent }}
          />
          {t.dark ? <Moon className="size-3 shrink-0 opacity-60" /> : <Sun className="size-3 shrink-0 opacity-60" />}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Legacy export so any old import doesn't break
export function ThemePicker() {
  const { active, apply } = useTheme();
  return (
    <div className="flex items-center gap-2">
      {THEMES.map((t) => (
        <button
          key={t.id}
          title={t.label}
          onClick={() => apply(t.id)}
          className={cn(
            "size-5 rounded-full border-2 transition-all hover:scale-110",
            active === t.id ? "border-white/80 scale-110" : "border-transparent",
          )}
          style={{ background: t.accent }}
        />
      ))}
    </div>
  );
}
