"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="w-8 h-8" />;

  const currentTheme = theme === "system" ? systemTheme : theme;

  return (
    <Button 
      onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")} 
      variant="outline" size="icon" 
      className="rounded-full cursor-pointer bg-white/20 dark:bg-black/20 border-slate-200 dark:border-slate-800 transition-all"
    >
      {currentTheme === "dark" ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-500" />}
    </Button>
  );
}