import type { Product, ProductVariant } from "brainerce";
import { getProductPriceInfo } from "brainerce";

/**
 * Returns a display-aware price view of a product. When the product was fetched
 * with `{ regionId }` and the region currency differs from the store currency,
 * the SDK adds `displayPrice` / `displayCurrency` (and a `displaySalePrice`)
 * that already reflect the region's FX overlay. We prefer those when present.
 *
 * Note: checkout still charges in the store currency — display-only.
 */
export function getDisplayPriceInfo(product: Product, fallbackCurrency: string) {
  const info = getProductPriceInfo(product);
  // Type-guarded read of optional display fields (added by SDK with regionId).
  type WithDisplay = {
    displayPrice?: string | number | null;
    displayCurrency?: string | null;
    displaySalePrice?: string | number | null;
  };
  const p = product as unknown as WithDisplay;
  const displayCurrency = p.displayCurrency || fallbackCurrency;
  const displayPrice = p.displayPrice != null ? Number(p.displayPrice) : null;
  const displaySalePrice = p.displaySalePrice != null ? Number(p.displaySalePrice) : null;

  if (displayPrice != null) {
    const effective = displaySalePrice != null && displaySalePrice > 0 ? displaySalePrice : displayPrice;
    const isOnSale = displaySalePrice != null && displaySalePrice > 0 && displaySalePrice < displayPrice;
    return {
      price: effective,
      originalPrice: displayPrice,
      isOnSale,
      discountPercent: isOnSale ? Math.round(((displayPrice - displaySalePrice!) / displayPrice) * 100) : 0,
      currency: displayCurrency,
    };
  }
  return {
    price: info.price,
    originalPrice: info.originalPrice,
    isOnSale: info.isOnSale,
    discountPercent: info.discountPercent,
    currency: fallbackCurrency,
  };
}

export function getDisplayVariantPrice(variant: ProductVariant, fallbackCurrency: string) {
  type WithDisplay = {
    displayPrice?: string | number | null;
    displayCurrency?: string | null;
    displaySalePrice?: string | number | null;
  };
  const v = variant as unknown as WithDisplay;
  if (v.displayPrice != null) {
    const sale = v.displaySalePrice != null ? Number(v.displaySalePrice) : NaN;
    const base = Number(v.displayPrice);
    return {
      price: !isNaN(sale) && sale > 0 ? sale : base,
      originalPrice: base,
      currency: v.displayCurrency || fallbackCurrency,
    };
  }
  return {
    price: variant.salePrice ? Number(variant.salePrice) : Number(variant.price || 0),
    originalPrice: Number(variant.price || 0),
    currency: fallbackCurrency,
  };
}
