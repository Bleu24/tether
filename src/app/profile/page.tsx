import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfilePreview from "@/_components/ProfilePreview";
import ProfileAccountActions from "@/_components/ProfileAccountActions";
import LogoutButton from "@/_components/LogoutButton";
import { Eye, EyeOff, Lock, Sparkles, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
    return (j?.data ?? j ?? null) as any | null;
}

export default async function ProfilePage() {
    const cookieStore = await (cookies() as any);
    const auth = cookieStore.get("auth_token")?.value;
    if (!auth) redirect("/signup");

    const me = await fetchMe(auth);
    if (!me) redirect("/signup");

    const resolveUrl = (u: string) => (u?.startsWith("http") ? u : `${API_URL}${u}`);

    const previewUser = {
        id: me.id,
        name: me.name ?? "You",
        age: typeof me.age === "number" ? me.age : undefined,
        bio: me.bio ?? undefined,
        photos: Array.isArray(me.photos) ? me.photos.map((p: string) => resolveUrl(p)) : [],
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
                    {/* Membership */}
                    <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold">Membership</h2>
                            <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[11px] font-medium text-fuchsia-300">Preview</span>
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                            <button className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"><Sparkles className="h-3.5 w-3.5" /> Plus</button>
                            <button className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10 font-medium">Gold</button>
                            <button className="flex items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10">Premium</button>
                        </div>
                        <p className="mt-2 text-xs text-foreground/70">Plans are informational for now.</p>
                    </section>

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
                        <ProfilePreview user={previewUser} />
                    </div>
                </section>
            </div>
        </main>
    );
}
