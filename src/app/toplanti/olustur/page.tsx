"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function ToplantiOlusturPage() {
  const router = useRouter();
  const { show } = useToast();
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [location, setLocation] = useState("");
  const [attendeesEmails, setAttendeesEmails] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!title || !startDate || !startTime) {
      show({ title: "Eksik Bilgi", description: "Başlık, tarih ve saat zorunludur.", variant: "warning" });
      return;
    }
    const startAt = new Date(`${startDate}T${startTime}:00`);
    setLoading(true);
    try {
      const res = await fetch("/api/toplanti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          startAt: startAt.toISOString(),
          durationMinutes: Number.isFinite(Number(duration)) ? Number(duration) : 60,
          location,
          attendeesEmails: attendeesEmails
            .split(",")
            .map((s) => s.trim())
            .filter((s) => !!s),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = String((data as any)?.message || (data as any)?.error || `HTTP ${res.status}`);
        throw new Error(msg);
      }
      const j = await res.json().catch(() => ({}));
      const id = String((j as any)?.id || "");
      show({ title: "Başarılı", description: "Toplantı oluşturuldu", variant: "success" });

      if (id) {
        router.push(`/toplanti/detay/${encodeURIComponent(id)}`);
      } else {
        // Reset form if no ID returned (fallback)
        setTitle("");
        setStartDate("");
        setStartTime("");
        setDuration(60);
        setLocation("");
        setAttendeesEmails("");
      }
    } catch (e: any) {
      show({ title: "Hata", description: e?.message || "Toplantı oluşturulamadı", variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Yeni Toplantı"
        description="Toplantı planlayın ve katılımcıları davet edin."
        variant="gradient"
      />

      <div className="max-w-3xl mx-auto">
        <Card variant="glass" className="p-8">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Toplantı Detayları</h3>
              <p className="text-sm text-slate-500">Gerekli bilgileri doldurarak davetiye oluşturun.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="sm:col-span-2">
              <Input
                label="Başlık"
                placeholder="Toplantı konusu..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <Input label="Tarih" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Saat" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />

            <Input
              label="Süre (dk)"
              type="number"
              value={String(duration)}
              onChange={(e) => setDuration(Number(e.target.value || 0))}
              min={15}
              step={15}
            />

            <Input
              label="Konum"
              placeholder="Toplantı odası veya link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <div className="sm:col-span-2">
              <Input
                label="Katılımcı E-postaları"
                description="Birden fazla e-postayı virgül ile ayırarak yazınız."
                placeholder="ornek@sirket.com, diger@sirket.com"
                value={attendeesEmails}
                onChange={(e) => setAttendeesEmails(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => router.back()}>İptal</Button>
            <Button
              variant="gradient"
              disabled={loading}
              onClick={submit}
              loading={loading}
              className="shadow-lg shadow-indigo-500/20"
            >
              Toplantı Oluştur
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
