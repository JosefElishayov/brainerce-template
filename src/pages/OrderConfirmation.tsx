import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const OrderConfirmation = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const checkoutId = params.get("checkout_id");
  const { refreshCart } = useStore();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    if (!checkoutId) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        const checkout = await client.getCheckout(checkoutId);
        if (cancelled) return;
        if (checkout.status === "COMPLETED") {
          setStatus("ok");
          refreshCart();
          return;
        }
      } catch {
        /* keep polling */
      }
      attempts += 1;
      if (attempts < 20) setTimeout(poll, 1500);
      else if (!cancelled) setStatus("error");
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [checkoutId, refreshCart]);

  return (
    <Layout>
      <SEO title="Order Confirmed — Maison" description="Thank you for your Maison order. View your confirmation details and next steps for delivery." path="/order-confirmation" noIndex />
      <div className="container-narrow py-28 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-muted-foreground" />
            <h1 className="font-serif text-3xl mb-2">{t("orderConfirmation.confirming")}</h1>
            <p className="text-muted-foreground">{t("orderConfirmation.moment")}</p>
          </>
        )}
        {status === "ok" && (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto mb-6 text-primary" />
            <h1 className="font-serif text-4xl mb-3">{t("orderConfirmation.thankYou")}</h1>
            <p className="text-muted-foreground mb-8">{t("orderConfirmation.placed")}</p>
            <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              <Link to="/products">{t("orderConfirmation.continueShopping")}</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-serif text-3xl mb-3">{t("orderConfirmation.errorTitle")}</h1>
            <p className="text-muted-foreground mb-8">
              {t("orderConfirmation.errorHint")}
            </p>
            <Button asChild className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              <Link to="/">{t("orderConfirmation.backHome")}</Link>
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
