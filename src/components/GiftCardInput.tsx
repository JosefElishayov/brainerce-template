import { useState } from "react";
import { Gift } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "brainerce";
import type { CheckoutTender } from "brainerce";
import { client } from "@/lib/brainerce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  checkoutId?: string | null;
  currency: string;
  onApplied?: () => void;
}

export const GiftCardInput = ({ checkoutId, currency, onApplied }: Props) => {
  const { t } = useTranslation();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<Array<CheckoutTender & { code: string }>>([]);

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    setBusy(true);
    setError(null);
    try {
      if (!checkoutId) {
        // No checkout yet — at least tell the shopper what the card is worth.
        const balance = await client.checkGiftCardBalance(value);
        setError(
          balance.usable
            ? t("giftCard.balanceOnly", { amount: formatPrice(balance.balance, { currency: balance.currency }) })
            : t("giftCard.unusable"),
        );
        return;
      }
      const tender = await client.applyGiftCard(checkoutId, value);
      setApplied((prev) => [...prev, { ...tender, code: value }]);
      setCode("");
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("giftCard.invalid"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(tenderId: string) {
    if (!checkoutId) return;
    setBusy(true);
    try {
      await client.removeGiftCard(checkoutId, tenderId);
      setApplied((prev) => prev.filter((tnd) => tnd.tenderId !== tenderId));
      onApplied?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("giftCard.invalid"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {applied.map((tnd) => (
        <div key={tnd.tenderId} className="flex items-center justify-between text-sm border border-border p-3">
          <span className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            {t("giftCard.applied", {
              code: tnd.code.slice(-4),
              amount: formatPrice(tnd.amountApplied, { currency }),
            })}
          </span>
          <button
            onClick={() => remove(tnd.tenderId)}
            disabled={busy}
            className="text-xs underline text-muted-foreground hover:text-foreground"
          >
            {t("common.remove")}
          </button>
        </div>
      ))}
      <form onSubmit={apply} className="space-y-2">
        <div className="flex gap-2">
          <Input
            placeholder={t("giftCard.placeholder")}
            aria-label={t("giftCard.placeholder")}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-none h-11"
          />
          <Button
            type="submit"
            variant="outline"
            disabled={busy || !code.trim()}
            className="rounded-none px-5 text-xs tracking-widest uppercase"
          >
            {t("common.apply")}
          </Button>
        </div>
        {error && <p className="text-xs text-muted-foreground">{error}</p>}
      </form>
    </div>
  );
};
