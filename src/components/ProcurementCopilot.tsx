"use client";
import React, { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
}

export default function ProcurementCopilot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            text: "Merhaba! Satın alma süreçlerin hakkında sana nasıl yardımcı olabilirim? Bütçe, geciken siparişler veya tedarikçi performanslarını sorabilirsin.",
            sender: "bot",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text: input, sender: "user", timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            const res = await fetch("/api/ai/copilot", {
                method: "POST",
                body: JSON.stringify({ message: input })
            });
            const data = await res.json();

            setTimeout(() => {
                const botMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: data.reply || "Üzgünüm, bunu tam olarak anlayamadım.",
                    sender: "bot",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, botMsg]);
                setIsTyping(false);
            }, 600);
        } catch (e) {
            setIsTyping(false);
            setMessages(prev => [...prev, { id: "error", text: "Bir hata oluştu, lütfen tekrar deneyin.", sender: "bot", timestamp: new Date() }]);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 md:w-96 h-[500px] bg-white/95 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                    <div className="p-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                                <Icon name="sparkles" className="w-4 h-4" />
                            </div>
                            <div>
                                <div className="text-sm font-bold leading-tight">Procurement Copilot</div>
                                <div className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Akıllı Asistan</div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-800 rounded-lg transition-colors">
                            <Icon name="x" className="w-5 h-5" />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                        {messages.map(m => (
                            <div key={m.id} className={`flex ${m.sender === "user" ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] p-3 text-sm rounded-2xl shadow-sm ${m.sender === "user"
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                                    }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {isTyping && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <div className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Soru sor..."
                            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                        <button
                            onClick={handleSendMessage}
                            className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                        >
                            <Icon name="send" className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 group ${isOpen ? 'bg-slate-900 rotate-90 text-white' : 'bg-blue-600 text-white animate-pulse shadow-blue-500/40'
                    }`}
            >
                <Icon name={isOpen ? "x" : "sparkles"} className="w-7 h-7" />
            </button>
        </div>
    );
}
