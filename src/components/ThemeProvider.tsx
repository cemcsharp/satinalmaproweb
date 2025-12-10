"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light";

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    resolvedTheme: "light";
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    setTheme: () => { },
    resolvedTheme: "light",
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme] = useState<Theme>("light");
    const [resolvedTheme] = useState<"light">("light");

    // Always apply light theme
    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove("dark");
        root.classList.add("light");
        // Clear any stored theme preference
        localStorage.removeItem("theme");
    }, []);

    const setTheme = () => {
        // Do nothing - always light theme
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}
