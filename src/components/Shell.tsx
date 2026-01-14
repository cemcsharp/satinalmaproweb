"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";
import GlobalSearch from "./GlobalSearch";
import { SystemSettings, defaultSettings } from "@/lib/settings";

export default function Shell({
  children,
  settings
}: {
  children: React.ReactNode;
  settings?: SystemSettings;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isAuthPage = ["/", "/login", "/register"].includes(pathname) || pathname.startsWith("/portal") || pathname.startsWith("/admin");
  // Public detail logic removed per request
  const userName = session?.user?.name || "Kullanıcı";
  const siteName = settings?.siteName || defaultSettings.siteName;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30">
      <div className="flex h-screen w-screen overflow-hidden">
        <a href="#main-content" className="skip-link">İçeriğe geç</a>

        {/* Sidebar - Full Height */}
        {!isAuthPage && (
          <>
            <div className="hidden md:block">
              <Sidebar settings={settings} />
            </div>
            {sidebarOpen && (
              <>
                <div
                  className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                  onClick={() => setSidebarOpen(false)}
                  aria-hidden="true"
                />
                <div id="mobile-sidebar" className="md:hidden fixed left-0 top-0 bottom-0 z-50 w-72">
                  <Sidebar settings={settings} />
                </div>
              </>
            )}
          </>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Top Navbar */}
          {!isAuthPage && (
            <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
              <nav aria-label="Ana gezinme" className="flex items-center justify-between h-16 px-4 md:px-6">
                {/* Left side - Mobile hamburger */}
                <div className="flex items-center gap-4">
                  {/* Mobile menu button */}
                  <button
                    aria-label="Menüyü aç/kapat"
                    className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all active:scale-95"
                    onClick={() => setSidebarOpen((v) => !v)}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  {/* Breadcrumb or Page Title Area */}
                  <div className="hidden md:block">
                    {/* Removed 'Hoş geldiniz' as requested */}
                  </div>
                </div>

                {/* Center - Search */}
                <div className="flex-1 flex justify-center max-w-xl mx-4">
                  <GlobalSearch />
                </div>

                {/* Right side - Actions */}
                <div className="flex items-center gap-3">
                  {/* Notification Bell */}
                  <NotificationBell />
                </div>
              </nav>
            </header>
          )}

          {/* Mobile Logo Header for Auth Pages Only */}
          {isAuthPage && (
            <header className="md:hidden sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-slate-200/50">
              <nav aria-label="Ana gezinme" className="flex items-center justify-center h-16 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="text-base font-bold text-slate-800">{siteName}</span>
                </div>
              </nav>
            </header>
          )}

          {/* Main Content */}
          <main id="main-content" className="flex-1 p-6 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
