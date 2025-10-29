"use client";

import { useRef, useState, useMemo, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Heart, X } from "lucide-react";

export type Profile = {
    id: string | number;
    name: string;
    age?: number; // optional: backend may not provide
    image?: string; // remote or local URL
    bio?: string;
    tags?: string[];
};

type Direction = "left" | "right";

export default function SwipeDeck({
    items,
    loop = true,
    onSwipe,
    signupGateEnabled = false,
    signupGateThreshold = 5,
}: {
    items: Profile[];
    loop?: boolean;
    onSwipe?: (profile: Profile, dir: Direction) => void;
    signupGateEnabled?: boolean;
    signupGateThreshold?: number;
}) {
    const [stack, setStack] = useState<Profile[]>(items);
    const [swipeCount, setSwipeCount] = useState<number>(0);
    const [showSignupModal, setShowSignupModal] = useState<boolean>(false);
    const [zone, setZone] = useState<Direction | null>(null);
    const topRef = useRef<HTMLDivElement | null>(null);
    const deckRef = useRef<HTMLDivElement | null>(null);
    const start = useRef({ x: 0, y: 0, dragging: false });

    // Precompute next cards (for subtle layering)
    const layered = useMemo(() => stack.slice(0, 4), [stack]);

    function setTransform(el: HTMLDivElement, dx: number, dy: number) {
        const rotate = Math.max(-18, Math.min(18, dx / 10));
        el.style.transform = `translate(${dx}px, ${dy}px) rotate(${rotate}deg)`;
    }

    function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
        if (showSignupModal) return;
        const el = e.currentTarget;
        topRef.current = el;
        start.current = { x: e.clientX, y: e.clientY, dragging: true };
        el.setPointerCapture(e.pointerId);
        el.style.transition = "none";
    }

    function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
        if (showSignupModal) return;
        if (!start.current.dragging || !topRef.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        setTransform(topRef.current, dx, dy);

        // Highlight acceptance zones based on card center position
        const deck = deckRef.current;
        if (!deck) return;
        const cardRect = topRef.current.getBoundingClientRect();
        const deckRect = deck.getBoundingClientRect();
        const cardCenterX = cardRect.left + cardRect.width / 2;
        const leftZoneEdge = deckRect.left + deckRect.width * 0.18;
        const rightZoneEdge = deckRect.right - deckRect.width * 0.18;
        if (cardCenterX <= leftZoneEdge) setZone("left");
        else if (cardCenterX >= rightZoneEdge) setZone("right");
        else setZone(null);
    }

    function animateAway(dir: Direction) {
        const el = topRef.current;
        if (!el) return;
        el.style.transition = "transform 300ms ease-out";
        const offX = (dir === "right" ? 1 : -1) * (window.innerWidth * 1.1);
        const current = el.style.transform || "";
        // Ensure rotate matches direction for a nicer feel
        const rotate = dir === "right" ? 18 : -18;
        el.style.transform = `${current} translateX(${offX}px) rotate(${rotate}deg)`;
        const onEnd = () => {
            el.removeEventListener("transitionend", onEnd);
            afterDismiss(dir);
        };
        el.addEventListener("transitionend", onEnd);
    }

    function afterDismiss(dir: Direction) {
        const dismissed = stack[0];
        if (!dismissed) return;
        onSwipe?.(dismissed, dir);
        setStack((prev) => {
            const rest = prev.slice(1);
            if (loop) return [...rest, dismissed];
            return rest;
        });
        // reset top ref styles
        if (topRef.current) {
            topRef.current.style.transition = "none";
            topRef.current.style.transform = "";
        }
        start.current.dragging = false;
        setZone(null);
        // increment swipe counter and trigger signup modal after threshold
        if (signupGateEnabled) {
            setSwipeCount((prev) => {
                const next = prev + 1;
                if (next >= signupGateThreshold) {
                    setShowSignupModal(true);
                }
                return next;
            });
        }
    }

    function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
        if (!topRef.current) return;
        const el = topRef.current;
        const deck = deckRef.current;
        let decided: Direction | null = zone;
        if (!decided && deck) {
            const cardRect = el.getBoundingClientRect();
            const deckRect = deck.getBoundingClientRect();
            const cardCenterX = cardRect.left + cardRect.width / 2;
            const leftZoneEdge = deckRect.left + deckRect.width * 0.18;
            const rightZoneEdge = deckRect.right - deckRect.width * 0.18;
            if (cardCenterX <= leftZoneEdge) decided = "left";
            else if (cardCenterX >= rightZoneEdge) decided = "right";
        }

        if (decided) {
            animateAway(decided);
        } else {
            // snap back
            el.style.transition = "transform 240ms ease-in-out";
            el.style.transform = "translate(0px, 0px) rotate(0deg)";
        }
        start.current.dragging = false;
        setZone(null);
    }

    const top = stack[0];

    return (
        <div className="relative mx-auto w-full max-w-sm select-none">
            {/* Deck */}
            <div ref={deckRef} className="relative aspect-[9/16] w-full">
                {layered.map((p, i) => {
                    const isTop = i === 0;
                    const scale = i === 0 ? 1 : i === 1 ? 0.97 : i === 2 ? 0.94 : 0.91;
                    const translateY = i === 0 ? 0 : i === 1 ? 10 : i === 2 ? 20 : 30;
                    return (
                        <div
                            key={p.id}
                            ref={isTop ? (el) => { topRef.current = el; } : undefined}
                            className="absolute inset-0 origin-center overflow-hidden rounded-2xl border border-white/20 bg-white/5 shadow-2xl shadow-black/50 outline outline-1 -outline-offset-1 outline-white/10"
                            style={{ transform: `translateY(${translateY}px) scale(${scale})`, zIndex: 10 - i }}
                            onPointerDown={isTop ? handlePointerDown : undefined}
                            onPointerMove={isTop ? handlePointerMove : undefined}
                            onPointerUp={isTop ? handlePointerUp : undefined}
                        >
                            {/* Photo background */}
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{
                                    backgroundImage: p.image ? `url(${p.image})` : undefined,
                                    backgroundColor: p.image ? undefined : "#0f172a",
                                }}
                            />

                            {/* Bottom gradient info bar */}
                            <div className="pointer-events-none absolute inset-x-0 bottom-0 p-4">
                                <div className="rounded-xl bg-gradient-to-t from-black/70 via-black/40 to-transparent p-4">
                                    <div className="text-white/95 drop-shadow-sm">
                                        <div className="text-lg font-semibold">
                                            {p.name}
                                            {typeof p.age === "number" ? <span>, {p.age}</span> : null}
                                        </div>
                                        {p.bio && (
                                            <p className="mt-1 line-clamp-2 text-xs text-white/80">{p.bio}</p>
                                        )}
                                        {p.tags && p.tags.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {p.tags.slice(0, 4).map((t) => (
                                                    <span key={t} className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white/85">{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Acceptance zones overlays */}
                <div className="pointer-events-none absolute inset-0">
                    <div
                        className={`absolute inset-y-0 left-0 w-[20%] rounded-l-2xl bg-gradient-to-r from-red-500/15 to-transparent transition-opacity ${start.current.dragging ? "opacity-100" : "opacity-0"} ${zone === "left" ? "!opacity-100" : ""}`}
                    />
                    <div
                        className={`absolute inset-y-0 right-0 w-[20%] rounded-r-2xl bg-gradient-to-l from-cyan-400/20 to-transparent transition-opacity ${start.current.dragging ? "opacity-100" : "opacity-0"} ${zone === "right" ? "!opacity-100" : ""}`}
                    />
                </div>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex justify-center gap-6">
                <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90 transition hover:brightness-110"
                    onClick={() => { if (showSignupModal) return; animateAway("left"); }}
                    aria-label="Pass"
                >
                    <X className="h-5 w-5" />
                </button>
                <button
                    type="button"
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/20 text-cyan-300 transition hover:brightness-110"
                    onClick={() => { if (showSignupModal) return; animateAway("right"); }}
                    aria-label="Like"
                >
                    <Heart className="h-5 w-5" />
                </button>
            </div>

            {/* Signup modal shown after N swipes (portal to avoid stacking issues) */}
            {showSignupModal && (
                <ModalPortal>
                    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                        {/* Solid, top-down modal (not portrait) */}
                        <div className="mx-4 w-full max-w-md rounded-2xl border border-white/15 bg-background p-6 text-foreground shadow-2xl ring-1 ring-white/10">
                            <h3 className="text-xl font-semibold">Enjoying Tether?</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Create an account to keep matching and save your favorites.</p>
                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    className="btn border"
                                    autoFocus
                                    onClick={() => {
                                        setShowSignupModal(false);
                                        setSwipeCount(0);
                                    }}
                                >
                                    Continue
                                </button>
                                <Link href="/signup" className="btn btn-primary">
                                    Sign up
                                </Link>
                            </div>
                        </div>
                    </div>
                </ModalPortal>
            )}
        </div>
    );
}

function ModalPortal({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;
    return createPortal(children, document.body);
}
