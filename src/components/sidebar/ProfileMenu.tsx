"use client";
import React, { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

type ProfileMenuProps = {
    expanded: boolean;
    profileLink?: string;
    settingsLink?: string;
};

/**
 * ProfileMenu - User profile dropdown menu in sidebar
 * Shows user info, profile link, settings, and logout button
 */
export default function ProfileMenu({ expanded, profileLink = "/profile", settingsLink = "/ayarlar" }: ProfileMenuProps) {
    const [open, setOpen] = useState(false);
    const { data: session } = useSession();
    const [userName, setUserName] = useState<string>("Kullanıcı");
    const [userInfo, setUserInfo] = useState<{ unitLabel?: string; roleName?: string } | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    setUserName(data.username || session?.user?.name || "Kullanıcı");
                    setUserInfo({ unitLabel: data.unitLabel, roleName: data.roleName });
                }
            } catch {
                setUserName(session?.user?.name || "Kullanıcı");
            }
        }
        loadProfile();
    }, [session]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [open]);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setOpen(!open)}
                className={`
                    w-full flex items-center gap-3 
                    rounded-xl 
                    bg-slate-800 hover:bg-slate-700
                    border border-slate-700
                    transition-all duration-200
                    ${expanded ? "px-3 py-2.5" : "px-2 py-2.5 justify-center"}
                `}
            >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg shadow-emerald-500/20">
                    {userName.charAt(0).toUpperCase()}
                </div>
                {expanded && (
                    <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-semibold text-white truncate">{userName}</div>
                        <div className="text-xs text-slate-400 truncate">
                            {userInfo?.unitLabel || userInfo?.roleName || "Kullanıcı"}
                        </div>
                    </div>
                )}
                {expanded && (
                    <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                )}
            </button>

            {open && (
                <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-slate-700 bg-slate-800 shadow-xl overflow-hidden">
                    <Link
                        href={profileLink}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profil
                    </Link>
                    <Link
                        href={settingsLink}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-t border-slate-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Ayarlar
                    </Link>
                    <button
                        onClick={() => {
                            setOpen(false);
                            signOut({ callbackUrl: "/login" });
                        }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border-t border-slate-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Çıkış Yap
                    </button>
                </div>
            )}
        </div>
    );
}
