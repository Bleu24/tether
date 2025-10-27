import Link from "next/link";
import { Heart, Sparkles, Compass, Shield } from "lucide-react";

export const metadata = {
    title: "About | Tether",
    description: "Learn about Tether's mission, features, and the team behind the app.",
};

export default function AboutPage() {
    return (
        <main className="relative mx-auto w-full max-w-6xl px-4 py-16 text-foreground">
            {/* Cyan glow accents */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute bottom-0 right-10 h-48 w-48 rounded-full bg-cyan-400/10 blur-2xl" />
            </div>

            <section className="mb-14 text-center">
                <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                    About Tether
                </h1>
                <p className="mx-auto mt-4 max-w-2xl text-base text-foreground/70">
                    Tether is a modern dating experience focused on meaningful connections. We blend
                    intuitive design with thoughtful matching to help you find people you genuinely click with.
                </p>
            </section>

            <section className="mb-16 grid gap-6 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-[color:var(--surface,rgba(255,255,255,0.02))] p-6 backdrop-blur-md">
                    <h2 className="mb-2 text-xl font-semibold">Our Mission</h2>
                    <p className="text-foreground/70">
                        We believe dating should feel authentic, safe, and serendipitous. Our mission is to
                        help people build real connections—guided by smart recommendations and respectful
                        product choices.
                    </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-[color:var(--surface,rgba(255,255,255,0.02))] p-6 backdrop-blur-md">
                    <h2 className="mb-2 text-xl font-semibold">How Tether Works</h2>
                    <p className="text-foreground/70">
                        Using preferences and in-app signals, we surface potential matches that feel natural
                        to explore—no pressure, just good vibes and great people.
                    </p>
                </div>
            </section>

            <section className="mb-16">
                <h3 className="mb-4 text-lg font-semibold text-foreground/90">Features</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <FeatureCard
                        icon={<Heart className="h-5 w-5 text-cyan-300" />}
                        title="Thoughtful Matching"
                        text="Signal-aware recommendations beyond simple swipes."
                    />
                    <FeatureCard
                        icon={<Compass className="h-5 w-5 text-cyan-300" />}
                        title="Discovery Deck"
                        text="A smooth, swipe-friendly way to get to know people."
                    />
                    <FeatureCard
                        icon={<Shield className="h-5 w-5 text-cyan-300" />}
                        title="Safety First"
                        text="Controls and guardrails that put your comfort first."
                    />
                    <FeatureCard
                        icon={<Sparkles className="h-5 w-5 text-cyan-300" />}
                        title="Clean Design"
                        text="A calm, dark UI with cyan accents that feels modern."
                    />
                </div>
            </section>

            <section className="mb-20">
                <h3 className="mb-4 text-lg font-semibold text-foreground/90">The Team</h3>
                <p className="mb-6 text-foreground/70">
                    We’re a small team of builders who care about product quality and human connection.
                </p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <TeamCard name="Alex Rivera" role="Product & Design" initials="AR" />
                    <TeamCard name="Sam Chen" role="Engineering" initials="SC" />
                    <TeamCard name="Jordan West" role="Data & Matching" initials="JW" />
                </div>
            </section>

            <div className="flex items-center justify-center gap-3">
                <Link href="/date" className="rounded-md bg-cyan-500 px-4 py-2 text-sm font-medium text-black transition hover:bg-cyan-400">
                    Try the Deck
                </Link>
                <Link href="/signup" className="btn-opposite text-sm">
                    Sign Up
                </Link>
            </div>
        </main>
    );
}

function FeatureCard({
    icon,
    title,
    text,
}: {
    icon: React.ReactNode;
    title: string;
    text: string;
}) {
    return (
        <div className="rounded-xl border border-white/10 bg-[color:var(--surface,rgba(255,255,255,0.02))] p-5 backdrop-blur-sm">
            <div className="mb-3 inline-flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/10">
                    {icon}
                </span>
                <span className="text-sm font-semibold">{title}</span>
            </div>
            <p className="text-sm text-foreground/70">{text}</p>
        </div>
    );
}

function TeamCard({ name, role, initials }: { name: string; role: string; initials: string }) {
    return (
        <div className="flex items-center gap-4 rounded-xl border border-white/10 bg-[color:var(--surface,rgba(255,255,255,0.02))] p-5 backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/15 text-sm font-semibold text-cyan-200">
                {initials}
            </div>
            <div>
                <div className="text-sm font-semibold">{name}</div>
                <div className="text-xs text-foreground/60">{role}</div>
            </div>
        </div>
    );
}
