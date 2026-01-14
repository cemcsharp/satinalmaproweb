import { prisma } from "./db";

export interface SystemSettings {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    supportPhone: string;
    currency: string;
    timezone: string;
}

export const defaultSettings: SystemSettings = {
    siteName: "SatınalmaPRO",
    siteDescription: "B2B Satınalma Platformu",
    supportEmail: "destek@satinalmapro.com",
    supportPhone: "+90 212 000 00 00",
    currency: "TRY",
    timezone: "Europe/Istanbul"
};

/**
 * Veritabanından sistem ayarlarını çeker ve varsayılanlarla birleştirir.
 * Sunucu tarafında (Server Components, API Routes) kullanılır.
 */
export async function getSystemSettings(): Promise<SystemSettings> {
    try {
        const settings = await prisma.systemSetting.findMany();

        const settingsMap: any = { ...defaultSettings };

        settings.forEach(s => {
            if (s.value) {
                settingsMap[s.key] = s.value;
            }
        });

        return settingsMap as SystemSettings;
    } catch (error) {
        console.error("Failed to fetch system settings:", error);
        return defaultSettings;
    }
}
