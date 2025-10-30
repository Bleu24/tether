"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/_contexts/UserContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LogoutButton() {
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/auth/logout`, { method: "POST", credentials: "include" });
    } catch {
      // ignore network errors, still clear client state
    } finally {
      setUser(null);
      // Navigate to signup (or home) after logout
      router.push("/signup");
      router.refresh();
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onLogout}
      className="mt-2 w-full rounded-md border border-red-500/40 bg-red-600 text-white hover:bg-red-600/90 px-3 py-2 text-sm font-medium disabled:opacity-70 disabled:cursor-not-allowed"
      disabled={loading}
      aria-label="Log out"
    >
      {loading ? "Logging out…" : "Log out"}
    </button>
  );
}
