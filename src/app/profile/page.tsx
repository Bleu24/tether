import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfilePreview from "@/_components/ProfilePreview";
import ProfileAccountActions from "@/_components/ProfileAccountActions";
import LogoutButton from "@/_components/LogoutButton";
import { Eye, EyeOff, Lock, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";
import ProfileMembershipActions from "@/_components/ProfileMembershipActions";
import { interestLabel } from "@/lib/interests";
import ResourceCounters from "@/_components/ResourceCounters";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// ProfilePreview is a Client Component; importing it directly is supported from a Server Component.

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

async function fetchSuperLikeCan(authCookie: string): Promise<{ remaining?: number | null; next?: string | null }> {
    const res = await fetch(`${API_URL}/api/superlike/can`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (!res.ok) return { remaining: undefined, next: null };
    const j = await res.json().catch(() => null);
    const d = (j?.data ?? j ?? {}) as any;
    return { remaining: d.remaining ?? (d.canUse ? (d.window === "daily" ? 1 : null) : 0), next: d.nextAvailableAt ?? null };
}

async function fetchBoostCan(authCookie: string): Promise<{ remaining?: number | null; next?: string | null }> {
    const res = await fetch(`${API_URL}/api/boost/can`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (!res.ok) return { remaining: undefined, next: null };
    const j = await res.json().catch(() => null);
    const d = (j?.data ?? j ?? {}) as any;
    return { remaining: d.remaining ?? (d.canActivate ? 1 : 0), next: d.nextAvailableAt ?? null };
}

async function fetchBoostStatus(authCookie: string): Promise<{ isActive: boolean; endsAt?: string | null; nextAvailableAt?: string | null; canActivate: boolean }> {
    const res = await fetch(`${API_URL}/api/boost/status`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (!res.ok) return { isActive: false, canActivate: false, nextAvailableAt: null } as any;
    const j = await res.json().catch(() => null);
    const d = (j?.data ?? j ?? {}) as any;
    return { isActive: !!d.isActive, endsAt: d.endsAt ?? null, nextAvailableAt: d.nextAvailableAt ?? null, canActivate: !!d.canActivate };
}

async function fetchBoostActiveSelf(authCookie: string, meId: number): Promise<boolean> {
    const res = await fetch(`${API_URL}/api/boost/active?ids=${encodeURIComponent(String(meId))}`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (!res.ok) return false;
    const j = await res.json().catch(() => null);
    const list = (j?.data?.boostedIds ?? j?.boostedIds ?? []) as number[];
    return Array.isArray(list) && list.includes(Number(meId));
}

export default async function ProfilePage() {
    const cookieStore = await (cookies() as any);
    const auth = cookieStore.get("auth_token")?.value;
    if (!auth) redirect("/signup");

    const [me, slCan, boostCan] = await Promise.all([
        fetchMe(auth),
        fetchSuperLikeCan(auth),
        fetchBoostCan(auth),
    ]);
    if (!me) redirect("/signup");
    const isBoostActive = await fetchBoostActiveSelf(auth, Number(me.id));
    const boostStatus = await fetchBoostStatus(auth);

    const resolveUrl = (u: string) => (u?.startsWith("http") ? u : `${API_URL}${u}`);

    const previewUser = {
        id: me.id,
        name: me.name ?? "You",
        age: typeof me.age === "number" ? me.age : undefined,
        bio: me.bio ?? undefined,
        photos: Array.isArray(me.photos) ? me.photos.map((p: string) => resolveUrl(p)) : [],
        // Convert interest keys to human-friendly labels for display
        tags: Array.isArray(me.preferences?.interests)
            ? me.preferences.interests.map((k: string) => interestLabel(k))
            : [],
    };

    return (
        <main className="min-h-screen bg-background text-foreground">
            {/* Back to Discover */}
            <div className="mx-auto max-w-[1400px] px-4 pt-4">
                <Link
                    href="/date/discover"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-foreground/80 hover:bg-white/10"
                    aria-label="Back to Discover"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
            </div>

            <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[360px_minmax(0,1fr)]">
                {/* Left rail: in-page interactions */}
                <aside className="space-y-4">
                    {/* Membership (interactive) */}
                    <ProfileMembershipActions userId={me.id} currentTier={me.subscription_tier ?? "free"} />

                    {/* Resources counters (live timers) */}
                    <ResourceCounters superLike={slCan} boost={{ ...boostCan, activeUntil: boostStatus.isActive ? (boostStatus.endsAt ?? null) : null }} />

                    {/* Privacy */}
                    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <h2 className="text-sm font-semibold">Privacy</h2>
                        <div className="mt-3 space-y-2 text-sm">
                            <button className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
                                <span className="flex items-center gap-2"><EyeOff className="h-4 w-4" /> Incognito</span>
                                <span className="text-xs text-foreground/60">Off</span>
                            </button>
                            <button className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">
                                <span className="flex items-center gap-2"><Lock className="h-4 w-4" /> Photo Blur</span>
                                <span className="text-xs text-foreground/60">On</span>
                            </button>
                        </div>
                    </section>

                    {/* Account (client interactions) */}
                    <ProfileAccountActions user={{
                        id: previewUser.id,
                        name: previewUser.name,
                        birthdate: me.birthdate ?? null,
                        gender: me.gender ?? null,
                        location: me.location ?? null,
                        bio: me.bio ?? null,
                        photos: Array.isArray(me.photos) ? me.photos.map((p: string) => resolveUrl(p)) : [],
                    }} />

                    {/* Logout button */}
                    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <h2 className="text-sm font-semibold mb-2">Session</h2>
                        <LogoutButton />
                    </section>
                </aside>

                {/* Right rail: profile preview */}
                <section className="pb-10">
                    <div className="mx-auto max-w-md">
                        {isBoostActive && (
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-fuchsia-500/90 px-3 py-1 text-xs font-semibold text-black shadow">
                                ⚡ Boost active
                            </div>
                        )}
                        <ProfilePreview user={previewUser} />
                    </div>
                </section>
            </div>
        </main>
    );
}
