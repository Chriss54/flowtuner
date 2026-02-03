"use client";

import { useState, useEffect } from "react";

type Theme = "dark" | "light" | "plant";

const THEME_ORDER: Theme[] = ["dark", "light", "plant"];

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Get initial theme from localStorage or default to dark
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        const initialTheme = savedTheme && THEME_ORDER.includes(savedTheme) ? savedTheme : "dark";
        setTheme(initialTheme);
        document.documentElement.setAttribute("data-theme", initialTheme);
    }, []);

    const cycleTheme = () => {
        const currentIndex = THEME_ORDER.indexOf(theme);
        const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
        const newTheme = THEME_ORDER[nextIndex];
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
    };

    const getThemeLabel = () => {
        switch (theme) {
            case "dark": return "Dark mode";
            case "light": return "Light mode";
            case "plant": return "Plant mode";
        }
    };

    const getNextThemeLabel = () => {
        const currentIndex = THEME_ORDER.indexOf(theme);
        const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
        const nextTheme = THEME_ORDER[nextIndex];
        switch (nextTheme) {
            case "dark": return "Switch to dark mode";
            case "light": return "Switch to light mode";
            case "plant": return "Switch to plant mode";
        }
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return (
            <button className="theme-toggle" aria-label="Toggle theme">
                <span style={{ width: 18, height: 18 }} />
            </button>
        );
    }

    return (
        <button
            className="theme-toggle"
            onClick={cycleTheme}
            aria-label={getNextThemeLabel()}
            title={getThemeLabel()}
        >
            {theme === "dark" && (
                // Sun icon - next is light mode
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
            )}
            {theme === "light" && (
                // Leaf icon - next is plant mode
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                </svg>
            )}
            {theme === "plant" && (
                // Moon icon - next is dark mode
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
            )}
        </button>
    );
}
