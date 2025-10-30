"use client";

import React, { useEffect } from "react";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    widthClassName?: string; // e.g., max-w-lg
};

export default function Modal({ open, onClose, title, children, widthClassName = "max-w-lg" }: ModalProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
    }, [open, onClose]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative mx-4 w-full ${widthClassName} rounded-2xl border border-white/15 bg-background p-5 text-foreground shadow-2xl ring-1 ring-white/10`}>
                {title && <h3 className="text-lg font-semibold">{title}</h3>}
                <button
                    aria-label="Close"
                    onClick={onClose}
                    className="absolute right-3 top-3 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-foreground/70 hover:bg-white/10"
                >
                    Esc
                </button>
                <div className="mt-3">{children}</div>
            </div>
        </div>
    );
}
