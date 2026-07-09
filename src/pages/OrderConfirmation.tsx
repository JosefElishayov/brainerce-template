import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice, type Checkout, type CheckoutLineItem } from "brainerce";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const OrderConfirmation = () => {
  const { t, i18n } = useTranslation();
  const [params] = useSearchParams();
  const checkoutId = params.get("checkout_id");
  const { refreshCart } = useStore();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) {
      setStatus("error");
      return;
    }
    let cancelled = false;

    async function run() {
      try {
        const result = await client.waitForOrder(checkoutId, { maxWaitMs: 30000 });
        if (cancelled) return;

        const finalCheckout = await client.getCheckout(checkoutId);
        if (cancelled) return;

        setCheckout(finalCheckout);
        setOrderNumber(result.success ? result.status.orderNumber || null : null);
        setStatus("ok");
        refreshCart();
      } catch (e) {
        console.error("order confirmation", e);
        if (!cancelled) setStatus("error");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [checkoutId, refreshCart]);

  function getItemImage(item: CheckoutLineItem): string | undefined {
    const variantImage =
      typeof item.variant?.image === "string"
        ? item.variant.image
        : item.variant?.image?.url;
    return variantImage || item.product.images?.[0]?.url;
  }

  function getItemName(item: CheckoutLineItem): string {
    return item.variant?.name || item.product.name;
  }

  function formatAddress(address?: Checkout["shippingAddress"] | null) {
    if (!address) return null;
    const parts = [
      `${address.firstName} ${address.lastName}`.trim(),
      address.company,
      address.line1,
      address.line2,
      [address.city, address.region, address.postalCode].filter(Boolean).join(" "),
      getCountryName(address.country, i18n.language),
      address.phone,
    ].filter(Boolean);
    return parts;
  }

  const totals = checkout
    ? checkout.presentment || {
        subtotal: checkout.subtotal,
        discountAmount: checkout.discountAmount,
        shippingAmount: checkout.shippingAmount,
        taxAmount: checkout.taxAmount,
        total: checkout.total,
        currency: checkout.currency,
      }
    : null;

  return (
    <Layout>
      <SEO
        title="Order Confirmed — Maison"
        description="Thank you for your Maison order. View your confirmation details and next steps for delivery."
        path="/order-confirmation"
        noIndex
      />
      <div className="container-narrow py-16 md:py-24">
        {status === "loading" && (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-muted-foreground" />
            <h1 className="font-serif text-3xl mb-2">{t("orderConfirmation.confirming")}</h1>
            <p className="text-muted-foreground">{t("orderConfirmation.moment")}</p>
          </div>
        )}

        {status === "error" && (
          <div className="text-center py-12">
            <h1 className="font-serif text-3xl mb-3">{t("orderConfirmation.errorTitle")}</h1>
            <p className="text-muted-foreground mb-8">{t("orderConfirmation.errorHint")}</p>
            <Button
              asChild
              className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium"
            >
              <Link to="/">{t("orderConfirmation.backHome")}</Link>
            </Button>
          </div>
        )}

        {status === "ok" && checkout && totals && (
          <div className="space-y-10">
            <div className="text-center">
              <CheckCircle2 className="w-14 h-14 mx-auto mb-6 text-primary" />
              <h1 className="font-serif text-4xl md:text-5xl mb-3">
                {t("orderConfirmation.thankYou")}
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                {t("orderConfirmation.placed")}
              </p>
              {orderNumber && (
                <div className="mt-6 inline-flex items-center gap-3 px-5 py-3 border border-border bg-background">
                  <span className="text-sm text-muted-foreground uppercase tracking-[0.1em]">
                    {t("orderConfirmation.orderNumber")}
                  </span>
                  <span className="font-serif text-xl">#{orderNumber}</span>
                </div>
              )}
            </div>

            <div className="bg-linen p-6 md:p-10">
              <h2 className="font-serif text-2xl mb-8">
                {t("orderConfirmation.orderSummary")}
              </h2>

              <div className="space-y-6">
                {checkout.lineItems.map((item) => {
                  const image = getItemImage(item);
                  const name = getItemName(item);
                  const lineTotal = parseFloat(item.unitPrice) * item.quantity;
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 md:gap-6 pb-6 border-b border-border last:border-0 last:pb-0"
                    >
                      <div className="w-20 h-24 md:w-28 md:h-36 flex-shrink-0 overflow-hidden bg-muted/30">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted/50" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <Link
                            to={`/product/${item.product.id}`}
                            className="font-serif text-lg hover:text-primary transition-colors"
                          >
                            {name}
                          </Link>
                          {item.variant?.sku && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.variant.sku}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-sm text-muted-foreground">
                            {t("orderConfirmation.qty")}: {item.quantity}
                          </span>
                          <span className="font-serif text-lg">
                            {formatPrice(String(lineTotal), { currency: totals.currency })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 pt-6 border-t border-border space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("orderConfirmation.subtotal")}</span>
                  <span>{formatPrice(totals.subtotal, { currency: totals.currency })}</span>
                </div>
                {parseFloat(totals.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>{t("orderConfirmation.discount")}</span>
                    <span>-{formatPrice(totals.discountAmount, { currency: totals.currency })}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("orderConfirmation.shipping")}</span>
                  <span>
                    {parseFloat(totals.shippingAmount) === 0
                      ? t("cart.free")
                      : formatPrice(totals.shippingAmount, { currency: totals.currency })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("orderConfirmation.tax")}</span>
                  <span>{formatPrice(totals.taxAmount, { currency: totals.currency })}</span>
                </div>
                <div className="flex justify-between font-serif text-xl pt-4 border-t border-border">
                  <span>{t("orderConfirmation.total")}</span>
                  <span>{formatPrice(totals.total, { currency: totals.currency })}</span>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {checkout.shippingAddress && (
                <div className="border border-border p-6">
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm uppercase tracking-[0.1em]">
                      {t("orderConfirmation.shippingAddress")}
                    </span>
                  </div>
                  <address className="not-italic text-sm leading-relaxed space-y-0.5">
                    {formatAddress(checkout.shippingAddress)?.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </address>
                </div>
              )}
              {checkout.billingAddress && (
                <div className="border border-border p-6">
                  <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm uppercase tracking-[0.1em]">
                      {t("orderConfirmation.billingAddress")}
                    </span>
                  </div>
                  <address className="not-italic text-sm leading-relaxed space-y-0.5">
                    {formatAddress(checkout.billingAddress)?.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </address>
                </div>
              )}
            </div>

            <div className="text-center">
              <Button
                asChild
                size="lg"
                className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium"
              >
                <Link to="/products">{t("orderConfirmation.continueShopping")}</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

function getCountryName(code: string, lang: string): string {
  try {
    const dn = new Intl.DisplayNames([lang || "en"], { type: "region" });
    return dn.of(code) || code;
  } catch {
    return code;
  }
}

export default OrderConfirmation;
