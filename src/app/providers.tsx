"use client";
import { ToastProvider, useToast } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModuleAccessProvider } from "@/contexts/ModuleAccessContext";
import { defaultSWRConfig } from "@/lib/swr";
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { useEffect } from "react";
import LandingProvider from "@/components/landing/LandingProvider";

// Safe SessionProvider wrapper
function SafeSessionProvider({ children }: { children: React.ReactNode }) {
  // In restricted environments, Access to storage might be denied.
  // We can't easily prevent next-auth from trying to access it, but we can suppress the error.
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes("Access to storage is not allowed")) {
        return;
      }
      originalConsoleError.apply(console, args);
    };

    const handler = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes("Access to storage is not allowed")) {
        event.preventDefault();
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => {
      window.removeEventListener("unhandledrejection", handler);
      console.error = originalConsoleError;
    };
  }, []);

  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SafeSessionProvider>
      <SWRConfig value={defaultSWRConfig}>
        <ThemeProvider>
          <ToastProvider>
            <LandingProvider>
              <ModuleAccessProvider>
                {children}
              </ModuleAccessProvider>
            </LandingProvider>
          </ToastProvider>
        </ThemeProvider>
      </SWRConfig>
    </SafeSessionProvider>
  );
}