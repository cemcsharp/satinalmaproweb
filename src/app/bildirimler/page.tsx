"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

type Notification = {
    id: string;
    title: string;
    body: string;
    type: string;
    read: boolean;
    createdAt: string;
};

export default function BildirimlerPage() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    useEffect(() => {
        const fetchNotifications = async () => {
            setLoading(true);
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data.items || []);
                }
            } catch (e) {
                console.error("Bildirimler yüklenemedi:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ read: true })
            });
            setNotifications(prev =>
                prev.map(n => (n.id === id ? { ...n, read: true } : n))
            );
        } catch (e) {
            console.error("Okundu işaretlenemedi:", e);
        }
    };

    const markAllAsRead = async () => {
        try {
            // Mark each notification as read
            await Promise.all(
                notifications.filter(n => !n.read).map(n =>
                    fetch(`/api/notifications/${n.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ read: true })
                    })
                )
            );
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (e) {
            console.error("Tümü okundu işaretlenemedi:", e);
        }
    };

    const filteredNotifications = filter === "unread"
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "success":
                return (
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-blue-600 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                );
            case "warning":
                return (
                    <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-blue-600 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case "error":
                return (
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return "Az önce";
        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 7) return `${diffDays} gün önce`;
        return date.toLocaleDateString("tr-TR");
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageHeader
                title="Bildirimler"
                description="Sistem bildirimleri ve güncellemeler"
                variant="gradient"
            />

            <div className="grid gap-6">
                {/* Filter & Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => setFilter("all")}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "all"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Tümü
                            <Badge variant="default" className="ml-2 bg-slate-200 text-slate-600">{notifications.length}</Badge>
                        </button>
                        <button
                            onClick={() => setFilter("unread")}
                            className={`flex-1 sm:flex-none px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === "unread"
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Okunmamış
                            {unreadCount > 0 && (
                                <Badge variant="error" className="ml-2">{unreadCount}</Badge>
                            )}
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={markAllAsRead} className="w-full sm:w-auto">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            Tümünü Okundu İşaretle
                        </Button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="mt-4 text-slate-500">Bildirimler yükleniyor...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">Bildirim Yok</h3>
                            <p className="text-slate-500 max-w-sm mx-auto">
                                {filter === "unread"
                                    ? "Harika! Okunmamış bildiriminiz bulunmuyor."
                                    : "Henüz size ulaşan bir bildirim bulunmuyor."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer group ${!notification.read ? "bg-blue-50/50" : ""}`}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                >
                                    {getTypeIcon(notification.type)}
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex items-start justify-between gap-4 mb-1">
                                            <h4 className={`text-base font-medium ${notification.read ? "text-slate-700" : "text-slate-900"}`}>
                                                {notification.title}
                                            </h4>
                                            <span className="text-xs text-slate-400 whitespace-nowrap bg-slate-100 px-2 py-1 rounded-full">
                                                {formatDate(notification.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500 leading-relaxed">{notification.body}</p>
                                    </div>
                                    {!notification.read && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-3 ring-4 ring-blue-100"></div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
