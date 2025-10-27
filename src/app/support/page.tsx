export const metadata = {
    title: "Support | Tether",
    description: "Help center and frequently asked questions for Tether.",
};

const faqs = [
    {
        q: "How do matches work?",
        a: "We combine your preferences with in-app signals to recommend profiles. When both people like each other, it's a match and you can start chatting.",
    },
    {
        q: "Can I change my theme?",
        a: "Yes. Use the theme toggle in the top-right to switch between System, Dark, and Light. Your choice is saved and follows you across the app.",
    },
    {
        q: "How do I report a profile?",
        a: "Open the profile, tap the more menu, and select Report. Provide details so we can take action quickly. Your safety is our priority.",
    },
    {
        q: "What data do you collect?",
        a: "We collect essential data to operate the app and improve recommendations. See our Privacy Policy for details on what we store and how we protect it.",
    },
    {
        q: "How can I contact support?",
        a: "Email us any time at support@tether.app. We're a small team but we aim to respond within 1–2 business days.",
    },
];

export default function SupportPage() {
    return (
        <main className="relative mx-auto w-full max-w-4xl px-4 py-16 text-foreground">
            {/* Soft cyan glow */}
            <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/3 top-10 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />
            </div>

            <header className="mb-10 text-center">
                <h1 className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500 bg-clip-text text-4xl font-bold text-transparent sm:text-5xl">
                    Support
                </h1>
                <p className="mx-auto mt-3 max-w-2xl text-base text-foreground/70">
                    Find quick answers to common questions. Still need help? Reach out and we’ll be in touch.
                </p>
            </header>

            <section className="space-y-3">
                {faqs.map(({ q, a }, i) => (
                    <details
                        key={i}
                        className="group rounded-lg border border-white/10 bg-[color:var(--surface,rgba(255,255,255,0.02))] p-4 backdrop-blur-sm open:bg-[color:var(--surface,rgba(255,255,255,0.04))]"
                    >
                        <summary className="cursor-pointer select-none list-none font-medium outline-none transition hover:text-foreground">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-foreground/90">{q}</span>
                                <span className="text-foreground/50 transition group-open:rotate-45">+</span>
                            </div>
                        </summary>
                        <div className="mt-3 text-sm leading-relaxed text-foreground/70">{a}</div>
                    </details>
                ))}
            </section>

            <footer className="mt-10 rounded-lg border border-white/10 bg-[color:var(--surface,rgba(255,255,255,0.02))] p-4 text-sm text-foreground/70">
                Can’t find what you’re looking for? Email us at
                <a className="ml-1 text-cyan-400 hover:underline" href="mailto:support@tether.app">
                    support@tether.app
                </a>
            </footer>
        </main>
    );
}
