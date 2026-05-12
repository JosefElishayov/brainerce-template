import { useState } from "react";
import { formatPrice } from "brainerce";
import { Plus, Check } from "lucide-react";
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface OrderBump {
  id: string;
  title?: string;
  description?: string;
  originalPrice: string;
  discountedPrice: string;
  requiresVariantSelection?: boolean;
  lockedVariant?: { id: string; name: string };
  bumpProduct: {
    id: string;
    name: string;
    images?: Array<{ url: string }>;
    variants?: Array<{ id: string; name: string }>;
  };
}

export const OrderBumpCard = ({
  bump,
  cartId,
  added,
}: {
  bump: OrderBump;
  cartId: string;
  added: boolean;
}) => {
  const { currency, refreshCart } = useStore();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [variantId, setVariantId] = useState<string>(
    bump.lockedVariant?.id ?? bump.bumpProduct.variants?.[0]?.id ?? "",
  );

  const image = bump.bumpProduct.images?.[0]?.url;
  const onSale = bump.originalPrice !== bump.discountedPrice;

  const toggle = async () => {
    try {
      setBusy(true);
      if (added) {
        await client.removeOrderBump(cartId, bump.id);
      } else {
        const needsVariant = bump.requiresVariantSelection && !bump.lockedVariant;
        await client.addOrderBump(cartId, bump.id, needsVariant ? variantId : undefined);
      }
      await refreshCart();
    } catch (err) {
      toast({
        title: "Could not update add-on",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={cn(
        "border p-4 transition-colors",
        added ? "border-primary bg-primary/5" : "border-border bg-background",
      )}
    >
      <div className="flex gap-4">
        {image && <img src={image} alt={bump.bumpProduct.name} className="w-16 h-20 object-cover" />}
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-primary mb-1">
            Special Offer
          </p>
          <p className="font-medium text-sm mb-1">{bump.title || bump.bumpProduct.name}</p>
          {bump.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{bump.description}</p>
          )}
          <div className="flex items-baseline gap-2 text-sm">
            {onSale && (
              <span className="line-through text-muted-foreground text-xs">
                {formatPrice(bump.originalPrice, { currency })}
              </span>
            )}
            <span className="font-medium">{formatPrice(bump.discountedPrice, { currency })}</span>
          </div>
        </div>
      </div>

      {bump.requiresVariantSelection && !bump.lockedVariant && bump.bumpProduct.variants && (
        <select
          value={variantId}
          onChange={(e) => setVariantId(e.target.value)}
          disabled={added}
          className="mt-3 w-full h-10 border border-border bg-background px-3 text-sm rounded-none"
        >
          {bump.bumpProduct.variants.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      )}

      <button
        onClick={toggle}
        disabled={busy || (bump.requiresVariantSelection && !bump.lockedVariant && !variantId)}
        className={cn(
          "mt-3 w-full flex items-center justify-center gap-2 py-2.5 text-xs tracking-[0.15em] uppercase border transition-colors",
          added
            ? "border-primary bg-primary text-primary-foreground"
            : "border-foreground hover:bg-foreground hover:text-background",
        )}
      >
        {added ? <><Check className="w-3.5 h-3.5" /> Added</> : <><Plus className="w-3.5 h-3.5" /> Add to Order</>}
      </button>
    </div>
  );
};
