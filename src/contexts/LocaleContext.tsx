import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { client, LOCALE_STORAGE_KEY } from "@/lib/brainerce";
import { getDirectionForLocale } from "brainerce";
import { syncI18nLocale } from "@/i18n";

interface LocaleContextValue {
  locale: string;
  supportedLocales: string[];
  direction: "ltr" | "rtl";
  setLocale: (locale: string) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const SUPPORTED = ["en", "he"];

function getLocaleFromPath(): string {
  if (typeof window === "undefined") return "en";
  const first = window.location.pathname.split("/").filter(Boolean)[0];
  return first && SUPPORTED.includes(first) ? first : "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  // URL is the source of truth — read prefix injected by App's basename logic
  const [locale] = useState<string>(() => {
    const fromUrl = getLocaleFromPath();
    // Sync SDK + storage on bootstrap so all data fetching uses the URL locale
    client.setLocale(fromUrl);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALE_STORAGE_KEY, fromUrl);
    }
    return fromUrl;
  });
  const [supportedLocales, setSupportedLocales] = useState<string[]>(SUPPORTED);

  useEffect(() => {
    client
      .getSupportedLocales()
      .then((locales) => {
        const merged = new Set<string>(locales);
        SUPPORTED.forEach((l) => merged.add(l));
        setSupportedLocales(Array.from(merged));
      })
      .catch(() => setSupportedLocales(SUPPORTED));
  }, []);

  const direction = getDirectionForLocale(locale);

  // Apply <html dir> + lang whenever locale changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    syncI18nLocale(locale);
  }, [locale, direction]);

  const setLocale = useCallback((next: string) => {
    if (next === locale) return;
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCALE_STORAGE_KEY, next);

    // Replace the first path segment (the language) with the new one.
    // Note: window.location.pathname includes the basename — strip the old lang.
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments[0] && SUPPORTED.includes(segments[0])) {
      segments[0] = next;
    } else {
      segments.unshift(next);
    }
    const newPath = "/" + segments.join("/") + window.location.search + window.location.hash;
    // Hard reload so all data refetches in the new locale and basename resets cleanly
    window.location.href = newPath;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, supportedLocales, direction, setLocale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
