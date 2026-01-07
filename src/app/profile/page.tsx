"use client";
import React from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { show } = useToast();

  const [notificationsEnabled, setNotificationsEnabled] = React.useState(false);
  const [emailNotifications, setEmailNotifications] = React.useState(true);
  const [compactView, setCompactView] = React.useState(false);

  // Stats
  const [stats, setStats] = React.useState({ requests: 0, orders: 0, rfqs: 0 });

  // Edit mode
  const [editMode, setEditMode] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");

  // Profile data from API
  const [profileData, setProfileData] = React.useState<{
    username: string;
    email: string;
    role: string;
    phoneNumber?: string;
    createdAt?: string;
    lastLoginAt?: string;
    unitLabel?: string;
  } | null>(null);

  const [loading, setLoading] = React.useState(true);

  // Fetch everything
  React.useEffect(() => {
    const fetchData = async () => {
      if (status !== "authenticated") return;

      setLoading(true);
      try {
        // Fetch Profile
        const profRes = await fetch("/api/profile");
        if (profRes.ok) {
          const data = await profRes.json();
          setProfileData(data);
          setEditName(data.username || "");
          setEditPhone(data.phoneNumber || "");
        }

        // Fetch Stats
        const statsRes = await fetch("/api/user/stats");
        if (statsRes.ok) {
          const data = await statsRes.json();
          setStats(data);
        }

        // Fetch Prefs
        const prefsRes = await fetch("/api/profile/preferences");
        if (prefsRes.ok) {
          const data = await prefsRes.json();
          setEmailNotifications(data.emailEnabled);
          setNotificationsEnabled(data.inAppEnabled);
          // Compact view might still use localStorage if not in DB, 
          // but let's try to get it if we ever add to DB.
          setCompactView(localStorage.getItem("profile.compactView") === "true");
        }
      } catch (e) {
        console.error("Veriler yüklenemedi:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [status]);

  const savePreference = async (key: string, value: boolean) => {
    try {
      // Local check
      if (key === "compactView") {
        localStorage.setItem("profile.compactView", value ? "true" : "false");
      }

      // API call for DB sync
      await fetch("/api/profile/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [key === "notificationsEnabled" ? "inAppEnabled" : key === "emailNotifications" ? "emailEnabled" : key]: value
        })
      });

      show({ title: "Kaydedildi", description: "Ayar güncellendi", variant: "success" });
    } catch {
      show({ title: "Hata", description: "Ayar kaydedilemedi", variant: "error" });
    }
  };

  const [saving, setSaving] = React.useState(false);

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      show({ title: "Hata", description: "Ad Soyad alanı boş olamaz", variant: "error" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: editName.trim(),
          phoneNumber: editPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Kaydetme başarısız");
      }

      setProfileData(prev => prev ? {
        ...prev,
        username: editName.trim(),
        phoneNumber: editPhone.trim()
      } : null);

      show({ title: "Başarılı", description: "Profil bilgileri güncellendi", variant: "success" });
      setEditMode(false);
    } catch (e: any) {
      show({ title: "Hata", description: e.message || "Kaydetme başarısız", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Profil yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Card variant="glass" className="w-full max-w-md text-center p-8">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Oturum Açık Değil</h1>
          <p className="text-slate-500 mb-6">Profilinizi görüntülemek için giriş yapmanız gerekmektedir.</p>
          <Link href="/login">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              Giriş Yap
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
    } catch { return "-"; }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "-";
    try {
      const d = new Date(dateString);
      return d.toLocaleString("tr-TR", {
        day: "numeric", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
    } catch { return "-"; }
  };

  const userName = profileData?.username || "Kullanıcı";
  const userEmail = profileData?.email || "E-posta belirtilmemiş";
  const userRole = profileData?.role || "Kullanıcı";
  const unitLabel = profileData?.unitLabel || "Belirtilmemiş";

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader
        title="Profilim"
        description="Hesap bilgilerinizi ve kişisel tercihlerinizi yönetin."
        variant="gradient"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card - Left Column */}
        <Card variant="glass" className="lg:col-span-1 h-fit">
          <div className="flex flex-col items-center text-center p-6">
            <div className="relative mb-4 group">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-xl shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-800">{userName}</h2>
            <p className="text-sm text-slate-500 mb-3">{userEmail}</p>
            <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
              {userRole}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600">{stats.requests}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Talep</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-emerald-600">{stats.orders}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Sipariş</div>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-xl">
              <div className="text-2xl font-bold text-purple-600">{stats.rfqs}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Teklif</div>
            </div>
          </div>

          <div className="mt-2 pt-4 mx-4 pb-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Son Giriş</span>
              <span className="font-medium text-slate-700">{formatDateTime(profileData?.lastLoginAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Durum</span>
              <span className="font-medium text-emerald-600 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Çevrimiçi
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Üyelik</span>
              <span className="font-medium text-slate-700">{formatDate(profileData?.createdAt)}</span>
            </div>
          </div>
        </Card>

        {/* Settings & Info - Right Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card variant="glass">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Kişisel Bilgiler</h3>
                <p className="text-sm text-slate-500">Hesap bilgilerinizi güncelleyin</p>
              </div>
              {!editMode ? (
                <Button variant="outline" size="sm" onClick={() => { setEditMode(true); setEditName(userName); setEditPhone(profileData?.phoneNumber || ""); }}>
                  Düzenle
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditMode(false)} disabled={saving}>İptal</Button>
                  <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </Button>
                </div>
              )}
            </div>

            {editMode ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Ad Soyad" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <Input label="E-posta" value={userEmail} disabled />
                <Input label="Telefon" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} placeholder="0532 xxx xx xx" />
                <Input label="Birim" value={unitLabel} disabled />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Ad Soyad</div>
                  <div className="font-medium text-slate-800">{userName}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">E-posta</div>
                  <div className="font-medium text-slate-800">{userEmail}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Telefon</div>
                  <div className="font-medium text-slate-800">{profileData?.phoneNumber || "Belirtilmemiş"}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Birim</div>
                  <div className="font-medium text-slate-800">{unitLabel}</div>
                </div>
              </div>
            )}
          </Card>

          <Card variant="glass" title="Bildirim Ayarları">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notificationsEnabled ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Push Bildirimleri</h4>
                    <p className="text-sm text-slate-500">Tarayıcı üzerinden anlık bildirimler alın</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={(e) => { setNotificationsEnabled(e.target.checked); savePreference("notificationsEnabled", e.target.checked); }} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${emailNotifications ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">E-posta Bildirimleri</h4>
                    <p className="text-sm text-slate-500">Önemli güncellemeler e-posta ile gönderilsin</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={emailNotifications} onChange={(e) => { setEmailNotifications(e.target.checked); savePreference("emailNotifications", e.target.checked); }} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </Card>

          <Card variant="glass" title="Görünüm Ayarları">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${compactView ? "bg-purple-100 text-purple-600" : "bg-slate-100 text-slate-400"}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-800">Kompakt Görünüm</h4>
                    <p className="text-sm text-slate-500">Listelerde daha fazla satır göster</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={compactView} onChange={(e) => { setCompactView(e.target.checked); savePreference("compactView", e.target.checked); }} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </Card>

          <Card variant="glass">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800">Hesap Güvenliği</h3>
                <p className="text-sm text-slate-500">Şifrenizi ve güvenlik ayarlarınızı yönetin</p>
              </div>
              <Link href="/sifre-sifirla">
                <Button variant="outline" size="sm">Şifre Değiştir</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}