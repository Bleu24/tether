"use client";

import React from "react";
import { useRouter } from "next/navigation";
import ProfilePreview from "@/_components/ProfilePreview";
import ProfileAccountActions from "@/_components/ProfileAccountActions";
import LogoutButton from "@/_components/LogoutButton";
import Link from "next/link";
import ProfileMembershipActions from "@/_components/ProfileMembershipActions";
import { interestLabel } from "@/lib/interests";
import ResourceCounters from "@/_components/ResourceCounters";
import { ArrowLeft, EyeOff, Lock } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

export default function ProfilePageClient() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(true);
  const [me, setMe] = React.useState<any | null>(null);
  const [slCan, setSlCan] = React.useState<{ remaining?: number | null; next?: string | null }>({});
  const [boostCan, setBoostCan] = React.useState<{ remaining?: number | null; next?: string | null }>({});
  const [boostStatus, setBoostStatus] = React.useState<{ isActive: boolean; endsAt?: string | null; nextAvailableAt?: string | null; canActivate: boolean }>({ isActive: false, canActivate: false });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetch session user using browser cookies (cross-site allowed via SameSite=None)
        const r = await fetch(`${API_URL}/api/me`, { credentials: "include", cache: "no-store" });
        if (r.status === 401) { router.replace("/signup"); return; }
        if (!r.ok) { router.replace("/signup"); return; }
        const j = await r.json().catch(() => null);
        const m = (j?.data ?? j ?? null) as any | null;
        if (!m || m?.is_deleted) { router.replace("/signup"); return; }
        if (cancelled) return;
        setMe(m);

        // Parallel resource endpoints
        const [sl, bc, bs] = await Promise.all([
          fetch(`${API_URL}/api/superlike/can`, { credentials: "include", cache: "no-store" }).then(async (x) => {
            if (!x.ok) return { remaining: undefined, next: null };
            const jj = await x.json().catch(() => null);
            const d = (jj?.data ?? jj ?? {}) as any;
            return { remaining: d.remaining ?? (d.canUse ? (d.window === "daily" ? 1 : null) : 0), next: d.nextAvailableAt ?? null };
          }),
          fetch(`${API_URL}/api/boost/can`, { credentials: "include", cache: "no-store" }).then(async (x) => {
            if (!x.ok) return { remaining: undefined, next: null };
            const jj = await x.json().catch(() => null);
            const d = (jj?.data ?? jj ?? {}) as any;
            return { remaining: d.remaining ?? (d.canActivate ? 1 : 0), next: d.nextAvailableAt ?? null };
          }),
          fetch(`${API_URL}/api/boost/status`, { credentials: "include", cache: "no-store" }).then(async (x) => {
            if (!x.ok) return { isActive: false, canActivate: false, nextAvailableAt: null } as any;
            const jj = await x.json().catch(() => null);
            const d = (jj?.data ?? jj ?? {}) as any;
            return { isActive: !!d.isActive, endsAt: d.endsAt ?? null, nextAvailableAt: d.nextAvailableAt ?? null, canActivate: !!d.canActivate };
          }),
        ]);
        if (cancelled) return;
        setSlCan(sl);
        setBoostCan(bc);
        setBoostStatus(bs);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-[1400px] px-4 pt-10 text-sm text-foreground/70">Loading…</div>
      </main>
    );
  }
  if (!me) return null; // redirected

  const resolveUrl = (u: string) => (u?.startsWith("http") ? u : `${API_URL}${u}`);
  const previewUser = {
    id: me.id,
    name: me.name ?? "You",
    age: typeof me.age === "number" ? me.age : undefined,
    bio: me.bio ?? undefined,
    photos: Array.isArray(me.photos) ? me.photos.map((p: string) => resolveUrl(p)) : [],
    tags: Array.isArray(me.preferences?.interests) ? me.preferences.interests.map((k: string) => interestLabel(k)) : [],
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
        {/* Left rail */}
        <aside className="space-y-4">
          <ProfileMembershipActions userId={me.id} currentTier={me.subscription_tier ?? "free"} />

          <ResourceCounters superLike={slCan} boost={{ ...boostCan, activeUntil: boostStatus.isActive ? (boostStatus.endsAt ?? null) : null }} />

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

          <ProfileAccountActions user={{
            id: previewUser.id,
            name: previewUser.name,
            birthdate: me.birthdate ?? null,
            gender: me.gender ?? null,
            location: me.location ?? null,
            bio: me.bio ?? null,
            photos: Array.isArray(me.photos) ? me.photos.map((p: string) => resolveUrl(p)) : [],
          }} />

          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold mb-2">Session</h2>
            <LogoutButton />
          </section>
        </aside>

        {/* Right rail */}
        <section className="pb-10">
          <div className="mx-auto max-w-md">
            {boostStatus.isActive && (
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
