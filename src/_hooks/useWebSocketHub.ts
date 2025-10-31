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
  // Build a robust WS URL that works whether NEXT_PUBLIC_API_URL ends with /api or not.
  function buildWsUrl(): string {
    const explicit = (process.env.NEXT_PUBLIC_WS_URL || "").trim();
    if (explicit) return explicit;

    const api = (process.env.NEXT_PUBLIC_API_URL || "").trim();
    if (api) {
      try {
        const u = new URL(api);
        // If API URL path ends with /api, strip it so that we hit /ws at the service root
        u.pathname = u.pathname.replace(/\/?api\/?$/, "");
        // Ensure single trailing / then append ws
        u.pathname = `${u.pathname.replace(/\/$/, "")}/ws`;
        u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
        return u.toString();
      } catch {
        // fallthrough to window origin below
      }
    }

    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.pathname = "/ws";
      u.protocol = u.protocol === "https:" ? "wss:" : "ws:";
      return u.toString();
    }
    return "ws://localhost:4000/ws";
  }

  const WS_URL = buildWsUrl();

  const wsRef = useRef<WebSocket | null>(null);
  const [ready, setReady] = useState(false);
  const [unauthorized, setUnauthorized] = useState(false);
  const listeners = useRef<Set<(msg: HubMessage) => void>>(new Set());

  // Lazy-connect: only open a socket when someone subscribes or registers a listener
  const ensureConnectRef = useRef<(() => void) | null>(null);
  if (!ensureConnectRef.current) {
    ensureConnectRef.current = () => {
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) return;
      let backoff = 1000;
      const connect = () => {
        try {
          const ws = new WebSocket(WS_URL);
          wsRef.current = ws;
          ws.onopen = () => {
            setReady(true);
            backoff = 1000;
          };
          ws.onmessage = (ev) => {
            let msg: HubMessage | null = null;
            try { msg = JSON.parse(String(ev.data)); } catch { /* ignore */ }
            if (!msg) return;
            if ((msg as any)?.event === "unauthorized") setUnauthorized(true);
            listeners.current.forEach((fn) => fn(msg!));
          };
          ws.onclose = () => {
            setReady(false);
            wsRef.current = null;
            // Attempt reconnect if we still have listeners/subscriptions registered
            if (listeners.current.size > 0) setTimeout(connect, Math.min(backoff, 8000));
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
    };
  }

  useEffect(() => {
    return () => {
      try { wsRef.current?.close(); } catch {}
      wsRef.current = null;
    };
  }, []);

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
        ensureConnectRef.current?.();
        listeners.current.add(fn);
        return () => {
          // Ensure cleanup returns void; ignore the boolean from Set.delete
          listeners.current.delete(fn);
        };
      },
      subscribe(matchId: number) {
        ensureConnectRef.current?.();
        send({ type: "subscribe", matchId });
      },
      unsubscribe(matchId: number) {
        ensureConnectRef.current?.();
        send({ type: "unsubscribe", matchId });
      },
      typing(matchId: number) {
        ensureConnectRef.current?.();
        send({ type: "typing", matchId });
      },
    };
  }, [ready, unauthorized]);

  return api;
}
