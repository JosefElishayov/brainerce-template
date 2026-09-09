import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Content } from "brainerce";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";
import { cn } from "@/lib/utils";

const DISMISS_PREFIX = "announcement-dismissed:";

function isLive(a: Content<"ANNOUNCEMENT">["data"]): boolean {
  const now = Date.now();
  if (a.startsAt && new Date(a.startsAt).getTime() > now) return false;
  if (a.endsAt && new Date(a.endsAt).getTime() < now) return false;
  return true;
}

export const AnnouncementBar = () => {
  const { locale } = useLocale();
  const [items, setItems] = useState<Content<"ANNOUNCEMENT">[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);

  useEffect(() => {
    client.content.announcement
      .list(locale)
      .then((list) => setItems((list || []).filter((c) => c?.data && isLive(c.data))))
      .catch(() => setItems([]));
  }, [locale]);

  const visible = items.filter((c) => !dismissed.includes(c.id) && !localStorage.getItem(DISMISS_PREFIX + c.id));
  if (!visible.length) return null;

  return (
    <div>
      {visible.map((c) => {
        const a = c.data;
        return (
          <div
            key={c.id}
            className={cn(
              "text-center text-xs md:text-sm py-2.5 px-10 relative",
              a.severity === "warning"
                ? "bg-destructive text-destructive-foreground"
                : a.severity === "success"
                  ? "bg-primary text-primary-foreground"
                  : "bg-foreground text-background",
            )}
          >
            <span className="tracking-wide">{a.message}</span>
            {a.ctaLabel && a.ctaHref && (
              <a href={a.ctaHref} className="ms-3 underline underline-offset-4 font-medium">
                {a.ctaLabel}
              </a>
            )}
            {a.dismissible && (
              <button
                aria-label="Dismiss"
                onClick={() => {
                  localStorage.setItem(DISMISS_PREFIX + c.id, "1");
                  setDismissed((d) => [...d, c.id]);
                }}
                className="absolute end-3 top-1/2 -translate-y-1/2 p-1 opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
