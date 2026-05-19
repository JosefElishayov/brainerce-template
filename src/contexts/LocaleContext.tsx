import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { client, LOCALE_STORAGE_KEY } from "@/lib/brainerce";
import { getDirectionForLocale } from "brainerce";
import { syncI18nLocale } from "@/i18n";

interface LocaleContextValue {
  locale: string | undefined;
  supportedLocales: string[];
  direction: "ltr" | "rtl";
  setLocale: (locale: string) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<string | undefined>(() => client.getLocale());
  const [supportedLocales, setSupportedLocales] = useState<string[]>([]);

  useEffect(() => {
    client
      .getSupportedLocales()
      .then((locales) => {
        setSupportedLocales(locales);
        if (!locale && locales.length > 0) {
          setLocaleState(locales[0]);
        }
      })
      .catch(() => setSupportedLocales([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const direction = getDirectionForLocale(locale);

  // Apply <html dir> + lang whenever locale changes
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale || "";
    document.documentElement.dir = direction;
    syncI18nLocale(locale);
  }, [locale, direction]);

  const setLocale = useCallback((next: string) => {
    if (next === client.getLocale()) return;
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    client.setLocale(next);
    // Hard reload to refetch all translated content cleanly
    window.location.reload();
  }, []);

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
