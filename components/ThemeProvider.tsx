"use client";
import { createContext, useContext, useEffect, useState } from "react";

interface ThemeContextType {
    theme: "light" | "dark";
    toggle: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    toggle: () => { },
});

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage on mount (defaulting to light)
    useEffect(() => {
        const savedTheme = localStorage.getItem("lamas-theme") as "light" | "dark" | null;
        const initialTheme = savedTheme === "dark" ? "dark" : "light";

        // eslint-disable-next-line react-hooks/set-state-in-effect
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

    // Prevent hydration flash before client mount
    if (!mounted) {
        return <>{children}</>;
    }

    return (
        <ThemeContext.Provider value={{ theme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}
