"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type SubscriptionTier = "free" | "plus" | "gold" | "premium";
type Gender = "male" | "female" | "non-binary" | "other";
type GenderPreference = "male" | "female" | "non-binary" | "any";

type User = {
    id: number;
    name: string;
    email: string;
    created_at: string;
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
    const params = useSearchParams();
    const paramUserId = params.get("userId");

    const [userIdInput, setUserIdInput] = useState<string>(paramUserId ?? "");
    const userId = useMemo(() => Number(userIdInput), [userIdInput]);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [user, setUser] = useState<User | null>(null);
    const [pref, setPref] = useState<ProfilePreference | null>(null);

    const [form, setForm] = useState({
        name: "",
        gender: "" as Gender | "",
        location: "",
        bio: "",
        photosCsv: "",
        subscription_tier: "free" as SubscriptionTier,
        min_age: 21,
        max_age: 35,
        distance: 25,
        gender_preference: "any" as GenderPreference,
        interestsCsv: "",
    });

    useEffect(() => {
        // If userId is available, fetch profile + preferences
        if (!userId || Number.isNaN(userId)) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        const fetchUser = fetch(`${API_URL}/api/users/${userId}`).then(async (r) => {
            if (!r.ok) throw new Error(`Failed to load user (${r.status})`);
            return (await r.json()) as User;
        });
        const fetchPref = fetch(`${API_URL}/api/users/${userId}/preferences`).then(async (r) => {
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
                    gender: (u.gender ?? "") as Gender | "",
                    location: u.location ?? "",
                    bio: u.bio ?? "",
                    photosCsv: Array.isArray(u.photos) ? u.photos.join(", ") : "",
                    subscription_tier: (u.subscription_tier ?? "free") as SubscriptionTier,
                    min_age: p?.min_age ?? prev.min_age,
                    max_age: p?.max_age ?? prev.max_age,
                    distance: p?.distance ?? prev.distance,
                    gender_preference: (p?.gender_preference ?? prev.gender_preference) as GenderPreference,
                    interestsCsv: Array.isArray(p?.interests) ? p!.interests.join(", ") : "",
                }));
            })
            .catch((e: any) => setError(e?.message ?? String(e)))
            .finally(() => setLoading(false));
    }, [userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        if (!userId || Number.isNaN(userId)) {
            setSaving(false);
            setError("Please provide a valid userId to save profile.");
            return;
        }

        try {
            const photos = form.photosCsv
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);
            const interests = form.interestsCsv
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0);

            const userBody: Partial<User> = {
                name: form.name,
                gender: form.gender || undefined,
                location: form.location || undefined,
                bio: form.bio || undefined,
                photos: photos.length ? photos : undefined,
                subscription_tier: form.subscription_tier,
            };

            const prefBody: Omit<ProfilePreference, "user_id"> = {
                min_age: Number(form.min_age),
                max_age: Number(form.max_age),
                distance: Number(form.distance),
                gender_preference: form.gender_preference,
                interests,
            };

            const putUser = fetch(`${API_URL}/api/users/${userId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(userBody),
            }).then(async (r) => {
                if (!r.ok) throw new Error(`Failed to save user (${r.status})`);
                return (await r.json()) as User;
            });

            const putPref = fetch(`${API_URL}/api/users/${userId}/preferences`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(prefBody),
            }).then(async (r) => {
                if (!r.ok) throw new Error(`Failed to save preferences (${r.status})`);
                return (await r.json()) as ProfilePreference;
            });

            const [savedUser, savedPref] = await Promise.all([putUser, putPref]);
            setUser(savedUser);
            setPref(savedPref);
            setSuccess("Profile saved successfully.");
        } catch (e: any) {
            setError(e?.message ?? String(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl px-4 py-8">
            <h1 className="text-2xl font-semibold mb-2">Set up your profile</h1>
            <p className="text-sm text-muted-foreground mb-6">
                Complete your profile so we can personalize matches. You can revisit this page later to edit.
            </p>

            {/* User ID selector (temporary until auth is wired) */}
            <div className="mb-6 rounded-md border p-4">
                <label htmlFor="userId" className="block text-sm font-medium mb-1">User ID</label>
                <input
                    id="userId"
                    type="number"
                    value={userIdInput}
                    onChange={(e) => setUserIdInput(e.target.value)}
                    placeholder="e.g., 1"
                    className="w-full rounded-md border px-3 py-2"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                    Pass ?userId=123 in the URL to prefill. This is a temporary input until auth/session is available.
                </p>
            </div>

            {loading ? (
                <div className="text-sm">Loading…</div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-8">
                    {error && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
                    {success && <div className="rounded-md border border-green-300 bg-green-50 p-3 text-sm text-green-800">{success}</div>}

                    {/* Profile section */}
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
                                <label className="block text-sm font-medium mb-1">Photos (URLs, comma-separated)</label>
                                <input
                                    type="text"
                                    value={form.photosCsv}
                                    onChange={(e) => setForm((f) => ({ ...f, photosCsv: e.target.value }))}
                                    className="w-full rounded-md border px-3 py-2"
                                    placeholder="https://example.com/a.jpg, https://example.com/b.jpg"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Match preferences section */}
                    <section>
                        <h2 className="text-xl font-medium mb-3">Match preferences</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Min age</label>
                                <input
                                    type="number"
                                    min={18}
                                    max={100}
                                    value={form.min_age}
                                    onChange={(e) => setForm((f) => ({ ...f, min_age: Number(e.target.value) }))}
                                    className="w-full rounded-md border px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Max age</label>
                                <input
                                    type="number"
                                    min={18}
                                    max={100}
                                    value={form.max_age}
                                    onChange={(e) => setForm((f) => ({ ...f, max_age: Number(e.target.value) }))}
                                    className="w-full rounded-md border px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Distance (km)</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={500}
                                    value={form.distance}
                                    onChange={(e) => setForm((f) => ({ ...f, distance: Number(e.target.value) }))}
                                    className="w-full rounded-md border px-3 py-2"
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
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Interests (comma-separated)</label>
                                <input
                                    type="text"
                                    value={form.interestsCsv}
                                    onChange={(e) => setForm((f) => ({ ...f, interestsCsv: e.target.value }))}
                                    className="w-full rounded-md border px-3 py-2"
                                    placeholder="music, coffee, hiking"
                                />
                            </div>
                        </div>
                    </section>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-black/90 disabled:opacity-50"
                        >
                            {saving ? "Saving…" : "Save profile"}
                        </button>
                        {user && (
                            <span className="text-xs text-muted-foreground">Last loaded user: {user.name} (#{user.id})</span>
                        )}
                    </div>
                </form>
            )}
        </div>
    );
}
