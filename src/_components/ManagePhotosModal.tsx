"use client";

import React, { useRef, useState } from "react";
import Modal from "./Modal";
import { Plus, X } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type Props = {
    open: boolean;
    onClose: () => void;
    userId: number;
    initialPhotos: string[];
};

export default function ManagePhotosModal({ open, onClose, userId, initialPhotos }: Props) {
    const [photos, setPhotos] = useState<string[]>(initialPhotos || []);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function removeAt(i: number) {
        setPhotos((p) => p.filter((_, idx) => idx !== i));
    }

    async function onFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        const fd = new FormData();
        Array.from(files).slice(0, 9 - photos.length).forEach((f) => fd.append("files", f));
        try {
            setUploading(true);
            const res = await fetch(`${API_URL}/api/uploads`, { method: "POST", credentials: "include", body: fd });
            const j = await res.json().catch(() => ({}));
            const urls: string[] = j.urls || [];
            const next = [...photos, ...urls].slice(0, 9);
            setPhotos(next);
        } finally {
            setUploading(false);
        }
    }

    async function save() {
        const res = await fetch(`${API_URL}/api/users/${userId}`, {
            method: "PUT",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photos }),
        });
        if (res.ok) {
            onClose();
            if (typeof window !== "undefined") window.location.reload();
        }
    }

    const grid = Array.from({ length: 9 });

    return (
        <Modal open={open} onClose={onClose} title="Manage Photos" widthClassName="max-w-3xl">
            <div className="grid grid-cols-3 gap-3">
                {grid.map((_, i) => {
                    const src = photos[i];
                    return (
                        <div key={i} className="relative aspect-square overflow-hidden rounded-lg border border-white/15 bg-white/5">
                            {src ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={src} alt="photo" className="h-full w-full object-cover" />
                                    <button
                                        aria-label="Remove"
                                        className="absolute right-1 top-1 rounded-full border border-white/20 bg-black/50 p-1 text-white/90 hover:bg-black/70"
                                        onClick={() => removeAt(i)}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-white/20 text-foreground/70 hover:bg-white/5"
                                >
                                    <Plus className="h-6 w-6" />
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>

            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />

            <div className="mt-4 flex items-center justify-between text-xs text-foreground/60">
                <div>Up to 9 photos. {uploading ? "Uploading…" : "Click a + tile to add."}</div>
                <div className="flex gap-3">
                    <button className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10" onClick={onClose}>Close</button>
                    <button className="rounded-md border border-cyan-400/40 bg-cyan-500/20 px-3 py-2 text-sm font-medium text-cyan-200 hover:brightness-110" onClick={save}>Save</button>
                </div>
            </div>
        </Modal>
    );
}
