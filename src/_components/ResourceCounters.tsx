"use client";

import React from "react";

type Props = {
    superLike: { remaining?: number | null; next?: string | null };
    boost: { remaining?: number | null; next?: string | null };
};

function formatCountdown(targetIso?: string | null): string | null {
    if (!targetIso) return null;
    const target = new Date(targetIso).getTime();
    const diff = target - Date.now();
    if (diff <= 0) return "Available";
    const s = Math.floor(diff / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
}

export default function ResourceCounters({ superLike, boost }: Props) {
    const [slText, setSlText] = React.useState<string | null>(formatCountdown(superLike.next));
    const [bText, setBText] = React.useState<string | null>(formatCountdown(boost.next));

    React.useEffect(() => {
        setSlText(formatCountdown(superLike.next));
        setBText(formatCountdown(boost.next));
    }, [superLike.next, boost.next]);

    React.useEffect(() => {
        const timer = setInterval(() => {
            setSlText(formatCountdown(superLike.next));
            setBText(formatCountdown(boost.next));
        }, 1000);
        return () => clearInterval(timer);
    }, [superLike.next, boost.next]);

    function renderCount(v?: number | null): string {
        if (v === null) return "∞";
        if (typeof v === "number") return String(v);
        return "-";
    }

    return (
        <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-sm font-semibold">Resources</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-xs text-foreground/60">Super Likes</div>
                    <div className="text-base font-semibold">{renderCount(superLike.remaining)}</div>
                    {superLike.next && (
                        <div className="text-[11px] text-foreground/60">{slText}</div>
                    )}
                </div>
                <div className="rounded-md border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-xs text-foreground/60">Boosts</div>
                    <div className="text-base font-semibold">{renderCount(boost.remaining)}</div>
                    {boost.next && (
                        <div className="text-[11px] text-foreground/60">{bText}</div>
                    )}
                </div>
            </div>
        </section>
    );
}
