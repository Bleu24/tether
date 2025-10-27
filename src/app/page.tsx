import Link from "next/link";
import { Heart, Shield, Sparkles } from "lucide-react";

export const metadata = {
  title: "Tether — Landing",
  description: "Welcome to Tether — find meaningful connections.",
};

export default function LandingPage() {
  return (
    <main className="relative isolate min-h-[80vh] overflow-hidden bg-background py-20">
      {/* Cyan glow background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute left-1/2 top-[-10%] h-[40rem] w-[40rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[140px]" />
        <div className="absolute right-[-10%] bottom-[-10%] h-[28rem] w-[28rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        {/* subtle grid overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:28px_28px] opacity-10" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-6xl">
            Find your person.
            <span className="block bg-gradient-to-r from-cyan-400 via-cyan-300 to-white bg-clip-text text-transparent">
              Date with intent.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Tether helps you meet compatible people nearby with a calm, safety‑first experience.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/date"
              className="btn-primary bg-cyan-500 hover:brightness-110"
            >
              Start Dating
            </Link>

            <Link href="/signup" className="btn-opposite">
              Sign up
            </Link>
          </div>
        </div>

        {/* Highlight card */}
        <div className="mx-auto mt-14 max-w-4xl">
          <div className="relative rounded-xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_10px_40px_-10px_rgba(0,0,0,0.6)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-foreground/90">Acme, 27</div>
                <div className="text-sm text-muted-foreground">Loves vinyl, runs at dawn, coffee snob</div>
              </div>
              <div className="flex items-center gap-2 text-cyan-400">
                <Sparkles className="h-4 w-4" />
                <span className="text-sm">Top match near you</span>
              </div>
            </div>
            <div className="mt-4 h-1.5 w-full rounded-full bg-white/10">
              <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-cyan-400 to-cyan-300" />
            </div>
          </div>
        </div>

        {/* Features */}
        <section className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <Heart className="mb-3 h-5 w-5 text-cyan-300" />
            <h3 className="text-base font-semibold">Real connections</h3>
            <p className="mt-2 text-sm text-muted-foreground">Signals that actually matter, not endless swipes.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <Shield className="mb-3 h-5 w-5 text-cyan-300" />
            <h3 className="text-base font-semibold">Safety first</h3>
            <p className="mt-2 text-sm text-muted-foreground">Built‑in tools to keep your experience safe and respectful.</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-6">
            <Sparkles className="mb-3 h-5 w-5 text-cyan-300" />
            <h3 className="text-base font-semibold">Thoughtful design</h3>
            <p className="mt-2 text-sm text-muted-foreground">A calm, modern UI that gets out of the way.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
