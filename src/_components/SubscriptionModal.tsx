"use client";

import React from "react";
import Modal from "./Modal";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");

type Plan = {
    id: "plus" | "gold" | "premium";
    name: string;
    price: string; // e.g., ₱249/mo
    perks: string[];
};

const PLANS: Plan[] = [
    { id: "plus", name: "Plus", price: "₱249/mo", perks: ["Unlimited likes", "1 Superlike/day", "See who liked you"] },
    { id: "gold", name: "Gold", price: "₱499/mo", perks: ["All Plus perks", "5 Superlikes/day", "Boost once a week"] },
    { id: "premium", name: "Premium", price: "₱899/mo", perks: ["All Gold perks", "Unlimited rewinds", "Priority in recommendations"] },
];

export default function SubscriptionModal({ open, onClose, userId, onSubscribed }: { open: boolean; onClose: () => void; userId: number; onSubscribed?: (tier: string) => void; }) {
    const [busy, setBusy] = React.useState<string | null>(null);
    async function subscribe(plan: Plan["id"]) {
        try {
            setBusy(plan);
            const res = await fetch(`${API_URL}/api/users/${userId}/subscription`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ plan }),
            });
            if (!res.ok) throw new Error(`Failed to subscribe (${res.status})`);
            onClose();
            onSubscribed?.(plan);
            // Best effort refresh so other rails update
            try { (await import("next/navigation")).useRouter().refresh(); } catch { }
            if (typeof window !== "undefined") window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setBusy(null);
        }
    }

    return (
        <Modal open={open} onClose={onClose} title="Choose your plan" widthClassName="max-w-3xl">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {PLANS.map((p) => (
                    <div key={p.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="mb-1 text-sm font-semibold">{p.name}</div>
                        <div className="mb-3 text-lg font-bold">{p.price}</div>
                        <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-foreground/80">
                            {p.perks.map((perk, i) => (
                                <li key={i}>{perk}</li>
                            ))}
                        </ul>
                        <button
                            className="w-full rounded-md bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-black hover:brightness-105 disabled:opacity-60"
                            disabled={!!busy}
                            onClick={() => subscribe(p.id)}
                        >
                            {busy === p.id ? "Processing…" : `Choose ${p.name}`}
                        </button>
                    </div>
                ))}
            </div>
        </Modal>
    );
}
