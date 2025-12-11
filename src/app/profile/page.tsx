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
  const [stats, setStats] = React.useState({ requests: 0, orders: 0, meetings: 0 });

  // Edit mode
  const [editMode, setEditMode] = React.useState(false);
  const [editName, setEditName] = React.useState("");
  const [editPhone, setEditPhone] = React.useState("");

  // Profile data from API (not session - session might be stale)
  const [profileData, setProfileData] = React.useState<{
    username: string;
    email: string;
    role: string;
  } | null>(null);


  // Fetch fresh profile data from API
  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfileData({
            username: data.username || "Kullanıcı",
            email: data.email || "",
            role: data.role || "user",
          });
          // Set editName to current username
          setEditName(data.username || "");
        }
      } catch (e) {
        console.error("Profil yüklenemedi:", e);
      }
    };
    if (status === "authenticated") {
      fetchProfile();
    }
  }, [status]);

  React.useEffect(() => {
    try {
      const n = localStorage.getItem("profile.notificationsEnabled");
      const e = localStorage.getItem("profile.emailNotifications");
      const c = localStorage.getItem("profile.compactView");
      setNotificationsEnabled(n === "true");
      setEmailNotifications(e !== "false");
      setCompactView(c === "true");
    } catch { }

    // Fetch user stats
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/user/stats");
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch { }
    };
    fetchStats();
  }, []);

  const saveSetting = (key: string, value: boolean) => {
    try {
      localStorage.setItem(`profile.${key}`, value ? "true" : "false");
      show({ title: "Kaydedildi", description: "Ayar güncellendi", variant: "success" });
    } catch { }
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
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "username_taken") {
          throw new Error("Bu kullanıcı adı zaten kullanılıyor");
        }
        if (data.error === "unauthorized") {
          throw new Error("Oturum süresi dolmuş, lütfen tekrar giriş yapın");
        }
        throw new Error(data.error || "Kaydetme başarısız");
      }

      // Update local state immediately
      setProfileData(prev => prev ? { ...prev, username: editName.trim() } : null);

      show({ title: "Başarılı", description: "Profil bilgileri güncellendi", variant: "success" });
      setEditMode(false);
    } catch (e: any) {
      show({ title: "Hata", description: e.message || "Kaydetme başarısız", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading") {
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

  // Use profile data from API (fresh) instead of session (might be stale)
  const userName = profileData?.username || (session as any)?.user?.name || "Kullanıcı";
  const userEmail = profileData?.email || (session as any)?.user?.email || "E-posta belirtilmemiş";
  const userRole = profileData?.role || (session as any)?.user?.role || "Kullanıcı";

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
            {/* Avatar */}
            <div className="relative mb-4 group">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-1 shadow-xl shadow-blue-500/20">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">
                  {userName.charAt(0).toUpperCase()}
                </div>
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors border border-slate-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* User Info */}
            <h2 className="text-xl font-bold text-slate-800">{userName}</h2>
            <p className="text-sm text-slate-500 mb-3">{userEmail}</p>
            <Badge variant="info" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
              {userRole}
            </Badge>
          </div>

          {/* Quick Stats */}
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
              <div className="text-2xl font-bold text-purple-600">{stats.meetings}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">Toplantı</div>
            </div>
          </div>

          {/* Status Info */}
          <div className="mt-2 pt-4 mx-4 pb-4 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Son Giriş</span>
              <span className="font-medium text-slate-700">Bugün, 09:41</span>
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
              <span className="font-medium text-slate-700">15 Ocak 2024</span>
            </div>
          </div>
        </Card>

        {/* Settings & Info - Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Info Edit */}
          <Card variant="glass">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Kişisel Bilgiler</h3>
                <p className="text-sm text-slate-500">Hesap bilgilerinizi güncelleyin</p>
              </div>
              {!editMode ? (
                <Button variant="outline" size="sm" onClick={() => { setEditMode(true); setEditName(userName); }}>
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
                <Input label="Departman" value="Satın Alma" disabled />
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
                  <div className="text-xs text-slate-500 mb-1">Rol</div>
                  <div className="font-medium text-slate-800">{userRole}</div>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="text-xs text-slate-500 mb-1">Departman</div>
                  <div className="font-medium text-slate-800">Satın Alma</div>
                </div>
              </div>
            )}
          </Card>

          {/* Notification Settings */}
          <Card variant="glass" title="Bildirim Ayarları">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-white hover:shadow-sm">
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
                  <input type="checkbox" className="sr-only peer" checked={notificationsEnabled} onChange={(e) => { setNotificationsEnabled(e.target.checked); saveSetting("notificationsEnabled", e.target.checked); }} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-white hover:shadow-sm">
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
                  <input type="checkbox" className="sr-only peer" checked={emailNotifications} onChange={(e) => { setEmailNotifications(e.target.checked); saveSetting("emailNotifications", e.target.checked); }} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Display Settings */}
          <Card variant="glass" title="Görünüm Ayarları">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50/50 border border-slate-100 transition-colors hover:bg-white hover:shadow-sm">
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
                  <input type="checkbox" className="sr-only peer" checked={compactView} onChange={(e) => { setCompactView(e.target.checked); saveSetting("compactView", e.target.checked); }} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            </div>
          </Card>

          {/* Security */}
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
            <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-3 text-emerald-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-sm font-medium">Hesabınız güvende. Son şifre değişikliği: 30 gün önce</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}