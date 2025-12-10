"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import PageHeader from "@/components/ui/PageHeader";
import Input from "@/components/ui/Input";

export default function SupplierCreatePage() {
  const { show } = useToast();
  const router = useRouter();
  const [name, setName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; taxId?: string }>({});

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const localErrors: { name?: string; email?: string; phone?: string; taxId?: string } = {};
    if (!name.trim() || name.trim().length < 2) localErrors.name = "Ad zorunlu (min 2 karakter)";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) localErrors.email = "Geçerli bir e-posta girin";
    if (phone && phone.replace(/\D/g, "").length < 7) localErrors.phone = "Telefon numarası çok kısa";
    if (taxId && taxId.replace(/\D/g, "").length < 8) localErrors.taxId = "Vergi no en az 8 hane";
    setErrors(localErrors);
    if (Object.keys(localErrors).length > 0) {
      show({ title: "Eksik/Hatalı Alanlar", description: Object.values(localErrors).join(" • "), variant: "error" });
      return;
    }
    try {
      const res = await fetch("/api/tedarikci", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          taxId: taxId || undefined,
          contactName: contactName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          website: website || undefined,
          notes: notes || undefined,
          active,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "supplier_create_failed");
      }
      const data = await res.json();
      show({ title: "Kaydedildi", description: `Tedarikçi oluşturuldu: ${data.name}. Listeye yönlendiriliyorsunuz.`, variant: "success" });
      router.push("/tedarikci/liste");
    } catch (e: any) {
      show({ title: "Hata", description: e.message || "Kaydedilemedi", variant: "error" });
    }
  };

  const handleReset = () => {
    setName("");
    setTaxId("");
    setContactName("");
    setEmail("");
    setPhone("");
    setAddress("");
    setWebsite("");
    setNotes("");
    setActive(true);
    setErrors({});
  };

  return (
    <section className="space-y-6">
      <PageHeader
        title="Tedarikçi Oluştur"
        description="Yeni tedarikçi kaydı oluşturun"
        variant="default"
        breadcrumbs={[{ label: "Tedarikçiler", href: "/tedarikci/liste" }, { label: "Yeni Ekle" }]}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <form onSubmit={submit} className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Kimlik Bilgileri */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              Firma Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Firma Adı"
                placeholder="Tedarikçi firma adı"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                description="Zorunlu alan"
              />
              <Input
                label="Vergi No / TCKN"
                placeholder="VKN veya TCKN giriniz"
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                error={errors.taxId}
              />
            </div>
          </div>

          {/* İletişim Bilgileri */}
          <div className="col-span-1 md:col-span-2 space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
              İletişim Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="İlgili Kişi"
                placeholder="Yetkili personel adı"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
              />
              <Input
                label="Telefon"
                placeholder="İletişim numarası"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                error={errors.phone}
              />
              <Input
                label="E-posta Adresi"
                type="email"
                placeholder="ornek@firma.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
              />
              <Input
                label="Web Sitesi"
                placeholder="https://..."
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>
            <div className="pt-2">
              <Input
                label="Adres"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Açık adres bilgisi"
              />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-amber-500 rounded-full"></div>
              Diğer Bilgiler
            </h3>
            <div className="space-y-4">
              <Input
                label="Notlar"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Firma hakkında ek notlar..."
              />
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100 max-w-sm">
                <input
                  id="active"
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <label htmlFor="active" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                  Tedarikçi Aktif
                </label>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 flex justify-end gap-3 pt-6 border-t border-slate-50 mt-2">
            <Button
              variant="outline"
              onClick={handleReset}
              type="button"
            >
              Temizle
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
            >
              Kaydet
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}