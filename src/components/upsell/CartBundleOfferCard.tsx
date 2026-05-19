import { useState } from "react";
import type { CartBundleOffer, Product, ProductVariant } from "brainerce";
import { formatPrice, getVariantOptions } from "brainerce";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStore } from "@/contexts/StoreContext";
import { useLocale } from "@/contexts/LocaleContext";
import { client } from "@/lib/brainerce";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type LoadedProduct = { product: Product; selectedVariantId: string };

export const CartBundleOfferCard = ({ bundle }: { bundle: CartBundleOffer }) => {
  const { cart, currency, refreshCart } = useStore();
  const { locale } = useLocale();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [variableProducts, setVariableProducts] = useState<LoadedProduct[]>([]);

  if (!cart || !("id" in cart)) return null;
  if (!bundle.offeredProducts.length) return null;

  const submit = async (selections?: Record<string, string>) => {
    try {
      setBusy(true);
      await client.addBundleToCart(cart.id, bundle.id, selections);
      await refreshCart();
      setOpen(false);
      toast({ title: t("cart.bundleAdded", "Bundle added"), description: bundle.name });
    } catch (err) {
      toast({
        title: t("cart.couldNotAddBundle", "Could not add bundle"),
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const onAddClick = async () => {
    const variableOffered = bundle.offeredProducts.filter((p) => p.type === "VARIABLE");
    if (variableOffered.length === 0) {
      await submit();
      return;
    }
    try {
      setBusy(true);
      const loaded = await Promise.all(
        variableOffered.map(async (p) => {
          const product = await client.getProduct(p.id);
          const firstVariantId = product.variants?.[0]?.id ?? "";
          return { product, selectedVariantId: firstVariantId };
        }),
      );
      setVariableProducts(loaded);
      setOpen(true);
    } catch (err) {
      toast({
        title: t("cart.couldNotAddBundle", "Could not add bundle"),
        description: err instanceof Error ? err.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmSelections = async () => {
    const selections: Record<string, string> = {};
    for (const lp of variableProducts) {
      if (!lp.selectedVariantId) {
        toast({
          title: t("productDetail.missingSelection", "Selection required"),
          description: lp.product.name,
          variant: "destructive",
        });
        return;
      }
      selections[lp.product.id] = lp.selectedVariantId;
    }
    await submit(selections);
  };

  const updateSelection = (productId: string, variantId: string) => {
    setVariableProducts((prev) =>
      prev.map((lp) => (lp.product.id === productId ? { ...lp, selectedVariantId: variantId } : lp)),
    );
  };

  return (
    <>
      <div className="border border-primary/30 bg-linen p-5 mb-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.25em] uppercase text-primary mb-2">
          <Package className="w-3.5 h-3.5" /> {t("cart.bundleOffer", "Bundle Offer")}
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
          <span className="text-muted-foreground">{t("cart.bundleTotal", "Bundle total")}</span>
          <span>
            <span className="line-through text-muted-foreground mr-2">
              {formatPrice(bundle.totalOriginalPrice, { currency })}
            </span>
            <span className="font-medium">{formatPrice(bundle.totalDiscountedPrice, { currency })}</span>
          </span>
        </div>
        <Button
          onClick={onAddClick}
          disabled={busy}
          className="w-full rounded-none py-5 text-xs tracking-[0.15em] uppercase btn-premium"
        >
          {busy ? t("common.loading", "Loading…") : t("cart.addBundle", "Add Bundle")}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {t("cart.selectBundleOptions", "Select options")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-2">
            {variableProducts.map((lp) => {
              const attrNames = Array.from(
                new Set((lp.product.variants ?? []).flatMap((v) => getVariantOptions(v).map((o) => o.name))),
              );
              return (
                <div key={lp.product.id}>
                  <p className="text-sm font-medium mb-3">{lp.product.name}</p>
                  {attrNames.map((attrName) => {
                    const values = Array.from(
                      new Set(
                        (lp.product.variants ?? []).flatMap((v) =>
                          getVariantOptions(v).filter((o) => o.name === attrName).map((o) => o.value),
                        ),
                      ),
                    );
                    const current = lp.product.variants?.find((v) => v.id === lp.selectedVariantId);
                    const currentValue = current
                      ? getVariantOptions(current).find((o) => o.name === attrName)?.value
                      : undefined;
                    return (
                      <div key={attrName} className="mb-3">
                        <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-2">
                          {attrName}: {currentValue}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {values.map((value) => {
                            const selected = currentValue === value;
                            const onSelect = () => {
                              const match = lp.product.variants?.find((v: ProductVariant) =>
                                getVariantOptions(v).some((o) => o.name === attrName && o.value === value),
                              );
                              if (match) updateSelection(lp.product.id, match.id);
                            };
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={onSelect}
                                className={cn(
                                  "px-3 py-1.5 text-xs border transition-colors",
                                  selected
                                    ? "border-foreground bg-foreground text-background"
                                    : "border-border hover:border-foreground",
                                )}
                              >
                                {value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              onClick={confirmSelections}
              disabled={busy}
              className="w-full rounded-none py-5 text-xs tracking-[0.15em] uppercase btn-premium"
            >
              {busy ? t("common.loading", "Loading…") : t("cart.addBundle", "Add Bundle")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
