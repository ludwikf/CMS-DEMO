"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = theme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-[10px] transition-all duration-300 bg-[#f3f3f3] text-gray-600 hover:bg-[#e5e7eb] dark:bg-[#444] dark:text-white dark:hover:bg-[#555] relative`}
      aria-label="Toggle theme"
      type="button"
    >
      {mounted ? (
        isDark ? (
          <Sun size={17} className="transition-all duration-300" />
        ) : (
          <Moon size={17} className="transition-all duration-300" />
        )
      ) : (
        <span className="sr-only">Toggle theme</span>
      )}
    </button>
  );
}
