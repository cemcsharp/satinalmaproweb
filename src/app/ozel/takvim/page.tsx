"use client";

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type Meeting = {
    id: string;
    title: string;
    startAt: string;
    endAt?: string | null;
    status?: string;
    organizer?: string | null;
    location?: string | null;
};

export default function TakvimPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(true);

    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const startingDay = (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1);

    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(i);
    }

    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    useEffect(() => {
        const fetchMeetings = async () => {
            setLoading(true);
            try {
                // Calculate date range for the current month
                const year = currentDate.getFullYear();
                const month = currentDate.getMonth();
                const dateFrom = new Date(year, month, 1).toISOString().split('T')[0];
                const dateTo = new Date(year, month + 1, 0).toISOString().split('T')[0];

                const res = await fetch(`/api/toplanti?dateFrom=${dateFrom}&dateTo=${dateTo}&pageSize=100`);
                if (res.ok) {
                    const data = await res.json();
                    setMeetings(data.items || []);
                }
            } catch (e) {
                console.error("Toplantılar yüklenemedi:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchMeetings();
    }, [currentDate]);

    const getMeetingsForDay = (day: number) => {
        return meetings.filter(m => {
            if (!m.startAt) return false;
            const meetingDate = new Date(m.startAt);
            if (isNaN(meetingDate.getTime())) return false;
            return meetingDate.getDate() === day &&
                meetingDate.getMonth() === currentDate.getMonth() &&
                meetingDate.getFullYear() === currentDate.getFullYear();
        });
    };

    const formatMeetingDate = (dateStr: string) => {
        if (!dateStr) return { day: 0, month: "" };
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return { day: 0, month: "" };
        return {
            day: date.getDate(),
            month: monthNames[date.getMonth()]?.slice(0, 3) || ""
        };
    };

    const formatTime = (dateStr?: string) => {
        if (!dateStr) return "Saat belirtilmemiş";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "Saat belirtilmemiş";
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="p-4 space-y-4 animate-in fade-in duration-500 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-slate-800">Takvim</h1>
                    <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                            <span className="text-slate-500">Bugün</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                            <span className="text-slate-500">Toplantı</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-md shadow-sm border border-slate-200">
                    <button onClick={prevMonth} className="p-1 hover:bg-slate-50 rounded transition-colors text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <span className="text-sm font-semibold min-w-[100px] text-center text-slate-700">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button onClick={nextMonth} className="p-1 hover:bg-slate-50 rounded transition-colors text-slate-500">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <Card className="p-4 shadow-sm">
                {loading ? (
                    <div className="h-64 flex items-center justify-center text-slate-400">
                        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-md overflow-hidden text-xs">
                        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(d => (
                            <div key={d} className="bg-slate-50 py-2 text-center font-semibold text-slate-400">
                                {d}
                            </div>
                        ))}
                        {days.map((day, idx) => {
                            const dayMeetings = day ? getMeetingsForDay(day) : [];
                            const isToday = day === new Date().getDate() &&
                                currentDate.getMonth() === new Date().getMonth() &&
                                currentDate.getFullYear() === new Date().getFullYear();

                            return (
                                <div key={idx} className={`min-h-[80px] p-1 bg-white ${day ? 'hover:bg-slate-50 transition-colors' : 'bg-slate-50/30'}`}>
                                    {day !== null && (
                                        <div className="flex flex-col h-full gap-1">
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-full font-medium ${isToday
                                                ? 'bg-blue-600 text-white'
                                                : 'text-slate-500'
                                                }`}>
                                                {day}
                                            </span>
                                            <div className="flex-1 space-y-0.5 overflow-hidden">
                                                {dayMeetings.slice(0, 3).map(meeting => (
                                                    <div
                                                        key={meeting.id}
                                                        className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded truncate cursor-pointer hover:bg-purple-100 transition-colors border border-purple-100/50"
                                                        title={`${meeting.title} - ${formatTime(meeting.startAt)}`}
                                                    >
                                                        <span className="opacity-75 mr-1 text-[9px]">{formatTime(meeting.startAt)}</span>
                                                        {meeting.title}
                                                    </div>
                                                ))}
                                                {dayMeetings.length > 3 && (
                                                    <div className="text-[9px] text-slate-400 pl-1">
                                                        +{dayMeetings.length - 3} daha
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </div>
    );
}
