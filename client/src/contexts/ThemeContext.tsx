import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeName = "dark" | "light" | "neon" | "minimal" | "ocean";

export interface Theme {
  name: ThemeName;
  label: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    accent: string;
    muted: string;
    border: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    label: "Dark Mode",
    description: "Classic dark theme with cyan accents",
    colors: {
      background: "hsl(222.2 84% 4.9%)",
      foreground: "hsl(210 40% 98%)",
      primary: "hsl(189 100% 50%)",
      secondary: "hsl(217.2 32.6% 17.5%)",
      accent: "hsl(189 100% 50%)",
      muted: "hsl(217.2 32.6% 17.5%)",
      border: "hsl(217.2 32.6% 17.5%)",
    },
  },
  light: {
    name: "light",
    label: "Light Mode",
    description: "Clean light theme with blue accents",
    colors: {
      background: "hsl(0 0% 100%)",
      foreground: "hsl(222.2 84% 4.9%)",
      primary: "hsl(221.2 83.2% 53.3%)",
      secondary: "hsl(210 40% 96.1%)",
      accent: "hsl(210 40% 96.1%)",
      muted: "hsl(210 40% 96.1%)",
      border: "hsl(214.3 31.8% 91.4%)",
    },
  },
  neon: {
    name: "neon",
    label: "Neon Nights",
    description: "Vibrant neon colors with dark background",
    colors: {
      background: "hsl(270 50% 5%)",
      foreground: "hsl(300 100% 95%)",
      primary: "hsl(320 100% 50%)",
      secondary: "hsl(280 60% 20%)",
      accent: "hsl(160 100% 50%)",
      muted: "hsl(280 40% 15%)",
      border: "hsl(280 50% 25%)",
    },
  },
  minimal: {
    name: "minimal",
    label: "Minimal",
    description: "Minimalist grayscale design",
    colors: {
      background: "hsl(0 0% 98%)",
      foreground: "hsl(0 0% 10%)",
      primary: "hsl(0 0% 20%)",
      secondary: "hsl(0 0% 92%)",
      accent: "hsl(0 0% 85%)",
      muted: "hsl(0 0% 92%)",
      border: "hsl(0 0% 88%)",
    },
  },
  ocean: {
    name: "ocean",
    label: "Ocean Blue",
    description: "Calming ocean-inspired blues and teals",
    colors: {
      background: "hsl(200 30% 10%)",
      foreground: "hsl(180 20% 95%)",
      primary: "hsl(190 80% 50%)",
      secondary: "hsl(200 40% 20%)",
      accent: "hsl(170 70% 45%)",
      muted: "hsl(200 30% 18%)",
      border: "hsl(200 35% 25%)",
    },
  },
};

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  currentTheme: Theme;
  // Legacy support for existing code
  toggleTheme?: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const stored = localStorage.getItem("viral-beat-theme");
    return (stored as ThemeName) || "light";
  });

  const currentTheme = themes[theme];

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem("viral-beat-theme", newTheme);
  };

  // Legacy toggle function for backwards compatibility
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  useEffect(() => {
    const root = document.documentElement;
    const colors = currentTheme.colors;

    // Apply CSS variables
    root.style.setProperty("--background", colors.background);
    root.style.setProperty("--foreground", colors.foreground);
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--secondary", colors.secondary);
    root.style.setProperty("--accent", colors.accent);
    root.style.setProperty("--muted", colors.muted);
    root.style.setProperty("--border", colors.border);

    // Add theme class to root
    root.className = theme;
    
    // Legacy dark class support
    if (theme === "dark" || theme === "neon" || theme === "ocean") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme, currentTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme, toggleTheme, switchable: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
