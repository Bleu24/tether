import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type Profile } from "@/_components/SwipeDeck";
import SwipeDeckWithActions from "@/_components/SwipeDeckWithActions";
import { UserCircle2, Bolt, BarChart3, Shield, SlidersHorizontal, RefreshCw } from "lucide-react";
import Link from "next/link";
import LeftRailTabs from "@/_components/LeftRailTabs";
import MatchOverlay from "@/_components/MatchOverlay";
import RightRail from "@/_components/RightRail";
import { interestLabel } from "@/lib/interests";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchMeDiscover(authCookie: string): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/me/discover`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (res.status === 401) redirect("/signup");
    if (!res.ok) throw new Error(`Failed to load discover (${res.status})`);
    const j = await res.json().catch(() => null);
    return (j?.data ?? j ?? []) as any[];
}

async function fetchConversations(authCookie: string): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/me/conversations`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (res.status === 401) redirect("/signup");
    if (!res.ok) throw new Error(`Failed to load conversations (${res.status})`);
    const j = await res.json().catch(() => null);
    return (j?.data ?? j ?? []) as any[];
}

async function fetchLikers(authCookie: string): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/me/likers`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (res.status === 401) redirect("/signup");
    if (!res.ok) throw new Error(`Failed to load likers (${res.status})`);
    const j = await res.json().catch(() => null);
    return (j?.data ?? j ?? []) as any[];
}

async function fetchSuperLikers(authCookie: string): Promise<any[]> {
    // Tiny retry/backoff for flaky networks (2 retries)
    const attempt = async () => {
        const res = await fetch(`${API_URL}/api/me/superlikers`, {
            headers: { Cookie: `auth_token=${authCookie}` },
            cache: "no-store",
        });
        if (res.status === 401) redirect("/signup");
        if (!res.ok) throw new Error(String(res.status));
        const j = await res.json().catch(() => null);
        return (j?.data ?? j ?? []) as any[];
    };
    try { return await attempt(); }
    catch { await new Promise(r => setTimeout(r, 150)); }
    try { return await attempt(); }
    catch { await new Promise(r => setTimeout(r, 400)); }
    try { return await attempt(); }
    catch { return []; }
}

async function fetchBoostedActive(authCookie: string, ids: number[]): Promise<number[]> {
    if (!ids.length) return [];
    const params = encodeURIComponent(ids.join(","));
    const res = await fetch(`${API_URL}/api/boost/active?ids=${params}`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (res.status === 401) redirect("/signup");
    if (!res.ok) return [];
    const j = await res.json().catch(() => null);
    return (j?.data?.boostedIds ?? j?.boostedIds ?? []) as number[];
}

async function fetchMe(authCookie: string): Promise<any | null> {
    const res = await fetch(`${API_URL}/api/me`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (res.status === 401) redirect("/signup");
    if (!res.ok) return null;
    const j = await res.json().catch(() => null);
    const me = (j?.data ?? j ?? null) as any | null;
    if (me?.is_deleted) redirect("/signup");
    return me;
}

export default async function DateDiscoverPage() {
    const cookieStore = await (cookies() as any);
    const auth = cookieStore.get("auth_token")?.value;
    if (!auth) redirect("/signup");

    const [me, discover, convos, likers, superlikers] = await Promise.all([
        fetchMe(auth),
        fetchMeDiscover(auth),
        fetchConversations(auth),
        fetchLikers(auth),
        fetchSuperLikers(auth),
    ]);

    if (me && !me.setup_complete) {
        redirect("/setup");
    }

    // Deduplicate candidates by id to avoid any accidental repeats from the API layer
    const seen = new Set<string | number>();
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
            // Convert interest keys to user-facing labels; let card handle truncation
            tags: Array.isArray(u.preferences?.interests)
                ? u.preferences.interests.map((k: string) => interestLabel(k))
                : [],
        }));

    const boostedIds = await fetchBoostedActive(auth, deckItems.map(d => Number(d.id)));
    const superLikedByIds = (superlikers ?? []).map((u: any) => Number(u.id)).filter((n) => Number.isFinite(n));

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
