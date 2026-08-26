"use client";
import { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "sage";

interface ThemeContextType {
    theme: Theme;
    setTheme: (t: Theme) => void;
    cycle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    setTheme: () => {},
    cycle: () => {},
});

export function useTheme() {
    return useContext(ThemeContext);
}

const THEMES: Theme[] = ["light", "dark", "sage"];

const THEME_META_COLORS: Record<Theme, string> = {
    light: "#ffffff",
    dark:  "#15202B",
    sage:  "#1A1E1A",
};

function applyTheme(t: Theme) {
    const html = document.documentElement;
    // Remove all theme classes first
    html.classList.remove("light", "dark", "sage");
    html.classList.add(t);
    // Update PWA / browser chrome theme-color
    const metaTheme = document.getElementById("theme-color-meta");
    if (metaTheme) {
        metaTheme.setAttribute("content", THEME_META_COLORS[t]);
    }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("lamas-theme") as Theme | null;
        const valid = THEMES.includes(saved as Theme) ? (saved as Theme) : "light";
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(valid);
        applyTheme(valid);
        setMounted(true);
    }, []);

    const setTheme = (t: Theme) => {
        setThemeState(t);
        localStorage.setItem("lamas-theme", t);
        applyTheme(t);
    };

    const cycle = () => {
        const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
        setTheme(next);
    };

    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme, cycle }}>
            {children}
        </ThemeContext.Provider>
    );
}
