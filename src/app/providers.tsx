"use client";
import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import { ToastProvider } from "@/components/ui/Toast";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ModuleAccessProvider } from "@/contexts/ModuleAccessContext";
import { defaultSWRConfig } from "@/lib/swr";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      <SWRConfig value={defaultSWRConfig}>
        <ThemeProvider>
          <ToastProvider>
            <ModuleAccessProvider>
              {children}
            </ModuleAccessProvider>
          </ToastProvider>
        </ThemeProvider>
      </SWRConfig>
    </SessionProvider>
  );
}