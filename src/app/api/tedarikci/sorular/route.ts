import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/apiError";
import { prisma } from "@/lib/db";

// Statik yedek soru setleri (DB boş olduğunda)
type EvalOption = { id: string; label: string };
type EvalQuestion = { id: string; text: string; type: "dropdown" | "text" | "rating"; options?: EvalOption[]; active: boolean; section?: "A" | "B" | "C" };

const staticBase: EvalQuestion[] = [
  { id: "q1", text: "Teslimat zamanında mı?", type: "rating", active: true },
  { id: "q2", text: "Ürün kalitesi", type: "rating", active: true },
  { id: "q3", text: "İletişim kalitesi", type: "dropdown", active: true, options: [
    { id: "o1", label: "Mükemmel" },
    { id: "o2", label: "İyi" },
    { id: "o3", label: "Orta" },
    { id: "o4", label: "Zayıf" },
  ] },
];

const staticHizmet: EvalQuestion[] = [
  { id: "A.1", section: "A", text: "Hizmet Şartnamesine Uygunluk", type: "rating", active: true },
  { id: "A.2", section: "A", text: "Personel Yeterliliği ve Deneyimi", type: "rating", active: true },
  { id: "A.3", section: "A", text: "Ekipman/Malzeme Kalitesi", type: "rating", active: true },
  { id: "A.4", section: "A", text: "Hata/Şikayet Oranı", type: "rating", active: true },
  { id: "A.5", section: "A", text: "Sorun Çözme Hızı ve Etkinliği", type: "rating", active: true },
  { id: "B.1", section: "B", text: "Süre Taahhütlerine Uygunluk", type: "rating", active: true },
  { id: "B.2", section: "B", text: "Personel Devamlılığı ve Hızı", type: "rating", active: true },
  { id: "B.3", section: "B", text: "Esneklik ve Acil Taleplere Cevap", type: "rating", active: true },
  { id: "B.4", section: "B", text: "İletişim ve Raporlama Şeffaflığı", type: "rating", active: true },
  { id: "C.1", section: "C", text: "Fiyat Rekabetçiliği ve Şeffaflığı", type: "rating", active: true },
  { id: "C.2", section: "C", text: "Ödeme Koşullarına Uygunluk", type: "rating", active: true },
  { id: "C.3", section: "C", text: "Kurumsal Yapı ve Belgelendirme", type: "rating", active: true },
  { id: "C.4", section: "C", text: "İSG Uyumu", type: "rating", active: true },
  { id: "C.5", section: "C", text: "Referanslar ve Pazarda İtibar", type: "rating", active: true },
];

const staticMalzeme: EvalQuestion[] = [
  { id: "A.1", section: "A", text: "Teknik Şartnameye Uygunluk", type: "rating", active: true },
  { id: "A.2", section: "A", text: "Red/İade Oranı", type: "rating", active: true },
  { id: "A.3", section: "A", text: "Garanti ve Satış Sonrası Hizmet", type: "rating", active: true },
  { id: "A.4", section: "A", text: "Sertifikasyon ve Belgelendirme", type: "rating", active: true },
  { id: "A.5", section: "A", text: "Stok Sürekliliği", type: "rating", active: true },
  { id: "B.1", section: "B", text: "Fiyat Düzeyi", type: "rating", active: true },
  { id: "B.2", section: "B", text: "Fiyat İstikrarı ve Şeffaflığı", type: "rating", active: true },
  { id: "B.3", section: "B", text: "Ödeme Koşulları ve Vade", type: "rating", active: true },
  { id: "B.4", section: "B", text: "Toplu Alım/İndirim Esnekliği", type: "rating", active: true },
  { id: "C.1", section: "C", text: "Zamanında Teslimat", type: "rating", active: true },
  { id: "C.2", section: "C", text: "Miktara Uygunluk", type: "rating", active: true },
  { id: "C.3", section: "C", text: "Ambalajlama ve Hasarsız Teslimat", type: "rating", active: true },
  { id: "C.4", section: "C", text: "Lojistik ve Takip", type: "rating", active: true },
];

const staticDanismanlik: EvalQuestion[] = [
  { id: "A.1", section: "A", text: "Uzmanlık Deneyimi", type: "rating", active: true },
  { id: "A.2", section: "A", text: "Proje Ekibi Nitelikleri", type: "rating", active: true },
  { id: "A.3", section: "A", text: "Metodoloji ve Yaklaşım", type: "rating", active: true },
  { id: "A.4", section: "A", text: "Gizlilik ve Fikri Mülkiyet", type: "rating", active: true },
  { id: "A.5", section: "A", text: "Referanslar ve Akademik İlişkiler", type: "rating", active: true },
  { id: "B.1", section: "B", text: "Takvim ve Terminlere Uygunluk", type: "rating", active: true },
  { id: "B.2", section: "B", text: "İletişim ve Raporlama", type: "rating", active: true },
  { id: "B.3", section: "B", text: "İşbirliği ve Koordinasyon", type: "rating", active: true },
  { id: "B.4", section: "B", text: "Çıktıların Uygulanabilirliği", type: "rating", active: true },
  { id: "C.1", section: "C", text: "Maliyet Rekabetçiliği ve Kapsamı", type: "rating", active: true },
  { id: "C.2", section: "C", text: "Ödeme Planı ve Esneklik", type: "rating", active: true },
  { id: "C.3", section: "C", text: "Süre/Bütçe İçinde Kalma", type: "rating", active: true },
  { id: "C.4", section: "C", text: "Finansal İstikrar", type: "rating", active: true },
];

