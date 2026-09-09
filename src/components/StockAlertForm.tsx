import { useState } from "react";
import { BellRing } from "lucide-react";
import { useTranslation } from "react-i18next";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  productId: string;
  variantId?: string;
}

export const StockAlertForm = ({ productId, variantId }: Props) => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await client.stockAlerts.subscribe({ email: email.trim(), productId, variantId, locale, honeypot });
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("stockAlert.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="border border-border p-5 mt-4">
      <p className="flex items-center gap-2 text-sm font-medium mb-1">
        <BellRing className="w-4 h-4" />
        {t("stockAlert.title")}
      </p>
      {done ? (
        <p className="text-sm text-muted-foreground mt-2">{t("stockAlert.done")}</p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mb-3">{t("stockAlert.subtitle")}</p>
          <form onSubmit={submit} className="flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("stockAlert.emailPlaceholder")}
              aria-label={t("stockAlert.emailPlaceholder")}
              className="rounded-none h-11"
            />
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
            />
            <Button type="submit" variant="outline" disabled={busy} className="rounded-none px-5 text-xs tracking-widest uppercase">
              {busy ? t("common.sending") : t("stockAlert.notifyMe")}
            </Button>
          </form>
          {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </>
      )}
    </div>
  );
};
