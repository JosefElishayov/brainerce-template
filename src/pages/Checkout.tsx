import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle } from "lucide-react";
import { formatPrice, getCartTotals, getCartItemName, getCartItemImage } from "brainerce";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";

const Checkout = () => {
  const { cart, currency } = useStore();

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">No Items to Checkout</h1>
          <p className="text-muted-foreground mb-8">Your bag is empty.</p>
          <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
            <Link to="/products">Start Shopping <ArrowRight className="ml-3 w-4 h-4" /></Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isServerCart = "id" in cart;
  const totals = isServerCart ? getCartTotals(cart) : null;

  return (
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/cart" className="hover:text-foreground">Your Bag</Link>
          <span className="text-border">/</span>
          <span className="text-foreground">Checkout</span>
        </div>
      </div>

      <div className="bg-primary/5 border-b border-primary/10">
        <div className="container-full py-4 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 text-primary" />
          <p><span className="font-medium">Checkout coming soon.</span> <span className="text-muted-foreground">Full Brainerce checkout flow will be wired up next.</span></p>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="font-serif text-4xl md:text-5xl mb-12">
            Checkout
          </motion.h1>

          <div className="bg-linen p-8 max-w-2xl">
            <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
            <div className="space-y-4 mb-6">
              {cart.items.map((item) => {
                const name = getCartItemName(item);
                const image = getCartItemImage(item);
                const lineTotal = parseFloat(item.unitPrice) * item.quantity;
                return (
                  <div key={`${item.product.id}-${item.variant?.id ?? "_"}`} className="flex gap-4">
                    <div className="w-16 h-20 bg-muted/30 overflow-hidden">
                      {image ? <img src={image} alt={name} className="w-full h-full object-cover" /> : null}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                      <p className="text-sm mt-1">{formatPrice(String(lineTotal), { currency })}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {totals && (
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatPrice(String(totals.subtotal), { currency })}</span>
                </div>
                <div className="flex justify-between font-serif text-xl border-t border-border pt-4">
                  <span>Total</span>
                  <span>{formatPrice(String(totals.total), { currency })}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Checkout;
