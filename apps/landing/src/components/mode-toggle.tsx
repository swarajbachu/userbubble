"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "@/icons/general";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [systemTheme, setSystemTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const SWITCH = () => {
    switch (theme) {
      case "light":
        setTheme("dark");
        break;
      case "dark":
        setTheme("light");
        break;
      case "system":
        setTheme(systemTheme === "light" ? "dark" : "light");
        break;
      default:
        break;
    }
  };

  return (
    <button
      className="relative flex cursor-pointer items-center justify-center rounded-xl p-2 text-neutral-500 hover:shadow-input dark:text-neutral-500"
      onClick={SWITCH}
      type="button"
    >
      <SunIcon className="dark:-rotate-90 size-4 rotate-0 scale-100 text-gray-600 transition-all dark:scale-0 dark:text-gray-300" />
      <MoonIcon className="absolute size-4 rotate-90 scale-0 text-gray-600 transition-all dark:rotate-0 dark:scale-100 dark:text-gray-300" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
