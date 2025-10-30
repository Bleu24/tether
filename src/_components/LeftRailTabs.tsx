"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Blur from "react-blur";

type Props = {
    convos: any[];
    likers?: any[];
    meId?: number;
    myTier?: string;
};

export default function LeftRailTabs({ convos, likers = [], meId, myTier }: Props) {
    const router = useRouter();
    const search = useSearchParams();
    const [tab, setTab] = React.useState<"matches" | "messages">("matches");
    const [flash, setFlash] = React.useState<string | null>(null);
    const [likersState, setLikersState] = React.useState<any[]>(likers);

    // Derive views: mutual matches (no messages yet) vs conversations (with messages)
    const mutuals = React.useMemo(() => (convos || []).filter((c: any) => !c.latestMessage), [convos]);
    const messagesOnly = React.useMemo(() => (convos || []).filter((c: any) => !!c.latestMessage), [convos]);

    // Optional: listen for real-time match events to flash a notice
    React.useEffect(() => {
        if (!meId) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const url = `${API_URL.replace(/^http/, "ws")}/ws?userId=${meId}`;
        const ws = new WebSocket(url);
        ws.onmessage = (ev) => {
            try {
                const { event, data } = JSON.parse(ev.data);
                if (event === "match:created") {
                    setFlash("You have a match!");
                    setTimeout(() => setFlash(null), 3000);
                } else if (event === "likers:refresh" || event === "like:received") {
                    // Refetch likers list so new likes appear in real-time
                    fetch(`${API_URL}/api/me/likers`, { credentials: "include", cache: "no-store" })
                        .then((r) => (r.ok ? r.json() : null))
                        .then((j) => {
                            const list = (j?.data ?? j ?? []) as any[];
                            if (Array.isArray(list)) setLikersState(list);
                        })
                        .catch(() => { /* noop */ });
                }
            } catch { /* ignore */ }
        };
        return () => { try { ws.close(); } catch { } };
    }, [meId]);

    // If url contains tab=messages (from overlay "Chat now"), select Messages tab
    React.useEffect(() => {
        const t = search?.get("tab");
        if (t === "messages") setTab("messages");
    }, [search]);

    return (
        <div className="mt-6">
            <div role="tablist" aria-label="Matches and Messages" className="flex items-center gap-6">
                <button
                    role="tab"
                    aria-selected={tab === "matches"}
                    className={
                        "pb-1 text-sm font-medium outline-none " +
                        (tab === "matches"
                            ? "border-b-2 border-fuchsia-400"
                            : "text-foreground/70 hover:text-foreground")
                    }
                    onClick={() => setTab("matches")}
                >
                    Matches
                </button>
                <button
                    role="tab"
                    aria-selected={tab === "messages"}
                    className={
                        "pb-1 text-sm font-medium outline-none " +
                        (tab === "messages"
                            ? "border-b-2 border-fuchsia-400"
                            : "text-foreground/70 hover:text-foreground")
                    }
                    onClick={() => setTab("messages")}
                >
                    Messages
                </button>
            </div>

            {flash && (
                <div className="mt-3 rounded-md border border-fuchsia-400/40 bg-fuchsia-500/20 px-3 py-2 text-xs font-medium text-fuchsia-100">
                    {flash}
                </div>
            )}

            {tab === "matches" ? (
                <div className="mt-3 space-y-4" role="tabpanel" aria-label="Matches">
                    <div>
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">Likes you</div>
                        <div className="grid grid-cols-5 gap-2 md:gap-3">
                            {likersState.map((u, idx) => {
                                const initials = (u.name || "?")
                                    .split(" ")
                                    .map((p: string) => p[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase();
                                const photo = Array.isArray(u.photos) && u.photos[0] ? u.photos[0] : null;
                                return (
                                    <div key={`${u.id}-${idx}`} className="relative overflow-hidden rounded-md border border-white/10 bg-white/5" style={{ aspectRatio: "3 / 4" }}>
                                        {photo ? (
                                            myTier === "free" ? (
                                                <Blur img={photo} blurRadius={16} enableStyles style={{ height: "100%", width: "100%" }} />
                                            ) : (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={photo} alt={u.name ?? "User"} className="h-full w-full object-cover" />
                                            )
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground/70">
                                                {initials}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {likersState.length === 0 && (
                                <div className="col-span-5 text-center text-xs text-foreground/60">
                                    No likes yet
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="mb-2 mt-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">Mutual matches</div>
                        <div className="grid grid-cols-5 gap-2 md:gap-3">
                            {mutuals.map((c: any) => {
                                const photo = Array.isArray(c.otherUser?.photos) && c.otherUser.photos[0] ? c.otherUser.photos[0] : null;
                                const name = c.otherUser?.name ?? "Unknown";
                                return (
                                    <button
                                        key={c.match.id}
                                        className="relative overflow-hidden rounded-md border border-white/10 bg-white/5 focus:outline-none focus:ring-2 focus:ring-fuchsia-400"
                                        style={{ aspectRatio: "3 / 4" }}
                                        onClick={() => {
                                            const url = new URL(window.location.href);
                                            url.searchParams.set("matchId", String(c.match.id));
                                            router.push(url.toString());
                                        }}
                                        aria-label={`Open chat with ${name}`}
                                    >
                                        {photo ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={photo} alt={name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-foreground/70">{name.slice(0, 2).toUpperCase()}</div>
                                        )}
                                    </button>
                                );
                            })}
                            {mutuals.length === 0 && (
                                <div className="col-span-5 text-center text-xs text-foreground/60">No mutual matches yet</div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <ul className="mt-3 space-y-2" role="tabpanel" aria-label="Messages">
                    {messagesOnly.map((c: any) => (
                        <li
                            key={c.match.id}
                            className="flex cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                            onClick={() => {
                                const url = new URL(window.location.href);
                                url.searchParams.set("matchId", String(c.match.id));
                                // remain on messages tab
                                url.searchParams.set("tab", "messages");
                                router.push(url.toString());
                            }}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    const url = new URL(window.location.href);
                                    url.searchParams.set("matchId", String(c.match.id));
                                    url.searchParams.set("tab", "messages");
                                    router.push(url.toString());
                                }
                            }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="relative h-8 w-8 overflow-hidden rounded-full border border-white/10 bg-white/10">
                                    {Array.isArray(c.otherUser?.photos) && c.otherUser.photos[0] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={c.otherUser.photos[0]} alt={c.otherUser?.name ?? "User"} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-foreground/70">
                                            {(c.otherUser?.name ?? "?").slice(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium">{c.otherUser?.name ?? "Unknown"}</div>
                                    <div className="text-foreground/60 truncate max-w-[200px]">
                                        {c.latestMessage?.content ?? "No messages yet"}
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-foreground/50">
                                {new Date(c.latestMessage?.created_at ?? c.match.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </li>
                    ))}
                    {messagesOnly.length === 0 && (
                        <li className="text-center text-xs text-foreground/60">No messages</li>
                    )}
                </ul>
            )}
        </div>
    );
}
