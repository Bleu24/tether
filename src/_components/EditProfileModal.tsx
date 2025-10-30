"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";
import { INTEREST_CATEGORIES, INTEREST_MAX } from "@/lib/interests";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Props = {
    open: boolean;
    onClose: () => void;
    userId: number;
    initial: {
        name?: string;
        birthdate?: string | null;
        gender?: string | null;
        location?: string | null;
        bio?: string | null;
    };
};

type Pref = {
    min_age: number;
    max_age: number;
    distance: number;
    gender_preference: "male" | "female" | "non-binary" | "any";
    interests: string[];
};

export default function EditProfileModal({ open, onClose, userId, initial }: Props) {
    const [tab, setTab] = useState<"profile" | "preferences" | "interests">("profile");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState({
        name: initial.name ?? "",
        birthdate: initial.birthdate ?? "",
        gender: initial.gender ?? "",
        location: initial.location ?? "",
        bio: initial.bio ?? "",
    });

    const [pref, setPref] = useState<Pref>({
        min_age: 21,
        max_age: 40,
        distance: 50,
        gender_preference: "any",
        interests: [],
    });

    useEffect(() => {
        if (!open) return;
        // Fetch preferences for the user when modal opens
        fetch(`${API_URL}/api/users/${userId}/preferences`, { credentials: "include" })
            .then((r) => r.json().catch(() => null))
            .then((j) => {
                const d = (j?.data ?? j) as Partial<Pref> | undefined;
                if (d) setPref((p) => ({ ...p, ...d } as Pref));
            })
            .catch(() => { });
    }, [open, userId]);

    async function save() {
        try {
            setSaving(true);
            setError(null);
            // Update user profile
            const toYmd = (val: string | undefined) => {
                if (!val) return undefined as string | undefined;
                if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
                const d = new Date(val);
                if (isNaN(d.getTime())) return undefined as string | undefined;
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, "0");
                const day = String(d.getDate()).padStart(2, "0");
                return `${y}-${m}-${day}`;
            };
            const uRes = await fetch(`${API_URL}/api/users/${userId}`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: form.name,
                    birthdate: toYmd(form.birthdate || undefined),
                    gender: form.gender || undefined,
                    location: form.location || undefined,
                    bio: form.bio || undefined,
                }),
            });
            if (!uRes.ok) throw new Error(`Profile update failed (${uRes.status})`);

            // Update preferences
            const pRes = await fetch(`${API_URL}/api/users/${userId}/preferences`, {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(pref),
            });
            if (!pRes.ok) throw new Error(`Preferences update failed (${pRes.status})`);

            onClose();
            // refresh
            if (typeof window !== "undefined") window.location.reload();
        } catch (e: any) {
            setError(e?.message || "Save failed");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Modal open={open} onClose={onClose} title="Edit Profile" widthClassName="max-w-2xl">
            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-white/10">
                <button
                    className={`pb-2 text-sm ${tab === "profile" ? "border-b-2 border-fuchsia-400 font-medium" : "text-foreground/70"}`}
                    onClick={() => setTab("profile")}
                >
                    Profile
                </button>
                <button
                    className={`pb-2 text-sm ${tab === "preferences" ? "border-b-2 border-fuchsia-400 font-medium" : "text-foreground/70"}`}
                    onClick={() => setTab("preferences")}
                >
                    Preferences
                </button>
                <button
                    className={`pb-2 text-sm ${tab === "interests" ? "border-b-2 border-fuchsia-400 font-medium" : "text-foreground/70"}`}
                    onClick={() => setTab("interests")}
                >
                    Interests
                </button>
            </div>

            {tab === "profile" ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-sm">Name
                        <input className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </label>
                    <label className="text-sm">Birthdate
                        <input type="date" className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={form.birthdate || ""}
                            onChange={(e) => setForm({ ...form, birthdate: e.target.value })} />
                    </label>
                    <label className="text-sm">Gender
                        <select className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={form.gender || ""}
                            onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                            <option value="">Select…</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="other">Other</option>
                        </select>
                    </label>
                    <label className="text-sm">Location
                        <input className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={form.location || ""}
                            onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </label>
                    <label className="col-span-full text-sm">Bio
                        <textarea rows={4} className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={form.bio || ""}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                    </label>
                </div>
            ) : tab === "preferences" ? (
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-sm">Min Age
                        <input type="number" className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={pref.min_age}
                            onChange={(e) => setPref({ ...pref, min_age: Number(e.target.value) })} />
                    </label>
                    <label className="text-sm">Max Age
                        <input type="number" className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={pref.max_age}
                            onChange={(e) => setPref({ ...pref, max_age: Number(e.target.value) })} />
                    </label>
                    <label className="text-sm">Distance (km)
                        <input type="number" className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={pref.distance}
                            onChange={(e) => setPref({ ...pref, distance: Number(e.target.value) })} />
                    </label>
                    <label className="text-sm">Gender Preference
                        <select className="mt-1 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2" value={pref.gender_preference}
                            onChange={(e) => setPref({ ...pref, gender_preference: e.target.value as Pref["gender_preference"] })}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-binary</option>
                            <option value="any">Any</option>
                        </select>
                    </label>
                </div>
            ) : (
                <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between text-xs text-foreground/70">
                        <span>Select up to {INTEREST_MAX} interests</span>
                        <span>
                            {pref.interests.length}/{INTEREST_MAX} selected
                        </span>
                    </div>

                    {INTEREST_CATEGORIES.map((cat) => (
                        <div key={cat.name}>
                            <div className="mb-2 text-sm font-medium">{cat.name}</div>
                            <div className="flex flex-wrap gap-2">
                                {cat.items.map((item) => {
                                    const selected = pref.interests.includes(item.key);
                                    const atLimit = !selected && pref.interests.length >= INTEREST_MAX;
                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            disabled={atLimit}
                                            onClick={() => {
                                                setPref((p) => {
                                                    const exists = p.interests.includes(item.key);
                                                    const next = exists
                                                        ? p.interests.filter((k) => k !== item.key)
                                                        : (p.interests.length < INTEREST_MAX ? [...p.interests, item.key] : p.interests);
                                                    return { ...p, interests: next };
                                                });
                                            }}
                                            className={`rounded-full px-3 py-1 text-xs transition ${selected
                                                    ? "border border-fuchsia-400/50 bg-fuchsia-500/20 text-fuchsia-200"
                                                    : `border ${atLimit ? "border-white/5 text-foreground/40" : "border-white/10 text-foreground/80 hover:bg-white/5"}`
                                                }`}
                                        >
                                            {item.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {error && <div className="mt-3 rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-300">{error}</div>}

            <div className="mt-5 flex justify-end gap-3">
                <button className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" onClick={onClose}>Cancel</button>
                <button disabled={saving} className="rounded-md border border-cyan-400/40 bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-200 hover:brightness-110 disabled:opacity-60" onClick={save}>
                    {saving ? "Saving…" : "Save"}
                </button>
            </div>
        </Modal>
    );
}
