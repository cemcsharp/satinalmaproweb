"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Card from "@/components/ui/Card";
import PageHeader from "@/components/ui/PageHeader";
import { fetchJsonWithRetry } from "@/lib/http";
import { useToast } from "@/components/ui/Toast";
import Skeleton from "@/components/ui/Skeleton";
import Textarea from "@/components/ui/Textarea";

type SupplierDetail = {
  id: string;
  name: string;
  active: boolean;
  taxId?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  website?: string;
  taxOffice?: string;
  bankName?: string;
  bankBranch?: string;
  bankIban?: string;
  bankAccountNo?: string;
  bankCurrency?: string;
  commercialRegistrationNo?: string;
  mersisNo?: string;
  notes?: string;
}

export default function TedarikciDuzenlePage() {
  const { id } = useParams();
  const router = useRouter();
  const { show } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [taxId, setTaxId] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankCurrency, setBankCurrency] = useState("TRY");
  const [commercialRegistrationNo, setCommercialRegistrationNo] = useState("");
  const [mersisNo, setMersisNo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!id) return;
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchJsonWithRetry<SupplierDetail>(`/api/tedarikci/${id}`, { cache: "no-store" }, { retries: 2, backoffMs: 250 });
        if (!active) return;
        setName(data.name || "");
        setActive(data.active);
        setTaxId(data.taxId || "");
        setContactName(data.contactName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        setWebsite(data.website || "");
        setTaxOffice(data.taxOffice || "");
        setBankName(data.bankName || "");
        setBankBranch(data.bankBranch || "");
        setBankIban(data.bankIban || "");
        setBankAccountNo(data.bankAccountNo || "");
        setBankCurrency(data.bankCurrency || "TRY");
        setCommercialRegistrationNo(data.commercialRegistrationNo || "");
        setMersisNo(data.mersisNo || "");
        setNotes(data.notes || "");
      } catch (e: any) {
        show({ title: "Hata", description: "Tedarikçi bilgileri yüklenemedi", variant: "error" });
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [id, show]);

  const handleSave = async () => {
    if (!name) {
      show({ title: "Hata", description: "Firma adı zorunludur", variant: "error" });
      return;
    }
    try {
      setSaving(true);
      const body = {
        name,
        active,
        taxId: taxId || null,
        contactName: contactName || null,
        email: email || null,
        phone: phone || null,
        address: address || null,
        website: website || null,
        taxOffice: taxOffice || null,
        bankName: bankName || null,
        bankBranch: bankBranch || null,
        bankIban: bankIban || null,
        bankAccountNo: bankAccountNo || null,
        bankCurrency: bankCurrency || "TRY",
        commercialRegistrationNo: commercialRegistrationNo || null,
        mersisNo: mersisNo || null,
        notes: notes || null
      };

      await fetchJsonWithRetry(`/api/tedarikci/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }, { retries: 1, backoffMs: 200 });

      show({ title: "Başarılı", description: "Tedarikçi güncellendi", variant: "success" });
      router.push("/tedarikci/liste");
    } catch (e: any) {
      show({ title: "Hata", description: "Güncelleme başarısız", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-10 text-center"><Skeleton height={200} /></div>;

  return (
    <section className="space-y-6 max-w-4xl mx-auto pb-10">
      <PageHeader
        title="Tedarikçi Düzenle"
        description={`${name} bilgilerini düzenliyorsunuz.`}
        variant="default"
        actions={
          <Button variant="outline" onClick={() => router.push("/tedarikci/liste")}>
            Vazgeç
          </Button>
        }
      />

      <Card className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Firma Adı"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Select
                label="Durum"
                value={active ? "true" : "false"}
                onChange={(e) => setActive(e.target.value === "true")}
              >
                <option value="true">Aktif</option>
                <option value="false">Pasif</option>
              </Select>
            </div>
            <div>
              <Input
                label="Vergi Numarası"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Vergi Dairesi"
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="MERSİS No"
                value={mersisNo}
                onChange={(e) => setMersisNo(e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Ticaret Sicil No"
                value={commercialRegistrationNo}
                onChange={(e) => setCommercialRegistrationNo(e.target.value)}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">Banka ve Ödeme Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input
                  label="IBAN"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  placeholder="TR..."
                />
              </div>
              <Input
                label="Banka Adı"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <Input
                label="Şube"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
              />
              <Input
                label="Hesap No"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
              />
              <Select
                label="Para Birimi"
                value={bankCurrency}
                onChange={(e) => setBankCurrency(e.target.value)}
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </Select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">İletişim Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Input
                  label="Yetkili Kişi"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="E-Posta"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Telefon"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Input
                  label="Web Sitesi"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Adres"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="md:col-span-2">
                <Textarea
                  label="Notlar"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Firma hakkında ek bilgiler..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
          <Button variant="outline" onClick={() => router.push("/tedarikci/liste")} disabled={saving}>Vazgeç</Button>
          <Button variant="gradient" onClick={handleSave} loading={saving} className="shadow-lg shadow-sky-500/20">Değişiklikleri Kaydet</Button>
        </div>
      </Card>
    </section>
  );
}