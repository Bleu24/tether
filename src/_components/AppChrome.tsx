"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import ThemeToggle from "@components/ui/theme-toggle";
import { useUser } from "@/_contexts/UserContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function AppChrome({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, setUser } = useUser();

    // Fetch session user once on mount if not present
    useEffect(() => {
        if (user) return;
        let cancelled = false;
        (async () => {
            try {
                const r = await fetch(`${API_URL}/api/me`, { credentials: "include" });
                if (!r.ok) return;
                const j = await r.json().catch(() => null);
                const me = (j?.data ?? j) as any;
                if (me && !cancelled) setUser({ id: me.id, name: me.name ?? "You", email: me.email, photo: Array.isArray(me.photos) ? me.photos[0] : null, setupComplete: !!me.setup_complete });
            } catch { }
        })();
        return () => { cancelled = true; };
    }, [user, setUser]);
    const hideChrome = pathname?.startsWith("/date/discover") || pathname?.startsWith("/profile");
    if (hideChrome) {
        return <>{children}</>;
    }
    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/55">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        {/* Brand */}
                        <Link href="/" className="select-none text-lg font-semibold">
                            <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-white bg-clip-text text-transparent">
                                Tether
                            </span>
                        </Link>

                        {/* Custom nav links */}
                        <nav aria-label="Primary navigation" className="hidden items-center gap-6 sm:flex">
                            <Link href={user ? (user.setupComplete === false ? "/setup" : "/date/discover") : "/date"} className="relative text-sm text-foreground/80 transition-colors hover:text-foreground">
                                Date
                                <span className="pointer-events-none absolute inset-x-0 -bottom-1 block h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent opacity-0 transition-opacity hover:opacity-100" />
                            </Link>
                            <Link href="/about" className="relative text-sm text-foreground/80 transition-colors hover:text-foreground">
                                About
                                <span className="pointer-events-none absolute inset-x-0 -bottom-1 block h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent opacity-0 transition-opacity hover:opacity-100" />
                            </Link>
                            <Link href="/support" className="relative text-sm text-foreground/80 transition-colors hover:text-foreground">
                                Support
                                <span className="pointer-events-none absolute inset-x-0 -bottom-1 block h-px bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent opacity-0 transition-opacity hover:opacity-100" />
                            </Link>
                        </nav>

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            {user ? (
                                <Link href="/profile" className="group flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 hover:bg-white/10">
                                    <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/10 text-sm font-medium">
                                        {user.photo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={user.photo} alt={user.name} className="h-full w-full object-cover" />
                                        ) : (
                                            (user.name || "?")
                                                .split(" ")
                                                .map((s) => s[0])
                                                .join("")
                                                .slice(0, 2)
                                                .toUpperCase()
                                        )}
                                    </span>
                                    <span className="text-sm">{user.name}</span>
                                </Link>
                            ) : (
                                <Link href="/signup" className="btn-opposite ml-1">Sign Up</Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {children}

            {/* Footer */}
            <footer className="mt-16 border-t border-white/10 bg-background/60">
                <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                    <div className="grid gap-8 sm:grid-cols-3">
                        <div>
                            <Link href="/" className="text-lg font-semibold">
                                <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-white bg-clip-text text-transparent">Tether</span>
                            </Link>
                            <p className="mt-2 text-sm text-foreground/60">
                                Find your person. We’re building an MVP, shipping fast.
                            </p>
                        </div>
                        <nav className="space-y-2">
                            <div className="text-sm font-medium text-foreground/70">Navigate</div>
                            <div className="flex flex-col text-sm text-foreground/80">
                                <Link href="/date" className="hover:text-foreground">Date</Link>
                                <Link href="/about" className="hover:text-foreground">About</Link>
                                <Link href="/support" className="hover:text-foreground">Support</Link>
                                <Link href="/signup" className="hover:text-foreground">Sign Up</Link>
                            </div>
                        </nav>
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-foreground/70">Contact</div>
                            <p className="text-sm text-foreground/80">
                                Email: <a className="underline hover:text-foreground" href="mailto:hello@tether.app">hello@tether.app</a>
                            </p>
                            <p className="text-sm text-foreground/80">© {new Date().getFullYear()} Tether</p>
                        </div>
                    </div>
                </div>
            </footer>
        </>
    );
}
