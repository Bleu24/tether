"use client";

import React, { useEffect, useState } from "react";

export default function DismissibleOffer({ storageKey, children }: { storageKey: string; children: React.ReactNode }) {
    const [dismissed, setDismissed] = useState<boolean>(false);

    useEffect(() => {
        try {
            const v = localStorage.getItem(storageKey);
            setDismissed(v === "1");
        } catch {
            // ignore
        }
    }, [storageKey]);

    const dismiss = () => {
        try {
            localStorage.setItem(storageKey, "1");
        } catch { }
        setDismissed(true);
    };

    if (dismissed) return null;

    return (
        <div>
            {children}
            <button type="button" onClick={dismiss} className="mt-2 block w-full text-center text-[11px] text-foreground/60 hover:text-foreground/80">
                Don’t show this to me again
            </button>
        </div>
    );
}
