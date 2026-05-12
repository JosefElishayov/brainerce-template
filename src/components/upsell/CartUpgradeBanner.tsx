import { Link } from "react-router-dom";
import type { CartUpgradeSuggestion } from "brainerce";
import { formatPrice } from "brainerce";
import { Sparkles, ArrowRight } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";

export const CartUpgradeBanner = ({ upgrade }: { upgrade: CartUpgradeSuggestion }) => {
  const { currency } = useStore();
  const { targetProduct, priceDelta } = upgrade;
  const image = targetProduct.images?.[0]?.url;
  return (
    <Link
      to={`/product/${targetProduct.slug}`}
      className="mt-3 flex items-center gap-3 p-3 bg-linen border border-primary/20 hover:border-primary transition-colors group"
    >
      {image && <img src={image} alt={targetProduct.name} className="w-12 h-14 object-cover" />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary mb-1">
          <Sparkles className="w-3 h-3" /> Upgrade
        </div>
        <p className="text-sm truncate">
          Upgrade to <span className="font-medium">{targetProduct.name}</span> for{" "}
          +{formatPrice(String(priceDelta), { currency })}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
  );
};
