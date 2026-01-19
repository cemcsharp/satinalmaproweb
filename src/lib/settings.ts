import { prisma } from "./db";

export interface FAQItem {
    question: string;
    answer: string;
}

export interface SolutionCard {
    icon: string;
    title: string;
    description: string;
}

export interface FeaturePoint {
    title: string;
    description: string;
}

export interface SystemSettings {
    // Sistem Ayarları
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    supportPhone: string;
    currency: string;
    timezone: string;

    // Landing Page - Hero
    heroTitle: string;
    heroSubtitle: string;
    heroCTAText: string;

    // Landing Page - İstatistikler
    statsYears: string;
    statsSuppliers: string;
    statsTransactions: string;

    // Landing Page - SSS
    faqItems: FAQItem[];

    // Landing Page - Solutions
    solutionsTitle: string;
    solutionsSubtitle: string;
    solutionCards: SolutionCard[];

    // Landing Page - Buyer Features
    buyerTitle: string;
    buyerSubtitle: string;
    buyerFeatures: FeaturePoint[];

    // Landing Page - Supplier Features
    supplierTitle: string;
    supplierSubtitle: string;
    supplierFeatures: FeaturePoint[];

    // Landing Page - Final CTA
    ctaTitle: string;
    ctaSubtitle: string;
}

export const defaultSettings: SystemSettings = {
    siteName: "satinalma.app",
    siteDescription: "Kurumsal e-Satınalma Platformu",
    supportEmail: "destek@satinalma.app",
    supportPhone: "+90 212 000 00 00",
    currency: "TRY",
    timezone: "Europe/Istanbul",

    // Landing Page defaults
    heroTitle: "Kurumsal Satınalmayı Yeniden Tanımlıyoruz",
    heroSubtitle: "Talep, teklif, sipariş ve teslimat süreçlerinizi tek platformda dijitalleştirin. Tedarikçilerinizle bağlantı kurun, maliyetleri düşürün.",
    heroCTAText: "Ücretsiz Demo İste",
    statsYears: "20+",
    statsSuppliers: "35K",
    statsTransactions: "1M+",
    faqItems: [
        { question: "satinalma.app nedir?", answer: "Kurumsal firmaların satın alma süreçlerini uçtan uca dijitalleştiren bir e-satınalma platformudur." },
        { question: "Platformu kimler kullanabilir?", answer: "Alıcı firmalar (kurumsal satın alma departmanları) ve tedarikçi firmalar platformu kullanabilir." },
        { question: "Ücretsiz deneme var mı?", answer: "Evet, 14 günlük ücretsiz deneme süremiz mevcuttur. Demo talep ederek hemen başlayabilirsiniz." }
    ],

    // Solutions defaults
    solutionsTitle: "Tüm Satınalma İhtiyaçlarınız İçin",
    solutionsSubtitle: "Uçtan uca dijitalleştirilmiş süreçlerle operasyonel mükemmelliğe ulaşın.",
    solutionCards: [
        { icon: "file-text", title: "Talep Yönetimi", description: "Departman bazlı talep toplama, bütçe kontrolü ve onay akışları." },
        { icon: "inbox", title: "RFQ & Teklif", description: "Tedarikçilere anında teklif talebi gönderimi ve karşılaştırmalı analiz." },
        { icon: "package", title: "Sipariş Takibi", description: "Otomatik PO oluşturma ve teslimat süreçlerinin gerçek zamanlı izlenmesi." }
    ],

    // Buyer defaults
    buyerTitle: "Tüm Satınalma Döngüsünü Tek Merkezden Yönetin",
    buyerSubtitle: "satinalma.app ile manuel takip edilen Excel dosyalarından kurtulun. Talepten faturaya tüm süreci dijitalleştirerek zaman ve maliyet tasarrufu sağlayın.",
    buyerFeatures: [
        { title: "Talep Havuzu", description: "Tüm departmanlardan gelen talepleri tek bir havuzda toplayın ve yetki bazlı onaylayın." },
        { title: "RFQ & Teklif Karşılaştırma", description: "Tedarikçilere otomatik teklif talebi (RFQ) gönderin, teklifleri matris üzerinde saniyeler içinde karşılaştırın." },
        { title: "Sipariş ve Sözleşme", description: "Onaylanan tekliflerden otomatik PO oluşturun, sözleşme sürelerini ve şartlarını takip edin." }
    ],

    // Supplier defaults
    supplierTitle: "Yeni Müşterilere Anında Ulaşın",
    supplierSubtitle: "Kurumsal firmaların tedarik ağına katılın, gelen talepleri saniyeler içinde yanıtlayın. Dijital portalınız üzerinden tüm teklif ve sipariş sürecinizi şeffaflıkla yönetin.",
    supplierFeatures: [
        { title: "Anında Bildirim", description: "Yeni RFQ geldiğinde e-posta ve portal üzerinden anında haberiniz olsun." },
        { title: "Termin Yönetimi", description: "Teslimat tarihlerini ve stok durumlarını kolayca yönetin, puanınızı artırın." },
        { title: "İrsaliye & Fatura", description: "Siparişten tek tıkla dijital irsaliye oluşturun, süreci hızlandırın." }
    ],

    // Final CTA defaults
    ctaTitle: "Geleceğin Satınalma Dünyasına Hazır mısınız?",
    ctaSubtitle: "Hemen ücretsiz deneme başlatın veya demo talep edin. Dijital dönüşüm yolculuğunuzda yanınızdayız."
};

/**
 * Sistem ayarlarını döndürür.
 * NOT: SystemSetting modeli şema refaktörü sırasında kaldırıldı.
 * Şimdilik varsayılan ayarları döndürüyoruz. Gelecekte tenant bazlı ayarlar için
 * Tenant modeline settings alanı eklenebilir.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
    // SystemSetting model was removed during schema refactoring
    // Return default settings for now
    return defaultSettings;
}
