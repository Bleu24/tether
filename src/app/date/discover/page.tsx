import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import SwipeDeck, { type Profile } from "@/src/_components/SwipeDeck";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function fetchMeDiscover(authCookie: string): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/me/discover`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (res.status === 401) redirect("/signup");
    if (!res.ok) throw new Error(`Failed to load discover (${res.status})`);
    return res.json();
}

async function fetchConversations(authCookie: string): Promise<any[]> {
    const res = await fetch(`${API_URL}/api/me/conversations`, {
        headers: { Cookie: `auth_token=${authCookie}` },
        cache: "no-store",
    });
    if (res.status === 401) redirect("/signup");
    if (!res.ok) throw new Error(`Failed to load conversations (${res.status})`);
    return res.json();
}

export default async function DateDiscoverPage() {
    const cookieStore = await (cookies() as any);
    const auth = cookieStore.get("auth_token")?.value;
    if (!auth) redirect("/signup");

    const [discover, convos] = await Promise.all([
        fetchMeDiscover(auth),
        fetchConversations(auth),
    ]);

    const deckItems: Profile[] = (discover ?? []).map((u: any) => ({
        id: u.id,
        name: u.name,
        age: typeof u.age === "number" ? u.age : undefined,
        image: Array.isArray(u.photos) && u.photos.length > 0 ? u.photos[0] : undefined,
        bio: u.bio ?? undefined,
        tags: Array.isArray(u.preferences?.interests) ? u.preferences.interests.slice(0, 4) : [],
    }));

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 text-foreground">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
                {/* Left rail: Matches & Messages (actual data) */}
                <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div>
                        <h2 className="text-sm font-medium text-foreground/80">Matches</h2>
                        <div className="mt-3 grid grid-cols-5 gap-3">
                            {convos.slice(0, 10).map((c) => {
                                const initials = (c.otherUser?.name || "?")
                                    .split(" ")
                                    .map((p: string) => p[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase();
                                return (
                                    <div key={c.match.id} className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-white/90">
                                        {initials}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-sm font-medium text-foreground/80">Messages</h2>
                        <ul className="mt-3 space-y-2">
                            {convos.map((c) => (
                                <li key={c.match.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                                    <div>
                                        <div className="font-medium">{c.otherUser?.name ?? "Unknown"}</div>
                                        <div className="text-foreground/60 truncate max-w-[200px]">{c.latestMessage?.content ?? "No messages yet"}</div>
                                    </div>
                                    <span className="text-xs text-foreground/50">{new Date(c.latestMessage?.created_at ?? c.match.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Right: Deck + controls */}
                <section>
                    <div className="mx-auto max-w-md">
                        {/* Auth is enforced by server (redirects if no user). Disable signup gate here. */}
                        <SwipeDeck items={deckItems} signupGateEnabled={false} />
                    </div>
                    <p className="mt-3 text-center text-xs text-foreground/60">Drag cards or use the buttons to pass or like.</p>
                </section>
            </div>
        </main>
    );
}