const staticBakim: EvalQuestion[] = [
  { id: "A.1", section: "A", text: "Teknik Uzmanlık ve Sertifikasyon", type: "rating", active: true },
  { id: "A.2", section: "A", text: "Arıza Tespit ve Onarım Başarısı", type: "rating", active: true },
  { id: "A.3", section: "A", text: "Yedek Parça/Malzeme Kalitesi", type: "rating", active: true },
  { id: "A.4", section: "A", text: "İşçilik Kalitesi ve Garanti", type: "rating", active: true },
  { id: "A.5", section: "A", text: "Önleyici Bakım Yeterliliği", type: "rating", active: true },
  { id: "B.1", section: "B", text: "Acil Durum Müdahale Hızı", type: "rating", active: true },
  { id: "B.2", section: "B", text: "Taahhüt Süresi Uygunluğu", type: "rating", active: true },
  { id: "B.3", section: "B", text: "İSG Uygulamaları", type: "rating", active: true },
  { id: "B.4", section: "B", text: "Alan Düzeni ve Temizlik", type: "rating", active: true },
  { id: "B.5", section: "B", text: "İletişim ve Raporlama", type: "rating", active: true },
  { id: "C.1", section: "C", text: "Fiyatlandırma Şeffaflığı", type: "rating", active: true },
  { id: "C.2", section: "C", text: "Maliyet Sapması", type: "rating", active: true },
  { id: "C.3", section: "C", text: "Kapasite (Personel/Ekipman)", type: "rating", active: true },
  { id: "C.4", section: "C", text: "Finansal İstikrar ve Referanslar", type: "rating", active: true },
];

const staticInsaat: EvalQuestion[] = [
  { id: "A.1", section: "A", text: "Şartname/Projeye Uygunluk", type: "rating", active: true },
  { id: "A.2", section: "A", text: "Personel/Ekipman Yeterliliği", type: "rating", active: true },
  { id: "A.3", section: "A", text: "Deneyim ve Referanslar", type: "rating", active: true },
  { id: "A.4", section: "A", text: "Kalite Yönetim Sistemleri", type: "rating", active: true },
  { id: "A.5", section: "A", text: "İş Sonu Kontrol ve Teslim", type: "rating", active: true },
  { id: "B.1", section: "B", text: "Takvim ve Termin Uygunluğu", type: "rating", active: true },
  { id: "B.2", section: "B", text: "İSG Performansı", type: "rating", active: true },
  { id: "B.3", section: "B", text: "Maliyet Kontrolü ve Bütçe", type: "rating", active: true },
  { id: "B.4", section: "B", text: "Koordinasyon ve Raporlama", type: "rating", active: true },
  { id: "B.5", section: "B", text: "Çevre ve Atık Yönetimi", type: "rating", active: true },
  { id: "C.1", section: "C", text: "Finansal Güç", type: "rating", active: true },
  { id: "C.2", section: "C", text: "Fiyat Şeffaflığı ve Rekabet", type: "rating", active: true },
  { id: "C.3", section: "C", text: "Hukuki Uygunluk", type: "rating", active: true },
  { id: "C.4", section: "C", text: "Taşeron/Tedarikçi Yönetimi", type: "rating", active: true },
];

const staticByType: Record<string, EvalQuestion[]> = {
  hizmet: staticHizmet,
  malzeme: staticMalzeme,
  danismanlik: staticDanismanlik,
  bakim: staticBakim,
  insaat: staticInsaat,
  base: staticBase,
};

// DB-backed supplier evaluation questions list
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get("type") || "").toLowerCase();
    // Optional filters
    const section = (searchParams.get("section") || "").trim();
    const activeStr = (searchParams.get("active") || "").trim();
    // Note: `type` (malzeme/hizmet/…) sadece ağırlık hesaplaması için kullanılıyor;
    // sorular DB’den gelir ve bu endpointte kategoriye göre statik dönülmez.
    const where: any = {};
    if (section) where.section = section;
    if (activeStr === "true" || activeStr === "false") where.active = activeStr === "true";
    if (type) where.scoringType = { code: type };
    const items = await prisma.evaluationQuestion.findMany({
      where,
      orderBy: [{ section: "asc" }, { sort: "asc" }, { text: "asc" }],
      include: { options: true, scoringType: true },
    });
    // Shape response to match client expectations
    let shaped: EvalQuestion[] = items.map((q) => ({
      id: q.id,
      text: q.text,
      type: (q.type as "dropdown" | "text" | "rating") || "rating",
      active: q.active,
      ...(q.section ? { section: q.section as "A" | "B" | "C" } : {}),
      options: (q.options || []).map((o) => ({ id: o.id, label: o.label })),
    }));
    let source: "db" | "static" = "db";
    // Fallback to static set if DB has no questions
    if (!shaped.length) {
      shaped = staticByType[type] || staticByType.base;
      source = "static";
    }
    return NextResponse.json({ items: shaped, source });
  } catch (e) {
    console.error(e);
    return jsonError(500, "question_list_failed", { message: "questions_db_load_failed" });
  }
}