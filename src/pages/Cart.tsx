import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CartWithIncludes } from "brainerce";
import { formatPrice, getCartTotals, getCartItemName, getCartItemImage } from "brainerce";
import { Layout } from "@/components/Layout";
import { QuantitySelector } from "@/components/QuantitySelector";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { FreeShippingBar } from "@/components/upsell/FreeShippingBar";
import { CartUpgradeBanner } from "@/components/upsell/CartUpgradeBanner";
import { CartBundleOfferCard } from "@/components/upsell/CartBundleOfferCard";
import { RecommendationSection } from "@/components/upsell/RecommendationSection";
import { TaxNote } from "@/components/TaxNote";
import { SEO } from "@/components/SEO";

const CART_SEO = (
  <SEO
    title="Your Bag — Maison"
    description="Review the items in your Maison shopping bag, adjust quantities, and continue to secure checkout."
    path="/cart"
    noIndex
  />
);

const Cart = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cart, currency, storeInfo, updateQuantity, removeFromCart } = useStore();

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        {CART_SEO}
        <div className="container-narrow py-28 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
          <h1 className="font-serif text-4xl mb-4">{t("cart.emptyTitle")}</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">{t("cart.emptyHint")}</p>
          <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
            <Link to="/products">{t("cart.startShopping")} <ArrowRight className="ml-3 w-4 h-4" /></Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isServerCart = "id" in cart;
  const totals = isServerCart ? getCartTotals(cart) : null;
  const cartIncludes = cart as CartWithIncludes;
  const upgrades = cartIncludes.upgrades?.upgrades ?? {};
  const bundles = cartIncludes.bundles?.bundles ?? [];
  const recommendations = cartIncludes.recommendations?.recommendations ?? [];
  const upsell = (storeInfo as unknown as { upsell?: Record<string, boolean> })?.upsell;
  const showUpgrades = upsell?.cartUpgradeBannerEnabled !== false;
  const showBundles = upsell?.cartBundleEnabled !== false;

  return (
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground">{t("cart.shop")}</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">{t("cart.yourBag")}</span>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <h1 className="font-serif text-4xl md:text-5xl mb-8">{t("cart.yourBag")}</h1>
          <FreeShippingBar />
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7">
              {cart.items.map((item, index) => {
                const name = getCartItemName(item);
                const image = getCartItemImage(item);
                const lineTotal = parseFloat(item.unitPrice) * item.quantity;
                const upgrade = showUpgrades ? upgrades[item.product.id] : undefined;
                return (
                  <motion.div key={`${item.product.id}-${item.variant?.id ?? "_"}`}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="py-8 border-b border-border">
                    <div className="flex gap-6">
                      <Link to={`/product/${item.product.id}`} className="w-28 h-32 md:w-36 md:h-44 flex-shrink-0 overflow-hidden bg-muted/30">
                        {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : null}
                      </Link>
                      <div className="flex-1 flex flex-col">
                        <div className="flex-1">
                          <Link to={`/product/${item.product.id}`} className="font-serif text-lg md:text-xl hover:text-primary transition-colors">
                            {name}
                          </Link>
                          {item.variant && <p className="text-xs text-muted-foreground mt-1">{item.variant.name}</p>}
                          {item.modifiers && item.modifiers.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {item.modifiers.map((mod) => {
                                const delta = parseFloat(mod.priceDelta);
                                return (
                                  <li key={mod.modifierId} className="text-xs text-muted-foreground flex justify-between gap-3">
                                    <span>+ {mod.name}</span>
                                    <span>
                                      {mod.freeApplied || delta === 0
                                        ? <span className="text-primary">{t("cart.free")}</span>
                                        : `${delta > 0 ? "+" : ""}${formatPrice(String(delta), { currency })}`}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          <p className="font-serif text-lg mt-3">{formatPrice(String(lineTotal), { currency })}</p>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <QuantitySelector quantity={item.quantity}
                            onQuantityChange={(q) => updateQuantity(item.product.id, q, item.variant?.id)} />
                          <button onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                            aria-label={`Remove ${item.product.name} from cart`}
                            className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-5 h-5" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    {upgrade && <CartUpgradeBanner upgrade={upgrade} />}
                  </motion.div>
                );
              })}

              {showBundles && bundles.length > 0 && (
                <div className="mt-8">
                  {bundles.map((b) => <CartBundleOfferCard key={b.id} bundle={b} />)}
                </div>
              )}

              <Link to="/products" className="inline-flex items-center gap-2 mt-8 text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground">
                <ArrowRight className="w-4 h-4 rotate-180" /> {t("cart.continueShopping")}
              </Link>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-linen p-8 lg:sticky lg:top-28">
                <h2 className="font-serif text-2xl mb-8">{t("cart.orderSummary")}</h2>
                {totals ? (
                  <>
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("cart.subtotal")}</span>
                        <span>{formatPrice(String(totals.subtotal), { currency })}</span>
                      </div>
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>{t("cart.discount")}</span>
                          <span>-{formatPrice(String(totals.discount), { currency })}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("cart.shipping")}</span>
                        <span>{t("cart.calculatedAtCheckout")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t("tax.label")}</span>
                        <span>{t("tax.calculatedAtCheckout")}</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 mb-3">
                      <div className="flex justify-between font-serif text-xl">
                        <span>{t("cart.total")}</span>
                        <span>{formatPrice(String(totals.total), { currency })}</span>
                      </div>
                    </div>
                    <TaxNote className="text-xs text-muted-foreground mb-8" />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mb-8">{t("cart.signInNote")}</p>
                )}
                <Button onClick={() => navigate("/checkout")} size="lg"
                  className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium">
                  {t("cart.proceedToCheckout")} <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {recommendations.length > 0 && (
        <RecommendationSection
          eyebrow={t("cart.curatedForYou")}
          title={t("cart.youMightAlsoLove")}
          items={recommendations}
        />
      )}
    </Layout>
  );
};

export default Cart;
