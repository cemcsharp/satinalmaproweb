import type { Metadata } from "next";
import Shell from "@/components/Shell";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import Script from "next/script";
import CookieConsent from "@/components/CookieConsent";

import { getSystemSettings, defaultSettings } from "@/lib/settings";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata() {
  const settings = await getSystemSettings();

  return {
    title: {
      default: settings.siteName || defaultSettings.siteName,
      template: `%s | ${settings.siteName || defaultSettings.siteName}`,
    },
    description: settings.siteDescription || defaultSettings.siteDescription,
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: settings.siteName || defaultSettings.siteName,
    },
    icons: {
      icon: "/icons/icon.svg",
      apple: "/icons/icon.svg",
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSystemSettings();

  return (
    <html lang="tr" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Check if we can access storage
                  var storageWorking = false;
                  try {
                    localStorage.setItem('test', 'test');
                    localStorage.removeItem('test');
                    storageWorking = true;
                  } catch(e) {
                    storageWorking = false;
                  }

                  // If storage is broken or denied, polyfill it with memory storage
                  if (!storageWorking) {
                    console.warn('Storage access denied. Switching to in-memory storage polyfill.');
                    
                    function createMemoryStorage() {
                      var store = {};
                      return {
                        getItem: function(key) { return store[key] || null; },
                        setItem: function(key, value) { store[key] = String(value); },
                        removeItem: function(key) { delete store[key]; },
                        clear: function() { store = {}; },
                        key: function(index) { return Object.keys(store)[index] || null; },
                        get length() { return Object.keys(store).length; }
                      };
                    }

                    // Define property to override existing potentially broken generic getters
                    Object.defineProperty(window, 'localStorage', {
                      value: createMemoryStorage(),
                      writable: true
                    });
                    
                    Object.defineProperty(window, 'sessionStorage', {
                       value: createMemoryStorage(),
                       writable: true
                    });

                    // Also silence the specific error if it bubbles up from internal browser code
                    var originalConsoleError = console.error;
                    console.error = function() {
                      if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].includes('Access to storage is not allowed')) return;
                      originalConsoleError.apply(console, arguments);
                    };
                  }
                } catch(e) {
                  console.error('Failed to polyfill storage:', e);
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <a href="#main-content" className="skip-link">İçeriğe atla</a>
        <Providers>
          <Shell settings={settings}>{children}</Shell>
          <CookieConsent />
        </Providers>
      </body>
    </html>
  );
}
