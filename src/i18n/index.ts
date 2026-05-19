import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import he from "./locales/he";

const STORAGE_KEY = "storeLocale";

function detectInitialLocale(): string {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored.toLowerCase().startsWith("he") ? "he" : "en";
  const nav = navigator.language?.toLowerCase() || "en";
  return nav.startsWith("he") ? "he" : "en";
}

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      he: { translation: he },
    },
    lng: detectInitialLocale(),
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export function syncI18nLocale(locale: string | undefined) {
  if (!locale) return;
  const code = locale.toLowerCase().startsWith("he") ? "he" : "en";
  if (i18n.language !== code) void i18n.changeLanguage(code);
}

export default i18n;
