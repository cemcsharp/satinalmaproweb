"use client";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

const settingsCategories = [
  {
    title: "Sistem Listeleri",
    description: "Birimler, para birimi, durum, tedarikçi ve diğer dropdown listelerini yönetin.",
    href: "/ayarlar/listeler",
    icon: "📋",
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600"
  },
  {
    title: "E-posta Ayarları",
    description: "SMTP sunucularını ve e-posta gönderim ayarlarını yapılandırın.",
    href: "/ayarlar/e-posta",
    icon: "📧",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600"
  },
  {
    title: "Tedarikçi Değerlendirme",
    description: "Değerlendirme soruları ve puanlama tiplerini düzenleyin.",
    href: "/ayarlar/degerlendirme",
    icon: "⭐",
    gradient: "from-amber-500 to-orange-600",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600"
  },
  {
    title: "Tevkifat Oranları",
    description: "Vergi tevkifat oranlarını ve iş kalemleri kodlarını yönetin.",
    href: "/ayarlar/tevkifat",
    icon: "📊",
    gradient: "from-purple-500 to-violet-600",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600"
  },
  {
    title: "Modül Yönetimi",
    description: "Sistem modüllerini açın/kapatın ve rol erişimlerini belirleyin.",
    href: "/ayarlar/moduller",
    icon: "🔧",
    gradient: "from-slate-500 to-gray-600",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600"
  },
  {
    title: "Kullanıcılar",
    description: "Sistem kullanıcılarını yönetin, yeni kullanıcı ekleyin.",
    href: "/ayarlar/kullanicilar",
    icon: "👥",
    gradient: "from-cyan-500 to-blue-600",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600"
  },
  {
    title: "Roller ve Yetkiler",
    description: "Kullanıcı rollerini ve izinlerini yapılandırın.",
    href: "/ayarlar/roller",
    icon: "🔐",
    gradient: "from-rose-500 to-pink-600",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600"
  },
  {
    title: "Sistem Logları",
    description: "Kullanıcı etkinliklerini ve sistem değişikliklerini takip edin.",
    href: "/ayarlar/loglar",
    icon: "📜",
    gradient: "from-orange-500 to-red-600",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600"
  },
  {
    title: "Onay Akışları",
    description: "Talep, sipariş ve sözleşme onay süreçlerini dinamik olarak yapılandırın.",
    href: "/ayarlar/onay-akislari",
    icon: "✅",
    gradient: "from-green-500 to-emerald-600",
    iconBg: "bg-green-100",
    iconColor: "text-green-600"
  }
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      <PageHeader
        title="Ayarlar"
        description="Sistem yapılandırmasını ve tercihlerinizi buradan yönetin."
        variant="gradient"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {settingsCategories.map((cat) => (
          <Card
            key={cat.href}
            className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
            onClick={() => router.push(cat.href)}
          >
            {/* Gradient Top Bar */}
            <div className={`h-1 bg-gradient-to-r ${cat.gradient}`} />

            <div className="p-4">
              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl ${cat.iconBg} flex items-center justify-center text-lg mb-3 group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                {cat.title}
              </h3>
              <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                {cat.description}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium text-blue-800">Yardım</p>
            <p className="text-sm text-blue-700">
              Her kategori kartına tıklayarak ilgili ayarlara ulaşabilirsiniz.
              Değişiklikler anında kaydedilir.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
