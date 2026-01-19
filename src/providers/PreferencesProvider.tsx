"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Preferences {
    compactView: boolean;
    emailEnabled: boolean;
    inAppEnabled: boolean;
}

interface PreferencesContextType {
    preferences: Preferences;
    setPreference: (key: keyof Preferences, value: boolean) => Promise<void>;
    loading: boolean;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { status } = useSession();
    const [preferences, setPreferences] = useState<Preferences>({
        compactView: false,
        emailEnabled: true,
        inAppEnabled: true,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPreferences = async () => {
            if (status !== 'authenticated') {
                setLoading(false);
                return;
            }

            try {
                const res = await fetch('/api/profile/preferences');
                if (res.ok) {
                    const data = await res.json();
                    setPreferences({
                        compactView: data.compactView ?? false,
                        emailEnabled: data.emailEnabled ?? true,
                        inAppEnabled: data.inAppEnabled ?? true,
                    });

                    // Sync with localStorage for quick initial load next time
                    localStorage.setItem('pref_compactView', String(data.compactView ?? false));
                }
            } catch (error) {
                console.error('Preferences fetch failed:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPreferences();
    }, [status]);

    // Initial load from localStorage for zero-layout shift
    useEffect(() => {
        const localCompact = localStorage.getItem('pref_compactView');
        if (localCompact !== null) {
            setPreferences(prev => ({ ...prev, compactView: localCompact === 'true' }));
        }
    }, []);

    const setPreference = async (key: keyof Preferences, value: boolean) => {
        setPreferences(prev => ({ ...prev, [key]: value }));

        if (key === 'compactView') {
            localStorage.setItem('pref_compactView', String(value));
        }

        try {
            await fetch('/api/profile/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [key]: value }),
            });
        } catch (error) {
            console.error('Preference update failed:', error);
        }
    };

    return (
        <PreferencesContext.Provider value={{ preferences, setPreference, loading }}>
            {children}
        </PreferencesContext.Provider>
    );
};

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (context === undefined) {
        throw new Error('usePreferences must be used within a PreferencesProvider');
    }
    return context;
};
