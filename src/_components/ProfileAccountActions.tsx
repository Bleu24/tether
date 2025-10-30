"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import EditProfileModal from "./EditProfileModal";
import ManagePhotosModal from "./ManagePhotosModal";
import DeleteAccountModal from "./DeleteAccountModal";

type Props = {
    user: {
        id: number;
        name?: string;
        birthdate?: string | null;
        gender?: string | null;
        location?: string | null;
        bio?: string | null;
        photos?: string[];
    };
};

export default function ProfileAccountActions({ user }: Props) {
    const [openEdit, setOpenEdit] = useState(false);
    const [openPhotos, setOpenPhotos] = useState(false);
    const [openDelete, setOpenDelete] = useState(false);

    return (
        <>
            <section className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h2 className="text-sm font-semibold">Account</h2>
                <div className="mt-3 space-y-2 text-sm">
                    <button
                        className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
                        onClick={() => setOpenEdit(true)}
                    >
                        <span>Edit Profile</span>
                        <Check className="h-4 w-4 text-emerald-400" />
                    </button>
                    <button
                        className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
                        onClick={() => setOpenPhotos(true)}
                    >
                        <span>Manage Photos</span>
                    </button>
                    <button
                        className="flex w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 hover:bg-white/10"
                        onClick={() => setOpenDelete(true)}
                    >
                        <span>Delete Account</span>
                    </button>
                </div>
            </section>

            {/* Modals */}
            <EditProfileModal
                open={openEdit}
                onClose={() => setOpenEdit(false)}
                userId={user.id}
                initial={{
                    name: user.name,
                    birthdate: user.birthdate || undefined,
                    gender: user.gender || undefined,
                    location: user.location || undefined,
                    bio: user.bio || undefined,
                }}
            />
            <ManagePhotosModal open={openPhotos} onClose={() => setOpenPhotos(false)} userId={user.id} initialPhotos={user.photos || []} />
            <DeleteAccountModal open={openDelete} onClose={() => setOpenDelete(false)} userId={user.id} />
        </>
    );
}
