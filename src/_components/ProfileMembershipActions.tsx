"use client";

import React from "react";
import SubscriptionModal from "@/_components/SubscriptionModal";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

const PLANS = [
    {
        id: "plus" as const,
        name: "Plus",
        price: "₱249/mo",
        perks: [
            "Unlimited likes",
            "See who liked you",
            "1 Super Like/day",
        ],
    },
    {
        id: "gold" as const,
        name: "Gold",
        price: "₱499/mo",
        perks: [
            "All Plus perks",
            "5 Super Likes/day",
            "2 Boosts/day (30 min each)",
        ],
    },
    {
        id: "premium" as const,
        name: "Premium",
        price: "₱899/mo",
        perks: [
            "All Gold perks",
            "Unlimited Super Likes",
            "Unlimited Boosts (30 min each, 12h cooldown)",
            "Priority in recommendations",
        ],
    },
];

export default function ProfileMembershipActions({ userId, currentTier }: { userId: number; currentTier?: string | null }) {
    const [open, setOpen] = React.useState(false);
    const [busy, setBusy] = React.useState<string | null>(null);

    async function subscribe(plan: "plus" | "gold" | "premium") {
        try {
            setBusy(plan);
            const res = await fetch(`${API_URL}/api/users/${userId}/subscription`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            if (!res.ok) throw new Error(`Failed to subscribe (${res.status})`);
            if (typeof window !== "undefined") window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(null);
        }
    }

    async function cancel() {
        try {
            setBusy("cancel");
            const res = await fetch(`${API_URL}/api/users/${userId}/subscription`, { method: "DELETE", credentials: "include" });
            if (!res.ok) throw new Error(`Failed to cancel (${res.status})`);
            if (typeof window !== "undefined") window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(null);
        }
    }

    return (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Membership</h2>
                {currentTier && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-foreground/70">Current: {currentTier}</span>}
            </div>
            <div className="grid grid-cols-1 gap-3">
                {PLANS.map((p) => (
                    <div key={p.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="text-sm font-semibold">{p.name}</div>
                        <div className="mb-2 text-lg font-bold">{p.price}</div>
                        <ul className="mb-3 list-disc space-y-1 pl-5 text-sm text-foreground/80 break-words">
                            {p.perks.map((perk, i) => (
                                <li key={i}>{perk}</li>
                            ))}
                        </ul>
                        <button
                            className="w-full rounded-md bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-black hover:brightness-105 disabled:opacity-60"
                            onClick={() => subscribe(p.id)}
                            disabled={!!busy}
                        >
                            {busy === p.id ? "Processing…" : `Choose ${p.name}`}
                        </button>
                    </div>
                ))}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 text-xs">
                <button className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 hover:bg-white/10" onClick={() => setOpen(true)}>Open plans modal</button>
                {currentTier && currentTier !== "free" && (
                    <button
                        className="rounded-md border border-red-400/40 bg-red-500/20 px-3 py-1.5 font-medium text-red-200 hover:brightness-110 disabled:opacity-60"
                        onClick={cancel}
                        disabled={busy === "cancel"}
                    >
                        {busy === "cancel" ? "Cancelling…" : "Cancel subscription (go Free)"}
                    </button>
                )}
            </div>

            <SubscriptionModal open={open} onClose={() => setOpen(false)} userId={userId} />
        </section>
    );
}
