import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, Trash2 } from "lucide-react";
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

const Cart = () => {
  const navigate = useNavigate();
  const { cart, currency, storeInfo, updateQuantity, removeFromCart } = useStore();

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground/30" />
          <h1 className="font-serif text-4xl mb-4">Your Bag is Empty</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">Discover our curated collection.</p>
          <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
            <Link to="/products">Start Shopping <ArrowRight className="ml-3 w-4 h-4" /></Link>
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
          <Link to="/products" className="hover:text-foreground">Shop</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">Your Bag</span>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <h1 className="font-serif text-4xl md:text-5xl mb-8">Your Bag</h1>
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
                <ArrowRight className="w-4 h-4 rotate-180" /> Continue Shopping
              </Link>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-linen p-8 lg:sticky lg:top-28">
                <h2 className="font-serif text-2xl mb-8">Order Summary</h2>
                {totals ? (
                  <>
                    <div className="space-y-4 mb-8">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(String(totals.subtotal), { currency })}</span>
                      </div>
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Discount</span>
                          <span>-{formatPrice(String(totals.discount), { currency })}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shipping</span>
                        <span>Calculated at checkout</span>
                      </div>
                    </div>
                    <div className="border-t border-border pt-4 mb-8">
                      <div className="flex justify-between font-serif text-xl">
                        <span>Total</span>
                        <span>{formatPrice(String(totals.total), { currency })}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mb-8">Sign in or proceed to checkout for full pricing.</p>
                )}
                <Button onClick={() => navigate("/checkout")} size="lg"
                  className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium">
                  Proceed to Checkout <ArrowRight className="ml-3 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {recommendations.length > 0 && (
        <RecommendationSection
          eyebrow="Curated For You"
          title="You Might Also Love"
          items={recommendations}
        />
      )}
    </Layout>
  );
};

export default Cart;
