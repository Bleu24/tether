"use client";

import React from "react";
import SwipeDeck, { type Profile } from "@/_components/SwipeDeck";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SwipeDeckWithActions({ items, meId, loop = false, boostedIds = [], superLikedByIds = [] }: { items: Profile[]; meId: number; loop?: boolean; boostedIds?: number[]; superLikedByIds?: number[] }) {
    const [canSuperLike, setCanSuperLike] = React.useState<boolean>(true);
    const [canBoost, setCanBoost] = React.useState<boolean>(true);
    const [slNext, setSlNext] = React.useState<string | null>(null);
    const [boostNext, setBoostNext] = React.useState<string | null>(null);

    async function refreshLimits() {
        try {
            const [sl, b] = await Promise.all([
                fetch(`${API_URL}/api/superlike/can`, { credentials: "include" }).then(r => r.json()).catch(() => null),
                fetch(`${API_URL}/api/boost/can`, { credentials: "include" }).then(r => r.json()).catch(() => null),
            ]);
            const slData = sl?.data ?? sl;
            const bData = b?.data ?? b;
            setCanSuperLike(!!slData?.canUse);
            setSlNext(slData?.nextAvailableAt ?? null);
            setCanBoost(!!bData?.canActivate);
            setBoostNext(bData?.nextAvailableAt ?? null);
        } catch { }
    }

    React.useEffect(() => { refreshLimits(); }, []);
    async function handleSwipe(p: Profile, dir: "left" | "right") {
        const direction = dir === "left" ? "pass" : "like";
        try {
            await fetch(`${API_URL}/api/swipes`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ swiperId: Number(meId), targetId: Number(p.id), direction }),
            });
        } catch {
            // Non-blocking: UI shouldn't hang on network issues
        }
    }

    async function handleSuperLike(p: Profile) {
        try {
            const res = await fetch(`${API_URL}/api/superlike`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ receiverId: Number(p.id) }),
            });
            if (res.ok) {
                await refreshLimits();
            }
        } catch { }
    }

    async function handleBoost() {
        try {
            const res = await fetch(`${API_URL}/api/boost`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({}),
            });
            if (res.ok) {
                await refreshLimits();
            }
        } catch { }
    }

    return (
        <SwipeDeck
            items={items}
            loop={loop}
            onSwipe={handleSwipe}
            onSuperLike={handleSuperLike}
            onBoost={handleBoost}
            canSuperLike={canSuperLike}
            canBoost={canBoost}
            superLikeCooldownText={slNext ? `Available ${new Date(slNext).toLocaleTimeString()}` : undefined}
            boostCooldownText={boostNext ? `Available ${new Date(boostNext).toLocaleTimeString()}` : undefined}
            highlightBoostedIds={boostedIds}
            highlightSuperLikeIds={superLikedByIds}
            onEmpty={() => {
                try { window.dispatchEvent(new CustomEvent("deck:empty")); } catch { }
            }}
            signupGateEnabled={false}
        />
    );
}
