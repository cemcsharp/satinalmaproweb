"use client";
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import trTranslations from "@/locales/tr.json";
import enTranslations from "@/locales/en.json";

type Locale = "tr" | "en";
type Translations = typeof trTranslations;

type I18nContextType = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
};

const translations: Record<Locale, Translations> = {
    tr: trTranslations,
    en: enTranslations,
};

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>("tr");

    useEffect(() => {
        const stored = localStorage.getItem("locale") as Locale | null;
        if (stored && (stored === "tr" || stored === "en")) {
            setLocaleState(stored);
        }
    }, []);

    const setLocale = useCallback((newLocale: Locale) => {
        setLocaleState(newLocale);
        localStorage.setItem("locale", newLocale);
        document.documentElement.lang = newLocale;
    }, []);

    const t = useCallback((key: string): string => {
        const keys = key.split(".");
        let result: any = translations[locale];

        for (const k of keys) {
            if (result && typeof result === "object") {
                result = result[k];
            } else {
                return key; // Return key if not found
            }
        }

        return typeof result === "string" ? result : key;
    }, [locale]);

    return (
        <I18nContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (!context) {
        throw new Error("useI18n must be used within I18nProvider");
    }
    return context;
}

// Language Switcher Component
export function LanguageSwitcher() {
    const { locale, setLocale } = useI18n();

    return (
        <button
            onClick={() => setLocale(locale === "tr" ? "en" : "tr")}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title={locale === "tr" ? "Switch to English" : "Türkçe'ye geç"}
        >
            <span className="text-base">{locale === "tr" ? "🇹🇷" : "🇬🇧"}</span>
            <span className="uppercase">{locale}</span>
        </button>
    );
}
