import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import type { Product } from "brainerce";
import { formatPrice, getProductPriceInfo } from "brainerce";
import { useStore } from "@/contexts/StoreContext";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  index?: number;
  variant?: "default" | "large";
}

export const ProductCard = ({ product, index = 0, variant = "default" }: ProductCardProps) => {
  const { currency, addToCart } = useStore();
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const images = product.images || [];
  const primary = images[0]?.url || "/placeholder.svg";
  const secondary = images[1]?.url;
  const priceInfo = getProductPriceInfo(product);
  const collectionName = product.categories?.[0]?.name;
  const isVariable = product.type === "VARIABLE";
  const variantPrices = isVariable
    ? (product.variants || [])
        .map((v) => Number(v.price ?? product.basePrice))
        .filter((n) => !isNaN(n) && n > 0)
    : [];
  const minVariantPrice = variantPrices.length ? Math.min(...variantPrices) : null;
  const showFrom = isVariable && minVariantPrice !== null && variantPrices.some((p) => p !== minVariantPrice);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.type === "VARIABLE") {
      // Navigate to PDP for variant selection
      window.location.href = `/product/${product.slug}`;
      return;
    }
    try {
      setAdding(true);
      await addToCart(product, { quantity: 1 });
      toast({ title: "Added to bag", description: product.name });
    } catch (err) {
      toast({
        title: "Could not add to bag",
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7, delay: index * 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="group"
    >
      <Link to={`/product/${product.slug}`} className="block">
        <div
          className={cn(
            "relative overflow-hidden bg-muted/50 mb-5",
            variant === "large" ? "aspect-[3/4]" : "aspect-[4/5]",
          )}
        >
          <img
            src={primary}
            alt={product.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-[1s] ease-out",
              secondary ? "group-hover:opacity-0 group-hover:scale-105" : "group-hover:scale-105",
            )}
          />
          {secondary && (
            <img
              src={secondary}
              alt={`${product.name} - alternate`}
              className="absolute inset-0 w-full h-full object-cover opacity-0 scale-105 transition-all duration-[1s] ease-out group-hover:opacity-100 group-hover:scale-100"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

          {priceInfo.isOnSale && (
            <span className="absolute top-5 left-5 px-3 py-1.5 text-[10px] font-semibold tracking-[0.2em] uppercase bg-primary text-primary-foreground">
              -{priceInfo.discountPercent}%
            </span>
          )}

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={adding}
            className={cn(
              "absolute bottom-0 left-0 right-0 flex items-center justify-center pb-6 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 delay-100 disabled:opacity-50",
            )}
          >
            <span className="px-6 py-2.5 text-xs font-medium tracking-[0.15em] uppercase bg-background/95 backdrop-blur-md text-foreground shadow-lg">
              {adding ? "Adding…" : product.type === "VARIABLE" ? "View Details" : "Quick Add"}
            </span>
          </button>
        </div>

        <div className="space-y-2">
          {collectionName && (
            <p className="text-[11px] font-medium tracking-[0.2em] uppercase text-muted-foreground/70 group-hover:text-primary transition-colors">
              {collectionName}
            </p>
          )}
          <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors leading-snug">
            {product.name}
          </h3>
          <div className="flex items-center gap-3 pt-1">
            {priceInfo.isOnSale ? (
              <>
                <p className="text-base font-medium text-primary">
                  {formatPrice(String(priceInfo.price), { currency })}
                </p>
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(String(priceInfo.originalPrice), { currency })}
                </p>
              </>
            ) : (
              <p className="text-base font-medium text-foreground">
                {formatPrice(String(priceInfo.price), { currency })}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
};
