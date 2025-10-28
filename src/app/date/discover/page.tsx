"use client";

import Link from "next/link";
import { useEffect } from "react";
import SwipeDeck, { type Profile } from "@/src/_components/SwipeDeck";
import { useUser } from "@/src/_contexts/UserContext";

const demoProfiles: Profile[] = [
    { id: 1, name: "Lia", age: 20, image: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=1200&auto=format&fit=crop", bio: "Coffee • Travel • Art", tags: ["Coffee", "Travel", "Art"] },
    { id: 2, name: "Remy", age: 27, image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop", bio: "Runner, reader, ramen enjoyer", tags: ["Running", "Books", "Food"] },
    { id: 3, name: "Kai", age: 31, image: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?q=80&w=1200&auto=format&fit=crop", bio: "Mountains > beaches", tags: ["Outdoors", "Climbing", "Dogs"] },
    { id: 4, name: "Aria", age: 26, image: "https://images.unsplash.com/photo-1531251445707-1f000e1e87d0?q=80&w=1200&auto=format&fit=crop", bio: "Plants and pasta", tags: ["Cooking", "Plants", "Tech"] },
];

export default function DateDiscoverPage() {
    const { user } = useUser();

    useEffect(() => {
        // In a real app you'd verify auth and possibly redirect to /signup
        // Keeping non-disruptive for now.
    }, [user]);

    //   if (!user) {
    //     return (
    //       <main className="mx-auto w-full max-w-7xl px-4 py-10 text-foreground">
    //         <div className="mx-auto max-w-lg text-center">
    //           <h1 className="text-2xl font-semibold">Sign in to continue</h1>
    //           <p className="mt-2 text-sm text-muted-foreground">You need an account to see your matches, messages, and start swiping.</p>
    //           <div className="mt-6 flex justify-center gap-3">
    //             <Link href="/signup" className="btn btn-primary">Sign up</Link>
    //             <Link href="/date" className="btn border">Back</Link>
    //           </div>
    //         </div>
    //       </main>
    //     );
    //   }

    return (
        <main className="mx-auto w-full max-w-7xl px-4 py-8 text-foreground">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-[320px_minmax(0,1fr)]">
                {/* Left rail: Matches & Messages */}
                <aside className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div>
                        <h2 className="text-sm font-medium text-foreground/80">Matches</h2>
                        <div className="mt-3 grid grid-cols-5 gap-3">
                            {["AN", "RM", "KY", "AR", "LS"].map((i) => (
                                <div key={i} className="flex aspect-square items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-medium text-white/90">
                                    {i}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        <h2 className="text-sm font-medium text-foreground/80">Messages</h2>
                        <ul className="mt-3 space-y-2">
                            {[1, 2, 3, 4].map((n) => (
                                <li key={n} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                                    <div>
                                        <div className="font-medium">Alex {n}</div>
                                        <div className="text-foreground/60">Hey there 👋</div>
                                    </div>
                                    <span className="text-xs text-foreground/50">2m</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Right: Deck + controls */}
                <section>
                    <div className="mx-auto max-w-md">
                        <SwipeDeck items={demoProfiles} />
                    </div>
                    <p className="mt-3 text-center text-xs text-foreground/60">Drag cards or use the buttons to pass or like.</p>
                </section>
            </div>
        </main>
    );
}
