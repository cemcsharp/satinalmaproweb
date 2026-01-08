"use client";
import React, { useState, useEffect } from "react";
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
  const [categoryId, setCategoryId] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranch, setBankBranch] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankAccountNo, setBankAccountNo] = useState("");
  const [bankCurrency, setBankCurrency] = useState("TRY");
  const [commercialRegistrationNo, setCommercialRegistrationNo] = useState("");
  const [mersisNo, setMersisNo] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string; taxId?: string }>({});

  // Fetch Categories on Load
  useEffect(() => {
    fetch("/api/tedarikci/kategori")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => { });
  }, []);

  const renderCategoryOptions = (cats: any[], depth = 0): React.ReactNode[] => {
    return cats.map(cat => (
      <React.Fragment key={cat.id}>
        <option value={cat.id}>
          {"- ".repeat(depth)} {cat.name}
        </option>
        {cat.children && cat.children.length > 0 && renderCategoryOptions(cat.children, depth + 1)}
      </React.Fragment>
    ));
  };

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
          categoryId: categoryId || undefined,
          taxId: taxId || undefined,
          contactName: contactName || undefined,
          email: email || undefined,
          phone: phone || undefined,
          address: address || undefined,
          website: website || undefined,
          notes: notes || undefined,
          taxOffice: taxOffice || undefined,
          bankName: bankName || undefined,
          bankBranch: bankBranch || undefined,
          bankIban: bankIban || undefined,
          bankAccountNo: bankAccountNo || undefined,
          bankCurrency: bankCurrency || undefined,
          commercialRegistrationNo: commercialRegistrationNo || undefined,
          mersisNo: mersisNo || undefined,
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
    setTaxOffice("");
    setBankName("");
    setBankBranch("");
    setBankIban("");
    setBankAccountNo("");
    setBankCurrency("TRY");
    setCommercialRegistrationNo("");
    setMersisNo("");
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
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Firma Sektörü / Kategorisi</label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">Seçiniz...</option>
                  {renderCategoryOptions(categories)}
                </select>
                <p className="text-xs text-slate-500">Tedarikçi hangi sektörde faaliyet gösteriyor?</p>
              </div>
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
              <Input
                label="Vergi Dairesi"
                placeholder="Bağlı olduğu vergi dairesi"
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
              />
              <Input
                label="MERSİS No"
                placeholder="16 haneli MERSİS no"
                value={mersisNo}
                onChange={(e) => setMersisNo(e.target.value)}
              />
              <Input
                label="Ticaret Sicil No"
                placeholder="Ticaret sicil numarası"
                value={commercialRegistrationNo}
                onChange={(e) => setCommercialRegistrationNo(e.target.value)}
              />
            </div>
          </div>

          {/* Banka Bilgileri */}
          <div className="col-span-1 md:col-span-2 space-y-4 pt-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
              Banka ve Ödeme Bilgileri
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="IBAN"
                  placeholder="TR..."
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  description="Boşluksuz ve TR ile başlayan format"
                />
              </div>
              <Input
                label="Banka Adı"
                placeholder="Örn: Garanti BBVA"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <Input
                label="Şube"
                placeholder="Banka şubesi"
                value={bankBranch}
                onChange={(e) => setBankBranch(e.target.value)}
              />
              <Input
                label="Hesap No"
                placeholder="Hesap numarası"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
              />
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Para Birimi</label>
                <select
                  className="w-full h-10 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  value={bankCurrency}
                  onChange={(e) => setBankCurrency(e.target.value)}
                >
                  <option value="TRY">TRY - Türk Lirası</option>
                  <option value="USD">USD - Amerikan Doları</option>
                  <option value="EUR">EUR - Euro</option>
                </select>
              </div>
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