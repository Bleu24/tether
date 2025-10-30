"use client";

import React from "react";
import SwipeDeck, { type Profile } from "@/_components/SwipeDeck";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function SwipeDeckWithActions({ items, meId, loop = false }: { items: Profile[]; meId: number; loop?: boolean }) {
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

    return <SwipeDeck items={items} loop={loop} onSwipe={handleSwipe} signupGateEnabled={false} />;
}
