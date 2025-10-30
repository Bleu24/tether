"use client";

import React from "react";

type Props = {
    convos: any[];
};

export default function LeftRailTabs({ convos }: Props) {
    const [tab, setTab] = React.useState<"matches" | "messages">("matches");

    return (
        <div className="mt-6">
            <div role="tablist" aria-label="Matches and Messages" className="flex items-center gap-6">
                <button
                    role="tab"
                    aria-selected={tab === "matches"}
                    className={
                        "pb-1 text-sm font-medium outline-none " +
                        (tab === "matches"
                            ? "border-b-2 border-fuchsia-400"
                            : "text-foreground/70 hover:text-foreground")
                    }
                    onClick={() => setTab("matches")}
                >
                    Matches
                </button>
                <button
                    role="tab"
                    aria-selected={tab === "messages"}
                    className={
                        "pb-1 text-sm font-medium outline-none " +
                        (tab === "messages"
                            ? "border-b-2 border-fuchsia-400"
                            : "text-foreground/70 hover:text-foreground")
                    }
                    onClick={() => setTab("messages")}
                >
                    Messages
                </button>
            </div>

            {tab === "matches" ? (
                <div className="mt-3 grid grid-cols-5 gap-3" role="tabpanel" aria-label="Matches">
                    {convos.slice(0, 10).map((c) => {
                        const initials = (c.otherUser?.name || "?")
                            .split(" ")
                            .map((p: string) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase();
                        return (
                            <div
                                key={c.match.id}
                                className="flex aspect-square items-center justify-center rounded-lg border border-yellow-400/30 bg-yellow-500/20 text-xs font-medium text-white/90"
                            >
                                {initials}
                            </div>
                        );
                    })}
                    {convos.length === 0 && (
                        <div className="col-span-5 text-center text-xs text-foreground/60">
                            No matches yet
                        </div>
                    )}
                </div>
            ) : (
                <ul className="mt-3 space-y-2" role="tabpanel" aria-label="Messages">
                    {convos.map((c) => (
                        <li
                            key={c.match.id}
                            className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
                        >
                            <div>
                                <div className="font-medium">{c.otherUser?.name ?? "Unknown"}</div>
                                <div className="text-foreground/60 truncate max-w-[200px]">
                                    {c.latestMessage?.content ?? "No messages yet"}
                                </div>
                            </div>
                            <span className="text-xs text-foreground/50">
                                {new Date(
                                    c.latestMessage?.created_at ?? c.match.created_at
                                ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </li>
                    ))}
                    {convos.length === 0 && (
                        <li className="text-center text-xs text-foreground/60">No messages</li>
                    )}
                </ul>
            )}
        </div>
    );
}
