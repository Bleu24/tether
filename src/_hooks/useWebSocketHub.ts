"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type HubMessage =
  | { event: "unauthorized" }
  | { event: "subscribed"; data: { matchId: number } }
  | { event: "unsubscribed"; data: { matchId: number } }
  | { event: string; data?: any };

/**
 * useWebSocketHub
 * - Cookie-based WS auth (backend reads auth_token cookie)
 * - Auto reconnect with simple backoff
 * - Subscribe/unsubscribe/typing helpers
 */
export function useWebSocketHub() {
  const WS_URL =
    process.env.NEXT_PUBLIC_WS_URL ||
    `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/^http/, "ws")}/ws`;

  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const listeners = useRef<Set<(msg: HubMessage) => void>>(new Set());

  useEffect(() => {
    let cancelled = false;
    let backoff = 1000;

    const connect = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;
        ws.onopen = () => {
          if (cancelled) return;
          setReady(true);
          backoff = 1000;
        };
        ws.onmessage = (ev) => {
          if (cancelled) return;
          let msg: HubMessage | null = null;
          try { msg = JSON.parse(String(ev.data)); } catch { /* ignore */ }
          if (!msg) return;
          if ((msg as any)?.event === "unauthorized") setUnauthorized(true);
          listeners.current.forEach((fn) => fn(msg!));
        };
        ws.onclose = () => {
          if (cancelled) return;
          setReady(false);
          wsRef.current = null;
          setTimeout(connect, Math.min(backoff, 8000));
          backoff *= 2;
        };
        ws.onerror = () => {
          ws.close();
        };
      } catch {
        setTimeout(connect, Math.min(backoff, 8000));
        backoff *= 2;
      }
    };

    connect();
    return () => {
      cancelled = true;
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, [WS_URL]);

  const api = useMemo(() => {
    function send(payload: any) {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
      }
    }
    return {
      ready,
      unauthorized,
      onMessage(fn: (msg: HubMessage) => void) {
        listeners.current.add(fn);
        return () => listeners.current.delete(fn);
      },
      subscribe(matchId: number) {
        send({ type: "subscribe", matchId });
      },
      unsubscribe(matchId: number) {
        send({ type: "unsubscribe", matchId });
      },
      typing(matchId: number) {
        send({ type: "typing", matchId });
      },
    };
  }, [ready, unauthorized]);

  return api;
}
