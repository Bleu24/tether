"use client";

import React, { useEffect, useState } from "react";
import { VISIBLE_TAGS_COLLAPSED } from "@/lib/interests";

export type PreviewUser = {
    id: number;
    name: string;
    age?: number | null;
    bio?: string | null;
    photos?: string[] | null;
    tags?: string[] | null; // interests and quick badges
};

export default function ProfilePreview({ user }: { user: PreviewUser }) {
    const images = Array.isArray(user.photos) ? user.photos : [];
    const [idx, setIdx] = useState(0);
    const [detailsOpen, setDetailsOpen] = useState(false);
    useEffect(() => setIdx(0), [user?.id]);

    const current = images.length ? images[idx] : undefined;

    return (
        <div className="relative mx-auto w-full max-w-sm select-none">
            {/* Card */}
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-2xl shadow-black/50 outline outline-1 -outline-offset-1 outline-white/10">
                {/* Steps */}
                {images.length > 1 && (
                    <div className="absolute inset-x-3 top-3 z-10 flex gap-1">
                        {images.map((_, i) => (
                            <div key={i} className={`h-1 flex-1 rounded-full ${i <= idx ? "bg-white/90" : "bg-white/30"}`} />
                        ))}
                    </div>
                )}
                {/* Background */}
                <button
                    type="button"
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: current ? `url(${current})` : undefined, backgroundColor: current ? undefined : "#0f172a" }}
                    onClick={() => setIdx((i) => (images.length ? (i + 1) % images.length : 0))}
                    aria-label="Next photo"
                />

                {/* Bottom gradient info bar (click to expand details, same behavior as SwipeDeck) */}
                <div
                    className="absolute inset-x-0 bottom-0 cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); setDetailsOpen((v) => !v); }}
                >
                    <div className={`rounded-b-2xl bg-gradient-to-t from-black/80 via-black/50 to-transparent px-4 ${detailsOpen ? "pt-20" : "pt-10"} pb-5`}>
                        <div className="text-white/95 drop-shadow-sm">
                            <div className="text-lg font-semibold">
                                {user.name}
                                {typeof user.age === "number" ? <span>, {user.age}</span> : null}
                            </div>
                            {user.bio && (
                                detailsOpen ? (
                                    <div className="mt-2 max-h-40 overflow-y-auto pr-1 text-xs text-white/85">
                                        {user.bio}
                                    </div>
                                ) : (
                                    <p className="mt-1 line-clamp-2 text-xs text-white/85">{user.bio}</p>
                                )
                            )}
                            {Array.isArray(user.tags) && user.tags.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {(detailsOpen ? user.tags : user.tags.slice(0, VISIBLE_TAGS_COLLAPSED)).map((t) => (
                                        <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/90">{t}</span>
                                    ))}
                                </div>
                            )}
                            <div className="mt-2 text-[10px] text-white/70">
                                {detailsOpen ? "Tap to collapse details" : "Tap to view more"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p className="mt-3 text-center text-xs text-foreground/60">Tap the card to view next photo. Tap the bottom section to expand details.</p>
        </div>
    );
}
