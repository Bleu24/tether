"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [user, setUser] = useState<User | null>(null);
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

    // Bumble-like curated interests grouped by category (emoji + label)
    const INTEREST_CATEGORIES: Array<{
        name: string;
        items: { key: string; label: string }[];
    }> = [
            {
                name: "Food & drink",
                items: [
                    { key: "beer", label: "🍺 Beer" },
                    { key: "boba", label: "🧋 Boba tea" },
                    { key: "coffee", label: "☕ Coffee" },
                    { key: "foodie", label: "🍽️ Foodie" },
                    { key: "gin", label: "🍸 Gin" },
                    { key: "pizza", label: "🍕 Pizza" },
                    { key: "sushi", label: "🍣 Sushi" },
                    { key: "sweet_tooth", label: "🍬 Sweet tooth" },
                    { key: "tacos", label: "🌮 Tacos" },
                    { key: "tea", label: "🫖 Tea" },
                    { key: "vegan", label: "🌱 Vegan" },
                    { key: "vegetarian", label: "🥗 Vegetarian" },
                    { key: "whisky", label: "🥃 Whisky" },
                    { key: "wine", label: "🍷 Wine" },
                ],
            },
            {
                name: "Traveling",
                items: [
                    { key: "backpacking", label: "🎒 Backpacking" },
                    { key: "beaches", label: "🏖️ Beaches" },
                    { key: "camping", label: "🏕️ Camping" },
                    { key: "exploring_cities", label: "🧭 Exploring new cities" },
                    { key: "fishing_trips", label: "🎣 Fishing trips" },
                    { key: "hiking", label: "🥾 Hiking trips" },
                    { key: "road_trips", label: "🛣️ Road trips" },
                    { key: "spa_weekends", label: "💆 Spa weekends" },
                    { key: "staycations", label: "🏡 Staycations" },
                    { key: "winter_sports", label: "🎿 Winter sports" },
                    { key: "water_sports", label: "🌊 Water sports" },
                ],
            },
        ];

    // Limit to keep UX simple, feel free to tweak
    const INTEREST_MAX = 5;
    const selectedCount = form.interestsSelected.length;
    const [interestError, setInterestError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch current user from JWT cookie
        setLoading(true);
        setError(null);
        setSuccess(null);

        const fetchUser = fetch(`${API_URL}/api/me`, { credentials: "include" }).then(async (r) => {
            if (!r.ok) throw new Error(`Failed to load user (${r.status})`);
            return (await r.json()) as User;
        });
        let userIdLocal = 0;
        const fetchPref = fetchUser.then((u) => {
            userIdLocal = u.id;
            return fetch(`${API_URL}/api/users/${u.id}/preferences`, { credentials: "include" });
        }).then(async (r) => {
            if (!r.ok) {
                // When preferences not set yet, backend may return 200 with null or 404; handle both
                try {
                    return (await r.json()) as ProfilePreference | null;
                } catch {
                    return null;
                }
            }
            return (await r.json()) as ProfilePreference | null;
        });

        Promise.all([fetchUser, fetchPref])
            .then(([u, p]) => {
                setUser(u);
                setPref(p ?? null);
                setForm((prev) => ({
                    ...prev,
                    name: u.name ?? "",
                    birthdate: u.birthdate ?? "",
                    gender: (u.gender ?? "") as Gender | "",
                    location: u.location ?? "",
                    bio: u.bio ?? "",
                    photos: Array.isArray(u.photos) ? [...u.photos] : [],
                    subscription_tier: (u.subscription_tier ?? "free") as SubscriptionTier,
                    min_age: p?.min_age ?? 21,
                    max_age: p?.max_age ?? 35,
                    distance: Math.min(p?.distance ?? prev.distance, 50),
                    gender_preference: (p?.gender_preference ?? prev.gender_preference) as GenderPreference,
                    interestsSelected: Array.isArray(p?.interests) ? [...(p!.interests || [])] : [],
                }));
            })
            .catch((e: any) => setError(e?.message ?? String(e)))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        if (!user?.id) {
            setSaving(false);
            setError("You're not signed in. Please log in again.");
            return;
        }

        try {
            const photos = [...form.photos];
            const interests = [...form.interestsSelected];

            const userBody: Partial<User> = {
                name: form.name,
                birthdate: form.birthdate || undefined,
                gender: form.gender || undefined,
                location: form.location || undefined,
                bio: form.bio || undefined,
                photos: photos.length ? photos : undefined,
                subscription_tier: form.subscription_tier,
            };

            const prefBody: Omit<ProfilePreference, "user_id"> = {
                min_age: Number(form.min_age),
                max_age: Number(form.max_age),
                distance: Math.min(Number(form.distance), 50),
                gender_preference: form.gender_preference,
                interests,
            };

            const putUser = fetch(`${API_URL}/api/users/${user!.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(userBody),
            }).then(async (r) => {
                if (!r.ok) throw new Error(`Failed to save user (${r.status})`);
                return (await r.json()) as User;
            });

            const putPref = fetch(`${API_URL}/api/users/${user!.id}/preferences`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(prefBody),
            }).then(async (r) => {
                if (!r.ok) throw new Error(`Failed to save preferences (${r.status})`);
                return (await r.json()) as ProfilePreference;
            });

            const [savedUser, savedPref] = await Promise.all([putUser, putPref]);
            setUser(savedUser);
            setPref(savedPref);
            setSuccess("Profile saved successfully.");
            // Navigate to discover after successful save
            router.push("/date/discover");
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setSaving(false);
        }
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
            setForm((f) => ({ ...f, photos: [...f.photos, ...data.urls].slice(0, 6) }));
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
                    <div key={i} className={`h-2 flex-1 rounded-full ${i <= step ? "bg-black" : "bg-gray-300 dark:bg-gray-700"}`} />
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
                                        className="w-full rounded-md border px-3 py-2 bg-white"
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
                                <div>
                                    <label className="block text-sm font-medium mb-1">Subscription Tier</label>
                                    <select
                                        value={form.subscription_tier}
                                        onChange={(e) => setForm((f) => ({ ...f, subscription_tier: e.target.value as SubscriptionTier }))}
                                        className="w-full rounded-md border px-3 py-2 bg-white"
                                    >
                                        <option value="free">Free</option>
                                        <option value="plus">Plus</option>
                                        <option value="gold">Gold</option>
                                        <option value="premium">Premium</option>
                                    </select>
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
                                                            <img src={url} alt="uploaded" className="h-full w-full object-cover" />
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
                                        <input
                                            type="range"
                                            min={18}
                                            max={100}
                                            value={form.min_age}
                                            onChange={(e) => {
                                                const v = Math.min(Number(e.target.value), form.max_age);
                                                setForm((f) => ({ ...f, min_age: v }));
                                            }}
                                            className="absolute inset-x-0 top-2 h-2 w-full appearance-none bg-transparent"
                                        />
                                        <input
                                            type="range"
                                            min={18}
                                            max={100}
                                            value={form.max_age}
                                            onChange={(e) => {
                                                const v = Math.max(Number(e.target.value), form.min_age);
                                                setForm((f) => ({ ...f, max_age: v }));
                                            }}
                                            className="absolute inset-x-0 top-2 h-2 w-full appearance-none bg-transparent"
                                        />
                                        {/* track */}
                                        <div className="absolute left-0 right-0 top-3 h-1 rounded bg-gray-300 dark:bg-gray-700" />
                                    </div>
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
                                        className="w-full rounded-md border px-3 py-2 bg-white"
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
                                    {[
                                        ...INTEREST_CATEGORIES,
                                        {
                                            name: "Gym & Fitness",
                                            items: [
                                                { key: "gym", label: "🏋️ Gym" },
                                                { key: "yoga", label: "🧘 Yoga" },
                                                { key: "running", label: "🏃 Running" },
                                            ],
                                        },
                                        {
                                            name: "Music",
                                            items: [
                                                { key: "pop", label: "🎤 Pop" },
                                                { key: "rock", label: "🎸 Rock" },
                                                { key: "hiphop", label: "🎧 Hip-hop" },
                                                { key: "jazz", label: "🎷 Jazz" },
                                                { key: "classical", label: "🎻 Classical" },
                                            ],
                                        },
                                        {
                                            name: "Education",
                                            items: [
                                                { key: "study_buddy", label: "📚 Study" },
                                                { key: "lifelong_learning", label: "🧠 Lifelong learning" },
                                            ],
                                        },
                                        {
                                            name: "Religion",
                                            items: [
                                                { key: "christian", label: "✝️ Christian" },
                                                { key: "muslim", label: "☪️ Muslim" },
                                                { key: "hindu", label: "🕉️ Hindu" },
                                                { key: "buddhist", label: "☸️ Buddhist" },
                                                { key: "spiritual", label: "🔮 Spiritual" },
                                            ],
                                        },
                                        {
                                            name: "Political views",
                                            items: [
                                                { key: "apolitical", label: "⚖️ Apolitical" },
                                                { key: "moderate", label: "⚖️ Moderate" },
                                                { key: "progressive", label: "⚖️ Progressive" },
                                                { key: "conservative", label: "⚖️ Conservative" },
                                            ],
                                        },
                                    ].map((cat) => (
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
                            <button
                                type="submit"
                                disabled={saving}
                                className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-black/90 disabled:opacity-50"
                            >
                                {saving ? "Saving…" : "Finish setup"}
                            </button>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
