"use client";

import SwipeDeck, { type Profile } from "@/_components/SwipeDeck";
import { useUser } from "@/_contexts/UserContext";

// export const metadata = {
//     title: "Tether — Date",
//     description: "Discover matches and plan great dates.",
// };

const demoProfiles: Profile[] = [
    {
        id: 1,
        name: "Tiana",
        age: 30,
        image: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop",
        bio: "Music lover • morning runner • coffee snob",
        tags: ["Music", "Running", "Coffee"],
    },
    {
        id: 2,
        name: "Sam",
        age: 28,
        image: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop",
        bio: "Learning pottery and backpacking on weekends",
        tags: ["Outdoors", "Art", "Dogs"],
    },
    {
        id: 3,
        name: "Aria",
        age: 27,
        image: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=1200&auto=format&fit=crop",
        bio: "Plant parent and amateur chef",
        tags: ["Cooking", "Plants", "Tech"],
    },
    {
        id: 4,
        name: "Kai",
        age: 31,
        image: "https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=1200&auto=format&fit=crop",
        bio: "Climber, reader, sometimes painter",
        tags: ["Climbing", "Books", "Art"],
    },
];

export default function DatePage() {
    const { user } = useUser();
    const signupGateEnabled = !user; // gate only when not logged in
    return (
        <main className="min-h-[80vh] bg-background py-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-sm text-center">
                    <h1 className="text-2xl font-semibold">Discover</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Swipe left to pass, right to like.</p>
                </div>

                <div className="mt-8 flex justify-center">
                    <SwipeDeck items={demoProfiles} signupGateEnabled={signupGateEnabled} signupGateThreshold={5} />
                </div>
            </div>
        </main>
    );
}
