"use client";

import React from "react";

type Props = {
    superLike: { remaining?: number | null; next?: string | null };
    boost: { remaining?: number | null; next?: string | null; activeUntil?: string | null };
};

function formatCountdown(targetIso?: string | null): string | null {
    if (!targetIso) return null;
    const target = new Date(targetIso).getTime();
    const diff = target - Date.now();
    if (diff <= 0) return "00:00:00";
    const totalS = Math.floor(diff / 1000);
    const h = Math.floor(totalS / 3600);
    const m = Math.floor((totalS % 3600) / 60);
    const s = totalS % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function ResourceCounters({ superLike, boost }: Props) {
    const targetBoost = boost.activeUntil ?? boost.next ?? null;
    const [slText, setSlText] = React.useState<string | null>(formatCountdown(superLike.next));
    const [bText, setBText] = React.useState<string | null>(formatCountdown(targetBoost));

    React.useEffect(() => {
        setSlText(formatCountdown(superLike.next));
        setBText(formatCountdown(boost.activeUntil ?? boost.next ?? null));
    }, [superLike.next, boost.next, boost.activeUntil]);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setSlText(formatCountdown(superLike.next));
            setBText(formatCountdown(boost.activeUntil ?? boost.next ?? null));
        }, 1000);
        return () => clearInterval(timer);
    }, [superLike.next, boost.next, boost.activeUntil]);

    function renderCount(v?: number | null): string {
        if (v === null) return "∞";
        if (typeof v === "number") return String(v);
        return "-";
    }

    const showSuperLikeTimer = Boolean(superLike.next) && (superLike.remaining === 0);
    const showBoostTimer = Boolean(boost.activeUntil) || (Boolean(boost.next) && (boost.remaining === 0 || boost.remaining === null));

    return (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold">Resources</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-xs text-foreground/60">Super Likes</div>
                    <div className="text-base font-semibold">{renderCount(superLike.remaining)}</div>
                    {showSuperLikeTimer && (
                        <div className="text-[11px] text-foreground/60">{slText}</div>
                    )}
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-xs text-foreground/60">Boosts</div>
                    <div className="text-base font-semibold">{renderCount(boost.remaining)}</div>
                    {showBoostTimer && (
                        <div className="text-[11px] text-foreground/60">{bText}</div>
                    )}
                </div>
            </div>
        </section>
    );
}
