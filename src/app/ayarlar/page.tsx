"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";

// Firma bazlı ayarlar - tüm kullanıcılar görebilir
const firmSettings = [
  {
    title: "Sistem Listeleri",
    description: "Birimler, para birimi, durum ve diğer dropdown listelerini yönetin.",
    href: "/ayarlar/listeler",
    icon: "📋",
    gradient: "from-blue-500 to-indigo-600",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600"
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
];

// Sadece admin görebilir
const adminSettings = [
  {
    title: "E-posta Ayarları",
    description: "SMTP sunucularını ve e-posta gönderim ayarlarını yapılandırın.",
    href: "/admin/e-posta",
    icon: "📧",
    gradient: "from-emerald-500 to-teal-600",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600"
  },
  {
    title: "Modül Yönetimi",
    description: "Sistem modüllerini açın/kapatın ve rol erişimlerini belirleyin.",
    href: "/admin/moduller",
    icon: "🔧",
    gradient: "from-slate-500 to-gray-600",
    iconBg: "bg-slate-100",
    iconColor: "text-slate-600"
  },
  {
    title: "Kullanıcılar",
    description: "Sistem kullanıcılarını yönetin, yeni kullanıcı ekleyin.",
    href: "/admin/kullanicilar",
    icon: "👥",
    gradient: "from-cyan-500 to-blue-600",
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600"
  },
  {
    title: "Roller ve Yetkiler",
    description: "Kullanıcı rollerini ve izinlerini yapılandırın.",
    href: "/admin/roller",
    icon: "🔐",
    gradient: "from-rose-500 to-pink-600",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600"
  },
  {
    title: "Sistem Logları",
    description: "Kullanıcı etkinliklerini ve sistem değişikliklerini takip edin.",
    href: "/admin/loglar",
    icon: "📜",
    gradient: "from-orange-500 to-red-600",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600"
  }
];

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session?.user as any)?.role === "admin";

  // Normal kullanıcılar sadece firma ayarlarını, admin hem firma hem sistem ayarlarını görür
  const visibleSettings = isAdmin
    ? [...firmSettings, ...adminSettings]
    : firmSettings;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 animate-in fade-in duration-500">
      <PageHeader
        title="Ayarlar"
        description={isAdmin
          ? "Firma ve sistem yapılandırmasını buradan yönetin."
          : "Firma ayarlarınızı buradan yönetin."}
        variant="gradient"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleSettings.map((cat) => (
          <Card
            key={cat.href}
            className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            onClick={() => router.push(cat.href)}
          >
            {/* Gradient Top Bar */}
            <div className={`h-1.5 bg-gradient-to-r ${cat.gradient}`} />

            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 rounded-2xl ${cat.iconBg} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                {cat.icon}
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                {cat.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {cat.description}
              </p>

              {/* Arrow */}
              <div className="mt-4 flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Düzenle
                <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Admin Panel Link for admins */}
      {isAdmin && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <p className="font-medium text-red-800">Admin Paneli</p>
                <p className="text-sm text-red-700">
                  Tüm platform yönetimi için Admin Paneli'ni kullanın.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Admin Panel
            </button>
          </div>
        </Card>
      )}

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
