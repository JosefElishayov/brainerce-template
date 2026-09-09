import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PublicNewsletterBenefitOffer } from "brainerce";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";
import { useStore } from "@/contexts/StoreContext";
import { Input } from "@/components/ui/input";

export const NewsletterSignup = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { currency, track } = useStore();
  const [offer, setOffer] = useState<PublicNewsletterBenefitOffer | null>(null);
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client.marketing
      .getBenefit(locale)
      .then((o) => setOffer(o && o.enabled ? o : null))
      .catch(() => setOffer(null));
  }, [locale]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await client.marketing.subscribe({
        email: email.trim(),
        locale,
        source: "footer",
        honeypot,
      });
      setDone(true);
      setEmail("");
      track("sign_up");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("newsletter.error"));
    } finally {
      setBusy(false);
    }
  }

  const incentive = offer
    ? offer.headline ||
      (offer.discountType === "PERCENTAGE"
        ? t("newsletter.percentOffer", { value: offer.discountValue })
        : t("newsletter.amountOffer", { value: `${offer.discountValue} ${currency}` }))
    : null;

  return (
    <div className="max-w-sm w-full">
      <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-background/40 mb-3">
        {t("newsletter.title")}
      </p>
      {incentive && <p className="text-sm font-medium text-background mb-2">{incentive}</p>}
      <p className="text-sm text-background/60 leading-relaxed mb-4">
        {offer?.terms || t("newsletter.subtitle")}
      </p>
      {done ? (
        <p className="text-sm text-background">{t("newsletter.checkInbox")}</p>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <div className="flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.emailPlaceholder")}
              aria-label={t("newsletter.emailPlaceholder")}
              className="rounded-none h-12 bg-transparent border-background/25 text-background placeholder:text-background/40"
            />
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 h-12 px-5 text-xs font-medium tracking-[0.2em] uppercase bg-background text-foreground hover:bg-background/90 transition-colors disabled:opacity-60"
            >
              {busy ? t("common.sending") : t("newsletter.join")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
          />
          {offer?.firstOrderOnly && (
            <p className="text-[11px] text-background/40">{t("newsletter.firstOrderOnly")}</p>
          )}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </form>
      )}
    </div>
  );
};
