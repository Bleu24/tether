"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

type PendingItem = { matchId: number; otherUserId: number };
type OtherUser = { id: number; name?: string; photos?: string[] };

export default function MatchOverlay({ meId }: { meId: number }) {
    const router = useRouter();
    const [queue, setQueue] = React.useState<PendingItem[]>([]);
    const [otherUser, setOtherUser] = React.useState<OtherUser | null>(null);

    const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

    const fetchPending = React.useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/me/matches/pending-celebrations`, {
                credentials: "include",
                cache: "no-store",
            });
            if (!res.ok) return;
            const j = await res.json().catch(() => null);
            const list = (j?.data ?? j ?? []) as Array<any>;
            const items: PendingItem[] = list
                .map((m) => ({
                    matchId: Number(m.id),
                    otherUserId: m.user_a_id === meId ? Number(m.user_b_id) : Number(m.user_a_id),
                }))
                .filter((x) => Number.isFinite(x.matchId) && Number.isFinite(x.otherUserId));
            if (items.length > 0) setQueue((prev) => {
                // avoid duplicates by matchId
                const seen = new Set(prev.map((p) => p.matchId));
                const merged = [...prev, ...items.filter((i) => !seen.has(i.matchId))];
                return merged;
            });
        } catch { }
    }, [API_URL, meId]);

    const markSeen = React.useCallback(async (matchId: number) => {
        try {
            await fetch(`${API_URL}/api/me/matches/${matchId}/celebration-seen`, {
                method: "POST",
                credentials: "include",
            });
        } catch { }
    }, [API_URL]);

    const fetchUser = React.useCallback(async (userId: number) => {
        try {
            const res = await fetch(`${API_URL}/api/users/${userId}`, {
                credentials: "include",
                cache: "no-store",
            });
            if (!res.ok) return null;
            const j = await res.json().catch(() => null);
            const u = (j?.data ?? j ?? null) as any;
            if (!u) return null;
            return { id: Number(u.id), name: u.name, photos: Array.isArray(u.photos) ? u.photos : [] } as OtherUser;
        } catch {
            return null;
        }
    }, [API_URL]);

    // Initial pending fetch on mount and when meId changes
    React.useEffect(() => {
        if (!meId) return;
        fetchPending();
    }, [meId, fetchPending]);

    // WebSocket: on live match events, refetch pending so we get the matchId
    React.useEffect(() => {
        if (!meId) return;
        const url = `${API_URL.replace(/^http/, "ws")}/ws?userId=${meId}`;
        const ws = new WebSocket(url);
        ws.onmessage = (ev) => {
            try {
                const { event } = JSON.parse(ev.data);
                if (event === "match:created") {
                    // Re-fetch pending list so we capture the new match with its id
                    fetchPending();
                }
            } catch { }
        };
        return () => { try { ws.close(); } catch { } };
    }, [API_URL, meId, fetchPending]);

    const current = queue[0];
    const open = Boolean(current);

    // Load other user's info for the current pending item
    React.useEffect(() => {
        let cancelled = false;
        async function run() {
            if (!current) { setOtherUser(null); return; }
            const u = await fetchUser(current.otherUserId);
            if (!cancelled) setOtherUser(u);
        }
        run();
        return () => { cancelled = true; };
    }, [current?.otherUserId, fetchUser, current]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    key="match-overlay"
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                >
                    <motion.div
                        className="w-full max-w-sm rounded-2xl border border-fuchsia-400/30 bg-white/10 p-6 text-center text-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, delay: 0.05 }}
                    >
                        <div className="text-3xl font-extrabold tracking-wide">IT'S A MATCH!</div>
                        {otherUser ? (
                            <div className="mt-4 flex flex-col items-center">
                                <div className="relative h-20 w-20 overflow-hidden rounded-full border border-white/15 bg-white/10">
                                    {otherUser.photos && otherUser.photos[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={otherUser.photos[0]} alt={otherUser.name ?? "Match"} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-white/10" />
                                    )}
                                </div>
                                <div className="mt-2 text-sm text-white/90">You and {otherUser.name ?? "this person"} like each other.</div>
                            </div>
                        ) : (
                            <p className="mt-2 text-sm text-white/80">You and this person like each other.</p>
                        )}
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                className="rounded-md bg-fuchsia-500 px-4 py-2 text-sm font-semibold text-black hover:brightness-105"
                                onClick={async () => {
                                    if (current) await markSeen(current.matchId);
                                    setQueue((prev) => prev.slice(1));
                                    try {
                                        const url = new URL(window.location.href);
                                        url.searchParams.set("matchId", String(current?.matchId));
                                        url.searchParams.set("tab", "messages");
                                        router.push(url.toString());
                                    } catch { router.refresh(); }
                                }}
                            >
                                Chat now
                            </button>
                            <button
                                className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/15"
                                onClick={async () => {
                                    if (current) await markSeen(current.matchId);
                                    setQueue((prev) => prev.slice(1));
                                }}
                            >
                                Later
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
