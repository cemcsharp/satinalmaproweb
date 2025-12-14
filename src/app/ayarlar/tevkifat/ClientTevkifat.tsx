"use client";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import { Table, TableContainer, THead, TBody, TR, TH, TD } from "@/components/ui/Table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

export default function ClientTevkifat({ initialItems = [] }: { initialItems?: { code: string; label: string; ratio: string; active?: boolean }[] }) {
  const router = useRouter();
  const [items, setItems] = useState<{ code: string; label: string; ratio: string; active?: boolean }[]>(initialItems);
  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [ratio, setRatio] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!code || !label || !ratio) return;
    setLoading(true);
    try {
      const r = await fetch("/api/withholding/job-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code, label, ratio }),
      });
      if (r.ok) {
        setCode("");
        setLabel("");
        setRatio("");
        const item = await r.json();
        setItems((prev) => {
          const next = [...prev.filter((x) => x.code !== item.code), item];
          return next.sort((a, b) => a.code.localeCompare(b.code));
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (codeValue: string, active: boolean) => {
    const r = await fetch("/api/withholding/job-types", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code: codeValue, active }),
    });
    if (r.ok) {
      setItems((prev) => prev.map((x) => (x.code === codeValue ? { ...x, active } : x)));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Tevkifat İş Türleri"
        description="Tevkifat oranlarını ve iş türlerini yönetin."
        variant="gradient"
        actions={
          <Button variant="outline" onClick={() => router.push("/ayarlar")}>
            ← Geri
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add New Form */}
        <Card variant="glass" className="h-fit lg:sticky lg:top-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Yeni İş Türü</h3>
              <p className="text-xs text-slate-500">Yeni tevkifat oranı tanımlayın.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Kod"
              placeholder="Ör: 601"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Input
              label="Ad"
              placeholder="Ör: Yapım İşleri"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <Input
              label="Oran"
              placeholder="Ör: 4/10"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              description="Örn: 9/10, 4/10"
            />

            <Button
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/20"
              onClick={handleAdd}
              disabled={!code || !label || !ratio || loading}
              loading={loading}
            >
              Ekle
            </Button>
          </div>
        </Card>

        {/* List */}
        <div className="lg:col-span-2">
          <Card variant="glass" className="overflow-hidden p-0">
            <TableContainer className="border-0 shadow-none rounded-none">
              <Table>
                <THead>
                  <TR>
                    <TH className="pl-6">Kod</TH>
                    <TH>Ad</TH>
                    <TH>Oran</TH>
                    <TH>Durum</TH>
                    <TH className="text-right pr-6">İşlemler</TH>
                  </TR>
                </THead>
                <TBody>
                  {items.length === 0 ? (
                    <TR>
                      <TD colSpan={5} className="text-center py-12 text-slate-400">
                        Kayıt bulunamadı.
                      </TD>
                    </TR>
                  ) : items.map((it) => (
                    <TR key={it.code} className="group hover:bg-purple-50/30 transition-colors">
                      <TD className="pl-6 font-mono font-medium text-slate-700">{it.code}</TD>
                      <TD className="font-medium text-slate-800">{it.label}</TD>
                      <TD>
                        <Badge variant="default" className="bg-slate-50 font-mono">{it.ratio}</Badge>
                      </TD>
                      <TD>
                        <Badge variant={(it.active ?? true) ? "success" : "default"}>
                          {(it.active ?? true) ? "Aktif" : "Pasif"}
                        </Badge>
                      </TD>
                      <TD className="text-right pr-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(it.code, !(it.active ?? true))}
                          className={(it.active ?? true) ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"}
                        >
                          {(it.active ?? true) ? "Pasif Yap" : "Aktif Yap"}
                        </Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
