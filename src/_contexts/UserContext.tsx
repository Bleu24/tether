"use client";

import React, { createContext, useState, useContext } from "react";

type User = {
    id?: number;
    name: string;
    email?: string;
    photo?: string | null;
    setupComplete?: boolean;
};

type UserContext = {
    user: User | null;
    setUser: (user: User | null) => void;
};

const UserContext = createContext<UserContext | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);

    return (
        <UserContext.Provider value={{ user, setUser }}>
            {children}
        </UserContext.Provider>
    )
}

export function useUser() {
    const context = useContext(UserContext);
    if (!context) throw new Error("useUser must be used within a UserProvider");
    return context;
}