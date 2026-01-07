"use client";
import { useEffect, useState } from "react";

// A lightweight localStorage-backed state hook for client components.
// - Reads initial value from localStorage on mount
// - Persists updates to localStorage
// - Safe in Next.js (runs only on client)
export default function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      const raw = window.localStorage.getItem(key);
      if (raw != null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore read errors
    }
     
  }, [key]);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors
    }
  }, [key, value]);

  return [value, setValue] as const;
}