"use client";
import { createContext, useContext, useEffect } from "react";

const ThemeContext = createContext<{ theme: "dark"; toggle: () => void }>({
    theme: "dark",
    toggle: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    // Always force dark mode — the UI uses hardcoded dark-mode Tailwind classes
    useEffect(() => {
        document.documentElement.classList.add("dark");
        localStorage.setItem("lamas-theme", "dark");
    }, []);

    return (
        <ThemeContext.Provider value={{ theme: "dark", toggle: () => { } }}>
            {children}
        </ThemeContext.Provider>
    );
}
