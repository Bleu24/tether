"use client";

import React from "react";
import { useRouter } from "next/navigation";

type Message = {
    id: number;
    match_id: number;
    sender_id: number;
    content: string | null;
    created_at: string;
};

export default function ChatPanel({ matchId, meId, convos = [] }: { matchId: number; meId: number; convos?: any[] }) {
    const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/\/$/, "");
    const router = useRouter();
    const [messages, setMessages] = React.useState<Message[]>([]);
    const [input, setInput] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [typingUserId, setTypingUserId] = React.useState<number | null>(null);

    // Derive other user's name/photo from convos if available
    const other = React.useMemo(() => {
        const c = Array.isArray(convos) ? convos.find((x: any) => x?.match?.id === matchId) : null;
        return c?.otherUser || null;
    }, [convos, matchId]);
    // persist other user so avatar/name don't flicker on refresh
    const [otherPersist, setOtherPersist] = React.useState<any | null>(null);
    React.useEffect(() => {
        if (other && otherPersist == null) setOtherPersist(other);
        if (other && otherPersist && otherPersist.id !== other.id) setOtherPersist(other);
        // do not clear when other becomes null; keep previous
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [other]);
    const showOther = other || otherPersist;
    const otherDeleted = !!(showOther as any)?.is_deleted;

    const fetchMessages = React.useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/api/matches/${matchId}/messages?userId=${meId}`, {
                credentials: "include",
                cache: "no-store",
            });
            if (!res.ok) return;
            const j = await res.json().catch(() => null);
            const list = (j?.data ?? j ?? []) as Message[];
            setMessages(Array.isArray(list) ? list : []);
        } catch {
            // noop
        }
    }, [API_URL, matchId, meId]);

    React.useEffect(() => { fetchMessages(); }, [fetchMessages]);

    // WebSocket realtime: subscribe to match room and listen for new messages and typing events
    const wsRef = React.useRef<WebSocket | null>(null);
    React.useEffect(() => {
        const urlBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000").replace(/^http/, "ws");
        const ws = new WebSocket(`${urlBase}/ws?userId=${meId}`);
        wsRef.current = ws;
        ws.onopen = () => {
            try { ws.send(JSON.stringify({ type: "subscribe", matchId })); } catch { }
        };
        ws.onmessage = (ev) => {
            try {
                const { event, data } = JSON.parse(ev.data);
                if (event === "message:created" && data?.message?.match_id === matchId) {
                    setMessages((prev) => [...prev, data.message]);
                } else if (event === "message:typing" && data?.matchId === matchId) {
                    const uid = data?.userId as number;
                    if (uid && uid !== meId) {
                        setTypingUserId(uid);
                        // hide after 2 seconds of inactivity
                        const t = setTimeout(() => setTypingUserId(null), 2000);
                        return () => clearTimeout(t);
                    }
                }
            } catch { /* ignore */ }
        };
        return () => { try { ws.close(); } catch { } };
    }, [matchId, meId]);

    // Throttled typing signal
    const typingRef = React.useRef<number>(0);
    function notifyTyping() {
        const now = Date.now();
        if (now - typingRef.current < 1200) return;
        typingRef.current = now;
        try {
            wsRef.current?.send(JSON.stringify({ type: "typing", matchId }));
        } catch { }
    }

    async function send() {
        const content = input.trim();
        if (!content) return;
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/api/matches/${matchId}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ senderId: meId, content }),
            });
            if (!res.ok) throw new Error("Send failed");
            setInput("");
            await fetchMessages();
            // Refresh to move this match into the Messages tab in the left rail
            try { router.refresh(); } catch { }
        } catch {
            // consider toast
        } finally {
            setLoading(false);
        }
    }

    function goBackToDeck() {
        const url = new URL(window.location.href);
        url.searchParams.delete("matchId");
        router.push(url.toString());
    }

    return (
        <div className="flex h-full w-full flex-col">
            <div className="mb-2 flex items-center justify-between text-sm text-foreground/70">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 overflow-hidden rounded-full border border-white/10 bg-white/10">
                        {Array.isArray(showOther?.photos) && (showOther as any)?.photos?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={(showOther as any).photos[0]} alt={(showOther as any)?.name ?? "User"} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-foreground/70">
                                {((showOther as any)?.name ?? "?").slice(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                    <div className="font-medium">{(showOther as any)?.name ?? `Match #${matchId}`}</div>
                </div>
                <button
                    className="rounded-md border border-white/10 bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                    onClick={goBackToDeck}
                >
                    ← Back to deck
                </button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3">
                {otherDeleted && (
                    <div className="mb-2 rounded-md border border-amber-400/40 bg-amber-500/20 p-2 text-xs text-amber-100">
                        This user has deleted their account. You can read past messages, but chatting is disabled until they return.
                    </div>
                )}
                {messages.length === 0 ? (
                    <div className="py-10 text-center">
                        <div className="text-sm font-medium">{(showOther as any)?.name ?? `Match #${matchId}`}</div>
                        {!otherDeleted && (
                            <div className="mt-2 text-sm text-foreground/60">Say hi to start the conversation.</div>
                        )}
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {messages.map((m) => (
                            <li key={m.id} className={`flex ${m.sender_id === meId ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${m.sender_id === meId ? "bg-fuchsia-500 text-black" : "bg-white/10 text-white"}`}>
                                    {m.content}
                                    <div className="mt-1 text-[10px] opacity-75">
                                        {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                {typingUserId && (
                    <div className="mt-2 text-xs text-foreground/60">{other?.name ?? "They"} is typing…</div>
                )}
            </div>
            <div className="mt-3 flex items-center gap-2">
                <input
                    value={input}
                    onChange={(e) => { setInput(e.target.value); notifyTyping(); }}
                    placeholder={otherDeleted ? "Chat disabled – user deleted" : "Type a message"}
                    disabled={otherDeleted}
                    className="flex-1 rounded-md border border-white/10 bg-white/80 px-3 py-2 text-sm text-black placeholder:text-black/60 focus:outline-none disabled:opacity-60"
                />
                <button
                    onClick={send}
                    disabled={loading || otherDeleted}
                    className="rounded-md bg-fuchsia-500 px-3 py-2 text-sm font-semibold text-black hover:brightness-105 disabled:opacity-60"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
