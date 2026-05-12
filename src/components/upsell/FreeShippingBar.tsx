import { useStore } from "@/contexts/StoreContext";
import { formatPrice, getCartTotals } from "brainerce";
import { Truck } from "lucide-react";

export const FreeShippingBar = () => {
  const { cart, currency, storeInfo } = useStore();
  const upsell = (storeInfo as unknown as { upsell?: { freeShippingBarEnabled?: boolean; freeShippingThreshold?: number } })?.upsell;
  if (!cart || !("id" in cart)) return null;
  if (upsell?.freeShippingBarEnabled === false) return null;
  const threshold = upsell?.freeShippingThreshold;
  if (!threshold || threshold <= 0) return null;

  const totals = getCartTotals(cart);
  const subtotal = totals.subtotal;
  const remaining = Math.max(0, threshold - subtotal);
  const pct = Math.min(100, (subtotal / threshold) * 100);
  const qualified = remaining <= 0;

  return (
    <div className="bg-linen p-5 mb-8">
      <div className="flex items-center gap-3 mb-3">
        <Truck className="w-4 h-4 text-primary" />
        <p className="text-sm">
          {qualified ? (
            <span className="font-medium">You've unlocked free shipping!</span>
          ) : (
            <>
              You're <span className="font-medium">{formatPrice(String(remaining), { currency })}</span> away from free shipping.
            </>
          )}
        </p>
      </div>
      <div className="h-1 bg-border overflow-hidden">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
