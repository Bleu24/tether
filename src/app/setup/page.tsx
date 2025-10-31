"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@/_contexts/UserContext";
import { INTEREST_CATEGORIES, INTEREST_MAX } from "@/lib/interests";

type SubscriptionTier = "free" | "plus" | "gold" | "premium";
type Gender = "male" | "female" | "non-binary" | "other";
type GenderPreference = "male" | "female" | "non-binary" | "any";

type User = {
    id: number;
    name: string;
    email: string;
    created_at: string;
    birthdate?: string | null;
    gender?: Gender | null;
    location?: string | null;
    bio?: string | null;
    photos?: string[] | null;
    subscription_tier?: SubscriptionTier | null;
    setup_complete?: boolean | number | null;
};

type ProfilePreference = {
    user_id: number;
    min_age: number;
    max_age: number;
    distance: number;
    gender_preference: GenderPreference;
    interests: string[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SetupProfilePage() {
    const router = useRouter();
    const { setUser } = useUser();

    const [loading, setLoading] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [sessionUser, setSessionUser] = useState<User | null>(null);
    const [pref, setPref] = useState<ProfilePreference | null>(null);
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [form, setForm] = useState({
        name: "",
        birthdate: "",
        gender: "" as Gender | "",
        location: "",
        bio: "",
        photos: [] as string[],
        subscription_tier: "free" as SubscriptionTier,
        min_age: 21,
        max_age: 35,
        distance: 10,
        gender_preference: "any" as GenderPreference,
        interestsSelected: [] as string[],
    });

    // INTEREST_CATEGORIES and INTEREST_MAX are imported from shared lib
    const selectedCount = form.interestsSelected.length;
    const [interestError, setInterestError] = useState<string | null>(null);

    const resolveUrl = (u: string) => (u?.startsWith("http") ? u : `${API_URL}${u}`);

    // Normalize any date-like value into yyyy-MM-dd for <input type="date"/>
    const toYmd = (val?: string | null): string => {
        if (!val) return "";
        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
        const d = new Date(val);
        if (isNaN(d.getTime())) return "";
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    useEffect(() => {
        // Fetch current user from JWT cookie with a short retry to avoid race after signup/login
        let cancelled = false;
        setLoading(true);
        setError(null);
        setSuccess(null);

        const tryFetch = async (attempt = 1): Promise<User> => {
            const r = await fetch(`${API_URL}/api/me`, { credentials: "include" });
            if (r.ok) {
                let json: any = null;
                try { json = await r.json(); } catch { /* ignore */ }
                const user = json?.data ?? json; // support both wrapped and raw
                const id = Number(user?.id);
                if (Number.isFinite(id) && id > 0) return user as User;
                // Shape invalid: retry briefly (possible race after signup/login)
                if (attempt < 3) {
                    await new Promise((res) => setTimeout(res, 350));
                    return tryFetch(attempt + 1);
                }
                throw new Error("Session not ready. Please try again.");
            }
            // 401/404: give the cookie a moment to propagate after signup/login
            if (attempt < 3 && (r.status === 401 || r.status === 404)) {
                await new Promise((res) => setTimeout(res, 350));
                return tryFetch(attempt + 1);
            }
            throw new Error(`Failed to load user (${r.status})`);
        };

        (async () => {
            try {
                const u = await tryFetch();
                if (cancelled) return;
                if (u?.setup_complete) { router.replace("/date/discover"); return; }
                setUser({ id: u.id, name: u.name ?? "You", email: u.email, photo: Array.isArray(u.photos) ? u.photos[0] : null, setupComplete: !!u.setup_complete });
                setSessionUser(u);
                setSessionReady(true);
                // Fetch preferences for this user (may not exist yet)
                if (!Number.isFinite(u.id)) throw new Error("Invalid session user id");
                const r = await fetch(`${API_URL}/api/users/${u.id}/preferences`, { credentials: "include" });
                let p: ProfilePreference | null = null;
                try {
                    const j = await r.json().catch(() => null);
                    const raw = j?.data ?? j;
                    p = raw as ProfilePreference | null;
                } catch { p = null; }
                setPref(p ?? null);
                setForm((prev) => ({
                    ...prev,
                    name: u.name ?? "",
                    birthdate: toYmd(u.birthdate ?? undefined),
                    gender: (u.gender ?? "") as Gender | "",
                    location: u.location ?? "",
                    bio: u.bio ?? "",
                    photos: Array.isArray(u.photos) ? u.photos.map((p) => resolveUrl(p)) : [],
                    subscription_tier: (u.subscription_tier ?? "free") as SubscriptionTier,
                    min_age: p?.min_age ?? 21,
                    max_age: p?.max_age ?? 35,
                    distance: Math.min(p?.distance ?? prev.distance, 50),
                    gender_preference: (p?.gender_preference ?? prev.gender_preference) as GenderPreference,
                    interestsSelected: Array.isArray(p?.interests) ? [...(p!.interests || [])] : [],
                }));
            } catch (e: any) {
                if (!cancelled) setError(e?.message ?? String(e));
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => { cancelled = true; };
    }, []);

    // Extracted save routine so we only submit when user clicks Finish
    const saveAll = async () => {
        if (loading || !sessionReady) {
            setError("Still establishing your session. Please wait a moment and try again.");
            return;
        }
        setSaving(true);
        setError(null);
        setSuccess(null);

        let effectiveUserId = sessionUser?.id;
        if (!effectiveUserId) {
            try {
                const me = await fetch(`${API_URL}/api/me`, { credentials: "include" });
                if (me.ok) {
                    const j = await me.json().catch(() => null);
                    const meUser = (j?.data ?? j) as User | null;
                    if (meUser?.id) {
                        setSessionUser(meUser);
                        effectiveUserId = meUser.id;
                    }
                }
            } catch { }
        }
        if (!effectiveUserId) {
            setSaving(false);
            setError("You're not signed in. Please log in again.");
            return;
        }

        try {
            const photos = [...form.photos];
            const interests = [...form.interestsSelected];

            const userBody: Partial<User> = {
                name: form.name,
                birthdate: ((): string | undefined => {
                    const bd = toYmd(form.birthdate || undefined);
                    return bd || undefined;
                })(),
                gender: form.gender || undefined,
                location: form.location || undefined,
                bio: form.bio || undefined,
                photos: photos.length ? photos : undefined,
                setup_complete: true,
            };

            const prefBody: Omit<ProfilePreference, "user_id"> = {
                min_age: Number(form.min_age),
                max_age: Number(form.max_age),
                distance: Math.min(Number(form.distance), 50),
                gender_preference: form.gender_preference,
                interests,
            };

            const putUser = fetch(`${API_URL}/api/users/${effectiveUserId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(userBody),
            }).then(async (r) => {
                if (!r.ok) throw new Error(`Failed to save user (${r.status})`);
                const j = await r.json();
                return (j?.data ?? j) as User;
            });

            const putPref = fetch(`${API_URL}/api/users/${effectiveUserId}/preferences`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(prefBody),
            }).then(async (r) => {
                if (!r.ok) throw new Error(`Failed to save preferences (${r.status})`);
                const j = await r.json();
                return (j?.data ?? j) as ProfilePreference;
            });

            const [savedUser, savedPref] = await Promise.all([putUser, putPref]);
            // Normalize and update local context immediately
            setUser({ id: savedUser.id, name: savedUser.name ?? "You", email: savedUser.email, photo: Array.isArray(savedUser.photos) ? savedUser.photos[0] : null, setupComplete: true });
            setPref(savedPref);
            // Navigate to discover immediately after save
            router.replace("/date/discover");
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setSaving(false);
        }
    };

    // Prevent implicit form submission; we trigger saveAll only on explicit click
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
    };

    // Image upload helpers
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const handlePickFiles = () => fileInputRef.current?.click();
    const handleFilesSelected = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        try {
            const fd = new FormData();
            Array.from(files).forEach((f) => fd.append("files", f));
            const resp = await fetch(`${API_URL}/api/uploads`, {
                method: "POST",
                body: fd,
                credentials: "include",
            });
            if (!resp.ok) throw new Error(`Upload failed (${resp.status})`);
            const data = (await resp.json()) as { urls: string[] };
            const abs = data.urls.map((u) => resolveUrl(u));
            setForm((f) => ({ ...f, photos: [...f.photos, ...abs].slice(0, 6) }));
        } catch (e: any) {
            setError(e?.message ?? String(e));
        }
    };
    const removePhotoAt = (idx: number) => setForm((f) => ({ ...f, photos: f.photos.filter((_, i) => i !== idx) }));

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-2xl font-semibold mb-2">Set up your profile</h1>
            <p className="text-sm text-muted-foreground mb-6">Complete your profile so we can personalize matches.</p>

            {/* Progress */}
            <div className="mb-6 flex items-center gap-2">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className={`h-2 flex-1 rounded-full ${i <= step ? "bg-black dark:bg-white" : "bg-gray-300 dark:bg-gray-700"}`}
                    />
                ))}
            </div>

            {loading ? (
                <div className="text-sm">Loading…</div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
                    {success && <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">{success}</div>}

                    {/* Step 1: Basic info */}
                    {step === 1 && (
                        <section>
                            <h2 className="text-xl font-medium mb-3">Profile</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        className="w-full rounded-md border px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Birthdate</label>
                                    <input
                                        type="date"
                                        value={form.birthdate}
                                        onChange={(e) => setForm((f) => ({ ...f, birthdate: e.target.value }))}
                                        className="w-full rounded-md border px-3 py-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Gender</label>
                                    <select
                                        value={form.gender}
                                        onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value as Gender }))}
                                        className="w-full rounded-md border px-3 py-2 bg-white text-black dark:bg-black dark:text-white"
                                    >
                                        <option value="">Prefer not to say</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="non-binary">Non-binary</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={form.location}
                                        onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                                        className="w-full rounded-md border px-3 py-2"
                                        placeholder="City or region"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-1">Bio</label>
                                    <textarea
                                        value={form.bio}
                                        onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                                        className="w-full rounded-md border px-3 py-2 min-h-[100px]"
                                        placeholder="Tell people about yourself…"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2">Photos</label>
                                    <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFilesSelected(e.target.files)} />
                                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                                        {Array.from({ length: 6 }).map((_, i) => {
                                            const url = form.photos[i];
                                            return (
                                                <div key={i} className="relative aspect-square rounded-md border border-dashed flex items-center justify-center overflow-hidden">
                                                    {url ? (
                                                        <>
                                                            <img src={url} alt="uploaded" className="h-full w-full object-cover" crossOrigin="anonymous" />
                                                            <button type="button" onClick={() => removePhotoAt(i)} className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white text-xs">×</button>
                                                        </>
                                                    ) : (
                                                        <button type="button" onClick={handlePickFiles} className="flex h-full w-full items-center justify-center text-2xl text-gray-400 hover:text-gray-600">+</button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground">Tap + to add up to 6 photos.</p>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Step 2: Preferences */}
                    {step === 2 && (
                        <section>
                            <h2 className="text-xl font-medium mb-3">Match preferences</h2>
                            <div className="space-y-6">
                                {/* 2-point (double) slider for age */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium">Age range</label>
                                        <span className="text-sm">{form.min_age} - {form.max_age}</span>
                                    </div>
                                    <div className="relative h-10">
                                        {/* background track */}
                                        <div className="absolute left-0 right-0 top-3 h-1 rounded bg-gray-300 dark:bg-gray-700" />
                                        {/* active range fill */}
                                        {(() => {
                                            const MIN = 18, MAX = 100;
                                            const left = ((form.min_age - MIN) / (MAX - MIN)) * 100;
                                            const right = ((form.max_age - MIN) / (MAX - MIN)) * 100;
                                            return (
                                                <div
                                                    className="absolute top-3 h-1 rounded bg-black dark:bg-white"
                                                    style={{ left: `${left}%`, width: `${Math.max(0, right - left)}%` }}
                                                />
                                            );
                                        })()}
                                        {/* two thumbs overlayed with thumb capturing pointer events */}
                                        <input
                                            type="range"
                                            min={18}
                                            max={100}
                                            value={form.min_age}
                                            onChange={(e) => {
                                                const v = Math.min(Number(e.target.value), form.max_age);
                                                setForm((f) => ({ ...f, min_age: Math.max(18, v) }));
                                            }}
                                            className="dual-range absolute inset-x-0 top-2 h-2 w-full appearance-none bg-transparent"
                                            style={{ zIndex: form.min_age > form.max_age - 1 ? 6 : 4 }}
                                        />
                                        <input
                                            type="range"
                                            min={18}
                                            max={100}
                                            value={form.max_age}
                                            onChange={(e) => {
                                                const v = Math.max(Number(e.target.value), form.min_age);
                                                setForm((f) => ({ ...f, max_age: Math.min(100, v) }));
                                            }}
                                            className="dual-range absolute inset-x-0 top-2 h-2 w-full appearance-none bg-transparent"
                                            style={{ zIndex: 5 }}
                                        />
                                    </div>
                                    {/* slider CSS helpers */}
                                    <style jsx>{`
                                  .dual-range { pointer-events: none; }
                                  .dual-range::-webkit-slider-thumb { pointer-events: all; -webkit-appearance: none; height: 18px; width: 18px; border-radius: 9999px; background: currentColor; color: #000; }
                                  .dual-range::-moz-range-thumb { pointer-events: all; height: 18px; width: 18px; border-radius: 9999px; background: currentColor; }
                                  :global(html.dark) .dual-range::-webkit-slider-thumb { background: #fff; color:#fff; }
                                  :global(html.dark) .dual-range::-moz-range-thumb { background: #fff; }
                                `}</style>
                                </div>

                                {/* Distance slider */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium">Max distance</label>
                                        <span className="text-sm">{form.distance} km</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={1}
                                        max={50}
                                        value={form.distance}
                                        onChange={(e) => setForm((f) => ({ ...f, distance: Number(e.target.value) }))}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Gender preference</label>
                                    <select
                                        value={form.gender_preference}
                                        onChange={(e) => setForm((f) => ({ ...f, gender_preference: e.target.value as GenderPreference }))}
                                        className="w-full rounded-md border px-3 py-2 bg-white text-black dark:bg-black dark:text-white"
                                    >
                                        <option value="any">Any</option>
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="non-binary">Non-binary</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Step 3: Interests & Hobbies */}
                    {step === 3 && (
                        <section>
                            <div className="md:col-span-2">
                                <div className="flex items-baseline justify-between gap-2 mb-2">
                                    <label className="block text-sm font-medium">Interests</label>
                                    <span className="text-xs text-muted-foreground">
                                        {selectedCount}/{INTEREST_MAX} selected
                                    </span>
                                </div>

                                {interestError && (
                                    <div className="mb-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-800">
                                        {interestError}
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {INTEREST_CATEGORIES.map((cat) => (
                                        <div key={cat.name}>
                                            <h3 className="text-sm font-medium mb-2 text-muted-foreground">{cat.name}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {cat.items.map((it) => {
                                                    const selected = form.interestsSelected.includes(it.key);
                                                    return (
                                                        <motion.button
                                                            key={it.key}
                                                            type="button"
                                                            whileTap={{ scale: 0.97 }}
                                                            onClick={() => {
                                                                setInterestError(null);
                                                                setForm((f) => {
                                                                    const already = f.interestsSelected.includes(it.key);
                                                                    if (already) {
                                                                        return {
                                                                            ...f,
                                                                            interestsSelected: f.interestsSelected.filter((k) => k !== it.key),
                                                                        };
                                                                    }
                                                                    if (f.interestsSelected.length >= INTEREST_MAX) {
                                                                        setInterestError(`You can select up to ${INTEREST_MAX} interests.`);
                                                                        return f;
                                                                    }
                                                                    return {
                                                                        ...f,
                                                                        interestsSelected: [...f.interestsSelected, it.key],
                                                                    };
                                                                });
                                                            }}
                                                            aria-pressed={selected}
                                                            className={
                                                                "inline-flex select-none items-center rounded-full border px-3 py-1.5 text-sm transition-colors " +
                                                                (selected
                                                                    ? "border-black bg-black text-white hover:bg-black/90"
                                                                    : "border-gray-300 bg-white text-gray-900 hover:bg-gray-50")
                                                            }
                                                        >
                                                            {it.label}
                                                        </motion.button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s))}
                            className="inline-flex items-center rounded-md px-4 py-2 border hover:bg-gray-50"
                            disabled={saving || step === 1}
                        >
                            Back
                        </button>
                        {step < 3 ? (
                            <button
                                type="button"
                                onClick={() => setStep((s) => ((s + 1) as 1 | 2 | 3))}
                                className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-black/90"
                                disabled={saving}
                            >
                                Next
                            </button>
                        ) : (
                            <button type="button" onClick={saveAll} disabled={saving || !sessionReady} className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-black/90 disabled:opacity-50">{saving ? "Saving…" : "Finish setup"}</button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
