import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import type { DiscountBanner } from "brainerce";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";

const DISMISSED_KEY = "dismissedDiscountBanners";

const getDismissed = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || "[]");
  } catch {
    return [];
  }
};

export const DiscountBanners = () => {
  const { locale } = useLocale();
  const [banners, setBanners] = useState<DiscountBanner[]>([]);
  const [dismissed, setDismissed] = useState<string[]>(() => getDismissed());

  useEffect(() => {
    client
      .getDiscountBanners()
      .then((b) => setBanners(b || []))
      .catch(() => setBanners([]));
  }, [locale]);

  const visible = banners.filter((b) => !dismissed.includes(b.ruleId));
  if (visible.length === 0) return null;

  const dismiss = (ruleId: string) => {
    const next = [...dismissed, ruleId];
    setDismissed(next);
    try {
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="bg-primary text-primary-foreground">
      {visible.map((b) => (
        <div
          key={b.ruleId}
          className="container-full flex items-center justify-center gap-3 py-2 text-[11px] md:text-xs tracking-[0.15em] uppercase relative"
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="text-center font-medium">{b.text}</span>
          <button
            type="button"
            onClick={() => dismiss(b.ruleId)}
            aria-label="Dismiss"
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
