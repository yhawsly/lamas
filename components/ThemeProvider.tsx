"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext<{ theme: "light" | "dark"; toggle: () => void }>({
    theme: "dark",
    toggle: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("lamas-theme") as "light" | "dark" | null;
        const initialTheme = savedTheme || "dark";
        
        setTheme(initialTheme);
        document.documentElement.classList.toggle("dark", initialTheme === "dark");
        setMounted(true);
    }, []);

    const toggle = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("lamas-theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    // Prevent flash of wrong theme
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}
