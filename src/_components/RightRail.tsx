"use client";

import React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ChatPanel from "@/_components/ChatPanel";
import SwipeDeckWithActions from "@/_components/SwipeDeckWithActions";
import type { Profile } from "@/_components/SwipeDeck";
import Link from "next/link";
import { SlidersHorizontal, RefreshCw } from "lucide-react";

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

    // If overlay set tab=messages, keep it but ensure we render chat panel only if matchId exists
    if (matchId && Number.isFinite(matchId)) {
        return (
            <section className="flex h-full flex-col">
                <ChatPanel matchId={matchId} meId={meId} convos={convos} />
            </section>
        );
    }

    // Live refresh: listen for discover:refresh and fetch new deck data
    React.useEffect(() => {
        if (!meId) return;
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const wsUrl = API_URL.replace(/^http/, "ws");
        const ws = new WebSocket(`${wsUrl}/ws?userId=${meId}`);
        ws.onmessage = async (ev) => {
            try {
                const { event } = JSON.parse(ev.data);
                if (event === "discover:refresh") {
                    // fetch new discover list
                    const discRes = await fetch(`${API_URL}/api/me/discover`, { credentials: "include", cache: "no-store" });
                    if (!discRes.ok) return;
                    const dj = await discRes.json().catch(() => null);
                    const list = (dj?.data ?? dj ?? []) as any[];
                    // map to Profile shape
                    const mapped = list.map((u: any) => ({
                        id: u.id,
                        name: u.name,
                        age: typeof u.age === "number" ? u.age : undefined,
                        image: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos[0] : undefined,
                        images: Array.isArray(u.photos) ? u.photos : undefined,
                        bio: u.bio ?? undefined,
                        tags: Array.isArray(u.preferences?.interests) ? u.preferences.interests : [],
                    })) as Profile[];
                    setItems(mapped);
                    // compute boosted
                    const ids = mapped.map((d) => Number(d.id));
                    const params = encodeURIComponent(ids.join(","));
                    const bRes = await fetch(`${API_URL}/api/boost/active?ids=${params}`, { credentials: "include", cache: "no-store" });
                    const bj = await bRes.json().catch(() => null);
                    const boostedIdsNew = (bj?.data?.boostedIds ?? bj?.boostedIds ?? []) as number[];
                    setBoosted(boostedIdsNew);
                    // refresh superlikers ids (optional)
                    try {
                        const slRes = await fetch(`${API_URL}/api/me/superlikers`, { credentials: "include", cache: "no-store" });
                        const slj = await slRes.json().catch(() => null);
                        const superlikers = (slj?.data ?? slj ?? []) as any[];
                        setSlByIds(superlikers.map((u: any) => Number(u.id)).filter((n) => Number.isFinite(n)));
                    } catch { }
                    // force deck remount so internal stack resets to new items
                    setDeckKey((k) => k + 1);
                    setDeckEmpty(mapped.length === 0);
                }
            } catch { }
        };
        return () => { try { ws.close(); } catch { } };
    }, [meId]);

    return (
        <section className="flex h-full flex-col items-center justify-center">
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
        </section>
    );
}
