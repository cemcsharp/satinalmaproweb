import { NextResponse } from "next/server";

// KDV tevkifat oranları (yaygın kullanılan kısmi tevkifat türleri)
// percent: KDV’nin alıcı tarafından tevkif edilen kısmı (ör. 5/10 => 0.5)
export async function GET() {
  const rules = [
    { id: "kdv-tevkifat-2-10", code: "2/10", label: "Danışmanlık/Etüt - 2/10", vatRate: 20, percent: 0.2, applicableVatRates: [1, 10, 18, 20], group: "Danışmanlık ve Etüt" },
    { id: "kdv-tevkifat-3-10", code: "3/10", label: "Diğer Hizmetler - 3/10", vatRate: 20, percent: 0.3, applicableVatRates: [1, 10, 18, 20], group: "Diğer Hizmetler" },
    { id: "kdv-tevkifat-4-10", code: "4/10", label: "Yapım İşleri - 4/10", vatRate: 20, percent: 0.4, applicableVatRates: [1, 10, 18, 20], group: "Yapım İşleri" },
    { id: "kdv-tevkifat-5-10", code: "5/10", label: "Taşıma/Hizmet - 5/10", vatRate: 20, percent: 0.5, applicableVatRates: [1, 10, 18, 20], group: "Taşıma ve Hizmet" },
    { id: "kdv-tevkifat-7-10", code: "7/10", label: "Temizlik/Teknik Hizmet - 7/10", vatRate: 20, percent: 0.7, applicableVatRates: [1, 10, 18, 20], group: "Temizlik ve Teknik Hizmet" },
    { id: "kdv-tevkifat-9-10", code: "9/10", label: "Metal/Hurda - 9/10", vatRate: 20, percent: 0.9, applicableVatRates: [1, 10, 18, 20], group: "Metal ve Hurda" },
  ];
  return NextResponse.json({ items: rules });
}