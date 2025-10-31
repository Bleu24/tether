"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Profile } from "@/_components/SwipeDeck";
import SwipeDeckWithActions from "@/_components/SwipeDeckWithActions";
import { UserCircle2, Bolt, BarChart3, Shield } from "lucide-react";
import Link from "next/link";
import LeftRailTabs from "@/_components/LeftRailTabs";
import MatchOverlay from "@/_components/MatchOverlay";
import RightRail from "@/_components/RightRail";
import { interestLabel } from "@/lib/interests";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

export default function DateDiscoverPage() {
    const router = useRouter();
    const [me, setMe] = useState<any | null>(null);
    const [convos, setConvos] = useState<any[]>([]);
    const [likers, setLikers] = useState<any[]>([]);
    const [superlikers, setSuperlikers] = useState<any[]>([]);
    const [discover, setDiscover] = useState<any[]>([]);
    const [boostedIds, setBoostedIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const go = async () => {
            try {
                const meRes = await fetch(`${API_URL}/api/me`, { credentials: "include", cache: "no-store" });
                if (meRes.status === 401) { router.replace("/signup"); return; }
                const meJson = await meRes.json().catch(() => null);
                const meVal = (meJson?.data ?? meJson ?? null) as any | null;
                if (!meVal) { router.replace("/signup"); return; }
                if (meVal.is_deleted) { router.replace("/signup"); return; }
                if (!meVal.setup_complete) { router.replace("/setup"); return; }
                if (cancelled) return;
                setMe(meVal);

                const [d, c, l, s] = await Promise.all([
                    fetch(`${API_URL}/api/me/discover`, { credentials: "include", cache: "no-store" }).then(r => r.ok ? r.json().catch(() => null) : Promise.reject(r.status)).catch(() => null),
                    fetch(`${API_URL}/api/me/conversations`, { credentials: "include", cache: "no-store" }).then(r => r.ok ? r.json().catch(() => null) : Promise.reject(r.status)).catch(() => null),
                    fetch(`${API_URL}/api/me/likers`, { credentials: "include", cache: "no-store" }).then(r => r.ok ? r.json().catch(() => null) : Promise.reject(r.status)).catch(() => null),
                    (async () => {
                        // small retry
                        for (let i = 0; i < 3; i++) {
                            const r = await fetch(`${API_URL}/api/me/superlikers`, { credentials: "include", cache: "no-store" });
                            if (r.ok) return r.json().catch(() => null);
                            await new Promise(res => setTimeout(res, 150 * (i + 1)));
                        }
                        return null;
                    })(),
                ]);
                const dData = (d?.data ?? d ?? []) as any[];
                const cData = (c?.data ?? c ?? []) as any[];
                const lData = (l?.data ?? l ?? []) as any[];
                const sData = (s?.data ?? s ?? []) as any[];
                if (cancelled) return;
                setDiscover(dData);
                setConvos(cData);
                setLikers(lData);
                setSuperlikers(sData);

                const ids = dData.map((x: any) => Number(x?.id)).filter((n: number) => Number.isFinite(n));
                if (ids.length) {
                    fetch(`${API_URL}/api/boost/active?ids=${encodeURIComponent(ids.join(","))}`, { credentials: "include", cache: "no-store" })
                        .then(r => r.ok ? r.json().catch(() => null) : null)
                        .then(j => setBoostedIds((j?.data?.boostedIds ?? j?.boostedIds ?? []) as number[]))
                        .catch(() => { });
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        go();
        return () => { cancelled = true; };
    }, [router]);

    // Deduplicate candidates by id to avoid any accidental repeats from the API layer
    const seen = new Set<string | number>();
    const meLat = typeof me?.latitude === "number" ? me.latitude : Number(me?.latitude);
    const meLon = typeof me?.longitude === "number" ? me.longitude : Number(me?.longitude);
    const hasMeGeo = Number.isFinite(meLat) && Number.isFinite(meLon);
    const deckItems: Profile[] = (discover ?? [])
        .filter((u: any) => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
        })
        .map((u: any) => ({
            id: u.id,
            name: u.name,
            age: typeof u.age === "number" ? u.age : undefined,
            image: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos[0] : undefined,
            images: Array.isArray(u.photos) ? u.photos : undefined,
            bio: u.bio ?? undefined,
            distanceKm: (() => {
                const lat = typeof u.latitude === "number" ? u.latitude : Number(u.latitude);
                const lon = typeof u.longitude === "number" ? u.longitude : Number(u.longitude);
                if (!hasMeGeo || !Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
                try { return haversineKm(Number(meLat), Number(meLon), Number(lat), Number(lon)); } catch { return undefined; }
            })(),
            // Convert interest keys to user-facing labels; let card handle truncation
            tags: Array.isArray(u.preferences?.interests)
                ? u.preferences.interests.map((k: string) => interestLabel(k))
                : [],
        }));

    const superLikedByIds = useMemo(() => (superlikers ?? []).map((u: any) => Number(u.id)).filter((n) => Number.isFinite(n)), [superlikers]);
    if (loading) {
        return <main className="h-screen bg-background text-foreground overflow-hidden"><div className="p-6 text-sm">Loading…</div></main>;
    }

    return (
        <main className="h-screen bg-background text-foreground overflow-hidden">
            <div className="mx-auto grid h-full max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[360px_minmax(0,1fr)]">
                {/* Left rail */}
                <aside className="flex h-full flex-col overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-4">
                    {/* Top bar */}
                    <div className="flex items-center justify-between">
                        <Link href="/profile" className="group flex items-center gap-3 rounded-lg p-1.5 hover:bg-white/5" aria-label="Edit profile">
                            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-white/15 bg-white/10">
                                {Array.isArray(me?.photos) && me.photos[0] ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={me.photos[0]} alt="You" className="h-full w-full object-cover" />
                                ) : (
                                    <UserCircle2 className="h-9 w-9 text-foreground/60" />
                                )}
                            </div>
                            <div className="text-left">
                                <div className="text-xs text-foreground/60">You</div>
                                <div className="text-sm font-medium">{me?.name ?? "Profile"}</div>
                            </div>
                        </Link>
                        <div className="flex items-center gap-2">
                            <button className="rounded-full border border-white/10 bg-white/5 p-2 text-foreground/80 hover:bg-white/10" title="Boost"><Bolt className="h-4 w-4" /></button>
                            <button className="rounded-full border border-white/10 bg-white/5 p-2 text-foreground/80 hover:bg-white/10" title="Insights"><BarChart3 className="h-4 w-4" /></button>
                            <button className="rounded-full border border-white/10 bg-white/5 p-2 text-foreground/80 hover:bg-white/10" title="Safety"><Shield className="h-4 w-4" /></button>
                        </div>
                    </div>

                    {/* Notification card removed by request */}

                    {/* Matches/Messages tabs */}
                    <LeftRailTabs convos={convos} likers={likers} meId={Number(me?.id)} myTier={me?.subscription_tier} superLikedByIds={superLikedByIds} />
                </aside>

                {/* Right: deck or chat panel (client switches via URL) */}
                <MatchOverlay meId={Number(me?.id)} />
                <RightRail meId={Number(me?.id)} deckItems={deckItems} convos={convos} boostedIds={boostedIds} superLikedByIds={superLikedByIds} />
            </div>
        </main>
    );
}
