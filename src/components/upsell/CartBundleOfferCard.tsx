import { useState } from "react";
import type { CartBundleOffer } from "brainerce";
import { formatPrice } from "brainerce";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/contexts/StoreContext";
import { client } from "@/lib/brainerce";
import { useToast } from "@/hooks/use-toast";

export const CartBundleOfferCard = ({ bundle }: { bundle: CartBundleOffer }) => {
  const { cart, currency, refreshCart } = useStore();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  if (!cart || !("id" in cart)) return null;
  if (!bundle.offeredProducts.length) return null;

  const accept = async () => {
    try {
      setBusy(true);
      await client.addBundleToCart(cart.id, bundle.id);
      await refreshCart();
      toast({ title: "Bundle added", description: bundle.name });
    } catch (err) {
      toast({
        title: "Could not add bundle",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-primary/30 bg-linen p-5 mb-4">
      <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-primary mb-2">
        <Package className="w-3.5 h-3.5" /> Bundle Offer
      </div>
      <h3 className="font-serif text-lg mb-1">{bundle.name}</h3>
      {bundle.description && <p className="text-xs text-muted-foreground mb-4">{bundle.description}</p>}
      <div className="space-y-2 mb-4">
        {bundle.offeredProducts.map((p) => (
          <div key={p.id} className="flex items-center gap-3">
            {p.images?.[0]?.url && (
              <img src={p.images[0].url} alt={p.name} className="w-10 h-12 object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{p.name}</p>
            </div>
            <div className="text-right text-xs">
              <span className="line-through text-muted-foreground mr-2">
                {formatPrice(p.originalPrice, { currency })}
              </span>
              <span className="text-primary font-medium">
                {formatPrice(p.discountedPrice, { currency })}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-muted-foreground">Bundle total</span>
        <span>
          <span className="line-through text-muted-foreground mr-2">
            {formatPrice(bundle.totalOriginalPrice, { currency })}
          </span>
          <span className="font-medium">{formatPrice(bundle.totalDiscountedPrice, { currency })}</span>
        </span>
      </div>
      <Button
        onClick={accept}
        disabled={busy}
        className="w-full rounded-none py-5 text-xs tracking-[0.15em] uppercase btn-premium"
      >
        {busy ? "Adding…" : "Add Bundle"}
      </Button>
    </div>
  );
};
