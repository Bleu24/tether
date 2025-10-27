"use client";

import { useEffect, useState, useCallback } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "tether:theme";

function getSystemPrefersDark() {
    if (typeof window === "undefined" || !window.matchMedia) return false;
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
    const root = document.documentElement;
    if (theme === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
        root.setAttribute("data-theme", "dark");
    } else if (theme === "light") {
        root.classList.add("light");
        root.classList.remove("dark");
        root.setAttribute("data-theme", "light");
    } else {
        // system: remove explicit classes and let CSS/media query decide
        root.classList.remove("dark");
        root.classList.remove("light");
        root.removeAttribute("data-theme");
    }
}

export default function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("system");

    // initialize from storage, existing html classes, or system
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
            let initial: Theme;
            if (stored) {
                initial = stored;
            } else {
                const root = document.documentElement;
                if (root.classList.contains("dark")) initial = "dark";
                else if (root.classList.contains("light")) initial = "light";
                else initial = "system";
            }
            setTheme(initial);
            applyTheme(initial);
        } catch (e) {
            // ignore storage errors
            const root = document.documentElement;
            const initial = root.classList.contains("dark") ? "dark" : root.classList.contains("light") ? "light" : "system";
            setTheme(initial);
            applyTheme(initial);
        }
    }, []);

    // persist whenever the user explicitly changes the theme
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, theme);
        } catch (e) {
            /* ignore */
        }
    }, [theme]);

    // when in system mode, listen for OS color-scheme changes and re-apply
    useEffect(() => {
        if (typeof window === "undefined") return;
        const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
        if (!mql) return;

        const onChange = () => {
            // re-apply system-mode theme so CSS media query picks up
            if (theme === "system") applyTheme("system");
        };

        // addEventListener is preferred; fallback to addListener for older browsers
        if (typeof mql.addEventListener === "function") {
            mql.addEventListener("change", onChange);
            return () => mql.removeEventListener("change", onChange);
        } else if (typeof mql.addListener === "function") {
            // @ts-ignore - legacy API
            mql.addListener(onChange);
            return () => {
                try {
                    // @ts-ignore
                    mql.removeListener(onChange);
                } catch (e) {
                    /* ignore */
                }
            };
        }
    }, [theme]);

    const cycleTheme = useCallback(() => {
        setTheme((prev) => {
            const next: Theme = prev === "system" ? "dark" : prev === "dark" ? "light" : "system";
            applyTheme(next);
            try {
                localStorage.setItem(STORAGE_KEY, next);
            } catch (e) {
                /* ignore */
            }
            return next;
        });
    }, []);

    const label = theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light";
    return (
        <button
            type="button"
            onClick={cycleTheme}
            title={`Theme: ${label} (click to cycle)`}
            aria-label={`Theme: ${label}. Click to change.`}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm"
        >
            {theme === "system" ? (
                <Monitor className="w-4 h-4" />
            ) : theme === "dark" ? (
                <Moon className="w-4 h-4" />
            ) : (
                <Sun className="w-4 h-4" />
            )}
            <span className="sr-only">Theme: {label}</span>
        </button>
    );
}
