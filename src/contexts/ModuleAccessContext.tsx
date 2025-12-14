"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

type ModuleStatus = Record<string, boolean>; // moduleKey -> enabled

type ModuleAccessState = {
    modules: { key: string; label: string }[];
    status: ModuleStatus;
    loading: boolean;
    refresh: () => Promise<void>;
    isModuleEnabled: (moduleKey: string) => boolean;
};

const ModuleAccessContext = createContext<ModuleAccessState | null>(null);

export function ModuleAccessProvider({ children }: { children: ReactNode }) {
    const [modules, setModules] = useState<{ key: string; label: string }[]>([]);
    const [status, setStatus] = useState<ModuleStatus>({});
    const [loading, setLoading] = useState(true);

    const loadAccess = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/ayarlar/modul-erisim", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setModules(data.modules || []);
                // Extract only enabled status
                const statusMap: ModuleStatus = {};
                for (const mod of data.modules || []) {
                    statusMap[mod.key] = data.access?.[mod.key]?.enabled ?? true;
                }
                setStatus(statusMap);
            }
        } catch (e) {
            console.error("Module access load error:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    // Load module access on mount (only if logged in)
    useEffect(() => {
        const loadData = async () => {
            try {
                const sessionRes = await fetch("/api/auth/session");
                if (sessionRes.ok) {
                    const session = await sessionRes.json();
                    if (session?.user) {
                        await loadAccess();
                    } else {
                        setLoading(false);
                    }
                } else {
                    setLoading(false);
                }
            } catch (e) {
                console.error("Session/module load error:", e);
                setLoading(false);
            }
        };
        loadData();
    }, [loadAccess]);

    const isModuleEnabled = useCallback((moduleKey: string): boolean => {
        // Modül tanımlı değilse varsayılan olarak aktif
        return status[moduleKey] ?? true;
    }, [status]);

    return (
        <ModuleAccessContext.Provider
            value={{
                modules,
                status,
                loading,
                refresh: loadAccess,
                isModuleEnabled,
            }}
        >
            {children}
        </ModuleAccessContext.Provider>
    );
}

export function useModuleAccess() {
    const context = useContext(ModuleAccessContext);
    if (!context) {
        throw new Error("useModuleAccess must be used within ModuleAccessProvider");
    }
    return context;
}

// HOC for conditional rendering based on module enabled status
export function withModuleAccess<P extends object>(
    Component: React.ComponentType<P>,
    moduleKey: string
) {
    return function WrappedComponent(props: P) {
        const { isModuleEnabled, loading } = useModuleAccess();

        if (loading) return null;
        if (!isModuleEnabled(moduleKey)) return null;

        return <Component {...props} />;
    };
}
