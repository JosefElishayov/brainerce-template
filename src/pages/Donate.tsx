import { useState } from "react";
import { Heart } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const PRESETS = [18, 36, 100, 250];

const Donate = () => {
  const { t } = useTranslation();
  const { currency } = useStore();
  const [amount, setAmount] = useState<string>("36");
  const [coverFees, setCoverFees] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numeric = Number(amount) || 0;
  const feeCover = coverFees ? Math.round(numeric * 0.03 * 100) / 100 : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (numeric <= 0 || !email.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const intent = await client.createDonation({
        amount: numeric,
        feeCoverAmount: feeCover || undefined,
        donorEmail: email.trim(),
        donorName: name.trim() || undefined,
        isAnonymous: anonymous,
        message: message.trim() || undefined,
        returnPath: "/donate/thank-you",
      });
      const redirect = intent.payment?.redirectUrl;
      if (redirect) {
        window.location.href = redirect;
        return;
      }
      setError(t("donate.noPayment"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("donate.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout>
      <SEO
        title={t("donate.seoTitle")}
        description={t("donate.seoDescription")}
        path="/donate"
        alternates={[
          { hrefLang: "en", href: "/en/donate" },
          { hrefLang: "he", href: "/he/donate" },
          { hrefLang: "x-default", href: "/en/donate" },
        ]}
      />
      <section className="py-16 md:py-24">
        <div className="container-narrow max-w-xl">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-4">{t("donate.eyebrow")}</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">{t("donate.title")}</h1>
          <p className="text-muted-foreground leading-relaxed mb-10">{t("donate.subtitle")}</p>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <Label className="text-xs tracking-[0.2em] uppercase">{t("donate.amount")}</Label>
              <div className="grid grid-cols-4 gap-2 mt-2 mb-3">
                {PRESETS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setAmount(String(p))}
                    className={`h-11 border text-sm transition-colors ${
                      amount === String(p) ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <Input
                type="number"
                min={1}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-none h-11"
                aria-label={t("donate.amount")}
              />
              <p className="text-xs text-muted-foreground mt-1">{currency}</p>
            </div>

            <label className="flex items-start gap-3 text-sm cursor-pointer">
              <Checkbox checked={coverFees} onCheckedChange={(v) => setCoverFees(!!v)} className="mt-0.5" />
              <span className="text-muted-foreground">
                {t("donate.coverFees", { amount: `${feeCover.toFixed(2)} ${currency}` })}
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-xs tracking-[0.2em] uppercase">{t("donate.email")}</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-none h-11 mt-2"
                />
              </div>
              <div>
                <Label className="text-xs tracking-[0.2em] uppercase">{t("donate.name")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-none h-11 mt-2" />
              </div>
            </div>

            <label className="flex items-center gap-3 text-sm cursor-pointer">
              <Checkbox checked={anonymous} onCheckedChange={(v) => setAnonymous(!!v)} />
              <span className="text-muted-foreground">{t("donate.anonymous")}</span>
            </label>

            <div>
              <Label className="text-xs tracking-[0.2em] uppercase">{t("donate.message")}</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="rounded-none mt-2"
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={busy || numeric <= 0}
              className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase gap-2"
            >
              <Heart className="w-4 h-4" />
              {busy ? t("common.loading") : t("donate.submit")}
            </Button>
            <p className="text-xs text-muted-foreground">{t("donate.securityNote")}</p>
          </form>
        </div>
      </section>
    </Layout>
  );
};

export default Donate;
