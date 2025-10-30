import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { type Profile } from "@/_components/SwipeDeck";
import SwipeDeckWithActions from "@/_components/SwipeDeckWithActions";
import { UserCircle2, Bolt, BarChart3, Shield, SlidersHorizontal, RefreshCw } from "lucide-react";
import Link from "next/link";
import DismissibleOffer from "@/_components/DismissibleOffer";
import LeftRailTabs from "@/_components/LeftRailTabs";

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

async function fetchMe(authCookie: string): Promise<any | null> {
    const res = await fetch(`${API_URL}/api/me`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (res.status === 401) redirect("/signup");
    if (!res.ok) return null;
    const j = await res.json().catch(() => null);
    return (j?.data ?? j ?? null) as any | null;
}

export default async function DateDiscoverPage() {
    const cookieStore = await (cookies() as any);
    const auth = cookieStore.get("auth_token")?.value;
    if (!auth) redirect("/signup");

    const [me, discover, convos] = await Promise.all([
        fetchMe(auth),
        fetchMeDiscover(auth),
        fetchConversations(auth),
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
            tags: Array.isArray(u.preferences?.interests) ? u.preferences.interests.slice(0, 4) : [],
        }));

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

                    {/* Notification card */}
                    <div className="mt-4 rounded-lg border border-white/10 bg-gradient-to-br from-pink-500/20 via-fuchsia-500/10 to-orange-400/20 p-4">
                        <DismissibleOffer storageKey="discover_offer_dismissed">
                            <div className="text-sm font-medium">Get a Free Boost</div>
                            <p className="mt-1 text-xs text-foreground/80">Upgrade to Gold, get a one-time Boost!</p>
                            <button className="mt-3 w-full rounded-md bg-fuchsia-500 px-3 py-2 text-sm font-medium text-black hover:brightness-105">Claim Offer</button>
                        </DismissibleOffer>
                    </div>

                    {/* Matches/Messages tabs */}
                    <LeftRailTabs convos={convos} />
                </aside>

                {/* Right: Deck + controls or empty state */}
                <section className="flex h-full flex-col items-center justify-center">
                    <div className="mx-auto max-w-md w-full">
                        {deckItems.length > 0 ? (
                            <>
                                <SwipeDeckWithActions items={deckItems} meId={Number(me?.id)} />
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
            </div>
        </main>
    );
}
