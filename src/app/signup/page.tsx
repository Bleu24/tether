"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/src/_contexts/UserContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const data = {
    title: "Sign Up | Tether",
    description: "Create your Tether account to start discovering matches.",
};

export default function SignUpPage() {
    const router = useRouter();
    const { setUser } = useUser();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [touched, setTouched] = useState<{ email?: boolean; password?: boolean }>({});
    const [submitted, setSubmitted] = useState(false);

    const emailError = (() => {
        if (!email) return "Email is required";
        const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        return ok ? "" : "Enter a valid email";
    })();
    const passwordError = (() => {
        if (!password) return "Password is required";
        if (password.length < 8) return "Use at least 8 characters";
        const mix = /(?=.*[A-Za-z])(?=.*\d)/.test(password);
        return mix ? "" : "Include a letter and a number";
    })();

    const hasErrors = Boolean(emailError || passwordError);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitted(true);
        setTouched({ email: true, password: true });
        if (hasErrors) return;
        // Create user via backend then redirect to setup page
        try {
            const name = email.split("@")[0] || "User";
            const res = await fetch(`${API_URL}/api/users`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });
            if (!res.ok) throw new Error(`Failed to create user (${res.status})`);
            const created = await res.json();
            // Persist basic context (no auth yet)
            setUser({ name: created.name ?? name, email: created.email ?? email });
            // Redirect to profile setup with backend id
            if (created?.id) {
                router.push(`/setup?userId=${created.id}`);
            } else {
                // Fallback to discover if id is missing (shouldn't happen)
                router.push("/setup");
            }
        } catch (err) {
            // Surface a simple error next to the form for now
            // eslint-disable-next-line no-alert
            alert((err as any)?.message ?? String(err));
        }
    }

    return (
        <main className="mx-auto w-full max-w-md px-4 py-16 text-foreground">
            <h1 className="mb-2 text-center text-3xl font-bold">Create your account</h1>
            <p className="mb-8 text-center text-foreground/70">
                We’re keeping it simple while we build the MVP. More options coming soon.
            </p>

            <form className="space-y-4" noValidate onSubmit={onSubmit}>
                <div>
                    <label className="mb-1 block text-sm text-foreground/80" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                        aria-invalid={Boolean((touched.email || submitted) && emailError)}
                        aria-describedby="email-error"
                        placeholder="you@example.com"
                        className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-cyan-400 ${(touched.email || submitted) && emailError ? "border-red-500/70" : "border-white/10"
                            }`}
                    />
                    {(touched.email || submitted) && emailError && (
                        <p id="email-error" className="mt-1 text-xs text-red-400">
                            {emailError}
                        </p>
                    )}
                </div>
                <div>
                    <label className="mb-1 block text-sm text-foreground/80" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                        aria-invalid={Boolean((touched.password || submitted) && passwordError)}
                        aria-describedby="password-error"
                        placeholder="••••••••"
                        className={`w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-foreground/40 focus:border-cyan-400 ${(touched.password || submitted) && passwordError ? "border-red-500/70" : "border-white/10"
                            }`}
                    />
                    {(touched.password || submitted) && passwordError && (
                        <p id="password-error" className="mt-1 text-xs text-red-400">
                            {passwordError}
                        </p>
                    )}
                </div>
                <button
                    type="submit"
                    disabled={hasErrors && submitted}
                    className="w-full rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Continue
                </button>
            </form>

            <p className="mt-6 text-center text-xs text-foreground/60">
                By continuing you agree to our Terms and acknowledge our Privacy Policy.
            </p>
        </main>
    );
}
