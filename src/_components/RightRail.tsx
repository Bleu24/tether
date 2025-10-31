"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatPanel from "@/_components/ChatPanel";
import SwipeDeckWithActions from "@/_components/SwipeDeckWithActions";
import type { Profile } from "@/_components/SwipeDeck";
import Link from "next/link";
import { interestLabel } from "@/lib/interests";
import { SlidersHorizontal, RefreshCw } from "lucide-react";
import { useWebSocketHub } from "@/_hooks/useWebSocketHub";

export default function RightRail({ meId, deckItems, convos = [], boostedIds = [], superLikedByIds = [] }: { meId: number; deckItems: Profile[]; convos?: any[]; boostedIds?: number[]; superLikedByIds?: number[] }) {
    const search = useSearchParams();
    const router = useRouter();
    const matchIdParam = search?.get("matchId");
    const matchId = matchIdParam ? Number(matchIdParam) : null;
    const [deckEmpty, setDeckEmpty] = React.useState<boolean>(deckItems.length === 0);
    const [items, setItems] = React.useState<Profile[]>(deckItems);
    const [boosted, setBoosted] = React.useState<number[]>(boostedIds);
    const [slByIds, setSlByIds] = React.useState<number[]>(superLikedByIds);
    const [deckKey, setDeckKey] = React.useState<number>(0);

    React.useEffect(() => {
        function onEmpty() { setDeckEmpty(true); }
        window.addEventListener("deck:empty", onEmpty as any);
        return () => window.removeEventListener("deck:empty", onEmpty as any);
    }, []);

    // Best-effort: update current geolocation to improve distance-based recommendations
    React.useEffect(() => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        if (!meId || typeof window === "undefined" || !("geolocation" in navigator)) return;
        try {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                // send but don't block UI
                fetch(`${API_URL}/api/update-location`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ userId: Number(meId), latitude, longitude })
                }).catch(() => { });
            }, () => { /* ignore denied */ }, { enableHighAccuracy: false, maximumAge: 60_000, timeout: 7_000 });
        } catch { }
    }, [meId]);

    // Important: don't early-return based on URL flags, to keep hook order stable across renders.
    const showChat = !!(matchId && Number.isFinite(matchId));

    // Live refresh: listen for discover:refresh via shared WS hook
    const hub = useWebSocketHub();
    React.useEffect(() => {
        if (!meId) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const off = hub.onMessage(async (msg) => {
            if (msg.event !== "discover:refresh") return;
            try {
                const discRes = await fetch(`${API_URL}/api/me/discover`, { credentials: "include", cache: "no-store" });
                if (!discRes.ok) return;
                const dj = await discRes.json().catch(() => null);
                const list = (dj?.data ?? dj ?? []) as any[];
                // fetch me to compute distances client-side so distance doesn't disappear after refresh
                let meLat: number | undefined; let meLon: number | undefined;
                try {
                    const meRes = await fetch(`${API_URL}/api/me`, { credentials: "include", cache: "no-store" });
                    if (meRes.ok) {
                        const mj = await meRes.json().catch(() => null);
                        const me = (mj?.data ?? mj ?? null) as any | null;
                        const lat = typeof me?.latitude === "number" ? me.latitude : Number(me?.latitude);
                        const lon = typeof me?.longitude === "number" ? me.longitude : Number(me?.longitude);
                        if (Number.isFinite(lat) && Number.isFinite(lon)) { meLat = Number(lat); meLon = Number(lon); }
                    }
                } catch { }
                const haversineKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                    const toRad = (v: number) => (v * Math.PI) / 180;
                    const R = 6371;
                    const dLat = toRad(lat2 - lat1);
                    const dLon = toRad(lon2 - lon1);
                    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                    return R * c;
                };
                const mapped = list.map((u: any) => {
                    const lat = typeof u.latitude === "number" ? u.latitude : Number(u.latitude);
                    const lon = typeof u.longitude === "number" ? u.longitude : Number(u.longitude);
                    const hasMe = Number.isFinite(meLat) && Number.isFinite(meLon);
                    const hasU = Number.isFinite(lat) && Number.isFinite(lon);
                    const distanceKm = hasMe && hasU && meLat !== undefined && meLon !== undefined
                        ? haversineKm(meLat!, meLon!, Number(lat), Number(lon))
                        : undefined;
                    return {
                        id: u.id,
                        name: u.name,
                        age: typeof u.age === "number" ? u.age : undefined,
                        image: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos[0] : undefined,
                        images: Array.isArray(u.photos) ? u.photos : undefined,
                        bio: u.bio ?? undefined,
                        distanceKm,
                        tags: Array.isArray(u.preferences?.interests)
                            ? u.preferences.interests.map((k: string) => interestLabel(k))
                            : [],
                    } as Profile;
                });
                setItems(mapped);
                const ids = mapped.map((d) => Number(d.id));
                const params = encodeURIComponent(ids.join(","));
                const bRes = await fetch(`${API_URL}/api/boost/active?ids=${params}`, { credentials: "include", cache: "no-store" });
                const bj = await bRes.json().catch(() => null);
                const boostedIdsNew = (bj?.data?.boostedIds ?? bj?.boostedIds ?? []) as number[];
                setBoosted(boostedIdsNew);
                try {
                    const slRes = await fetch(`${API_URL}/api/me/superlikers`, { credentials: "include", cache: "no-store" });
                    const slj = await slRes.json().catch(() => null);
                    const superlikers = (slj?.data ?? slj ?? []) as any[];
                    setSlByIds(superlikers.map((u: any) => Number(u.id)).filter((n) => Number.isFinite(n)));
                } catch { }
                setDeckKey((k) => k + 1);
                setDeckEmpty(mapped.length === 0);
            } catch { }
        });
        return () => off();
    }, [meId, hub]);

    return (
        <section className={`flex h-full flex-col ${showChat ? "items-stretch justify-stretch" : "items-center justify-center"}`}>
            {showChat ? (
                <div className="mx-auto w-full h-full min-h-0 flex">
                    <ChatPanel matchId={matchId!} meId={meId} convos={convos} />
                </div>
            ) : (
                <div className="mx-auto max-w-md w-full">
                    {items.length > 0 && !deckEmpty ? (
                        <>
                            <SwipeDeckWithActions key={deckKey} items={items} meId={meId} boostedIds={boosted} superLikedByIds={slByIds} />
                            <p className="mt-3 text-center text-xs text-foreground/60">Use ← / → keys or the buttons to pass or like. Tap the card to view next photo.</p>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5">
                                <SlidersHorizontal className="h-5 w-5 text-foreground/70" />
                            </div>
                            <h2 className="mt-4 text-base font-semibold">No more recommendations</h2>
                            <p className="mt-1 text-sm text-foreground/70">You’re all caught up. Please adjust your filters to see more people.</p>
                            <div className="mt-5 flex items-center justify-center gap-3">
                                <Link href="/profile" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/90 px-3 py-2 text-sm font-medium text-black hover:brightness-110">
                                    <SlidersHorizontal className="h-4 w-4" /> Edit Preferences
                                </Link>
                                <Link href="/date/discover" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/80 px-3 py-2 text-sm font-medium text-black hover:brightness-110">
                                    <RefreshCw className="h-4 w-4" /> Refresh
                                </Link>
                            </div>
                            <p className="mt-3 text-[11px] text-foreground/60">Tip: Widen age range, increase distance, or set gender to "any" to broaden matches.</p>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
