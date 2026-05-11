import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
import type { Product, ProductVariant } from "brainerce";
import {
  formatPrice, getProductPriceInfo, getVariantOptions, getVariantPrice,
  getDescriptionContent, getStockStatus, getProductSwatches,
} from "brainerce";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { QuantitySelector } from "@/components/QuantitySelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";
import { cn } from "@/lib/utils";

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { currency, addToCart } = useStore();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    client.getProductBySlug(slug)
      .then((p) => {
        setProduct(p);
        if (p.type === "VARIABLE" && p.variants?.length) setSelectedVariant(p.variants[0]);
        // related products
        const catId = p.categories?.[0]?.id;
        if (catId) {
          client.getProducts({ categories: [catId], limit: 5 })
            .then(r => setRelated(r.data.filter(x => x.id !== p.id).slice(0, 4)))
            .catch(() => {});
        }
      })
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load product"))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <div className="container-full py-20">
          <div className="grid lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 aspect-[4/5] bg-muted/40 animate-pulse" />
            <div className="lg:col-span-5 space-y-4">
              <div className="h-10 w-3/4 bg-muted/40 animate-pulse" />
              <div className="h-6 w-1/3 bg-muted/40 animate-pulse" />
              <div className="h-32 bg-muted/40 animate-pulse" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">{error || "The piece you're looking for doesn't exist."}</p>
          <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
            <Link to="/products">Browse All Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const images = product.images?.map(i => i.url) || [];
  const variantImage = selectedVariant?.image;
  const displayImage = variantImage
    ? (typeof variantImage === "string" ? variantImage : variantImage.url)
    : images[imgIdx] || images[0] || "/placeholder.svg";

  const priceInfo = getProductPriceInfo(product);
  const displayPrice = selectedVariant
    ? getVariantPrice(selectedVariant, product.basePrice).toString()
    : String(priceInfo.price);

  const collection = product.categories?.[0];
  const description = getDescriptionContent(product);
  const stockStatus = getStockStatus(product.inventory);
  const canPurchase = product.inventory?.canPurchase ?? true;

  // Variant attribute names + swatch metadata (color/image)
  const allOptions = product.variants?.map(v => getVariantOptions(v)) || [];
  const attrNames = [...new Set(allOptions.flatMap(opts => opts.map(o => o.name)))];
  const swatches = getProductSwatches(product);
  const swatchByAttr = new Map(swatches.map(s => [s.attributeName, s]));

  const handleAdd = async () => {
    try {
      setAdding(true);
      await addToCart(product, { quantity: qty, variant: selectedVariant });
      toast({ title: "Added to bag", description: `${qty} × ${product.name}` });
      setQty(1);
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
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/products" className="hover:text-foreground">Shop</Link>
          <span className="text-border">/</span>
          {collection && (
            <>
              <Link to={`/products?category=${collection.id}`} className="hover:text-foreground">{collection.name}</Link>
              <span className="text-border">/</span>
            </>
          )}
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-20">
            <div className="lg:col-span-7 space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden bg-muted/30 group">
                <img src={displayImage} alt={product.name} className="w-full h-full object-cover transition-transform duration-700" />
                {images.length > 1 && !selectedVariant?.image && (
                  <>
                    <button onClick={() => setImgIdx(i => i === 0 ? images.length - 1 : i - 1)}
                      className="absolute left-5 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur-md hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setImgIdx(i => i === images.length - 1 ? 0 : i + 1)}
                      className="absolute right-5 top-1/2 -translate-y-1/2 p-3 bg-background/90 backdrop-blur-md hover:bg-background opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-3">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => { setImgIdx(i); setSelectedVariant(prev => prev?.image ? null : prev); }}
                      className={cn("w-24 h-24 overflow-hidden", i === imgIdx && !selectedVariant?.image ? "ring-2 ring-foreground ring-offset-2" : "opacity-60 hover:opacity-100")}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
              {collection && (
                <Link to={`/products?category=${collection.id}`} className="inline-block text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-5">
                  {collection.name}
                </Link>
              )}
              <h1 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground mb-5 leading-[1.05]">{product.name}</h1>

              <div className="flex items-baseline gap-3 mb-8">
                <p className="text-2xl font-serif text-foreground">{formatPrice(displayPrice, { currency })}</p>
                {priceInfo.isOnSale && !selectedVariant && (
                  <p className="text-base text-muted-foreground line-through">
                    {formatPrice(String(priceInfo.originalPrice), { currency })}
                  </p>
                )}
              </div>

              {stockStatus && (
                <p className="text-sm text-muted-foreground mb-6">{stockStatus}</p>
              )}

              <div className="w-12 h-px bg-border mb-8" />

              {description && (
                <div className="text-muted-foreground leading-[1.8] mb-10">
                  {"html" in description
                    ? <div dangerouslySetInnerHTML={{ __html: description.html }} />
                    : <p>{description.text}</p>}
                </div>
              )}

              {product.type === "VARIABLE" && attrNames.map(attrName => {
                const uniqueValues = [...new Set(allOptions.flatMap(o => o.filter(x => x.name === attrName).map(x => x.value)))];
                const currentValue = selectedVariant ? getVariantOptions(selectedVariant).find(o => o.name === attrName)?.value : undefined;
                const swatchGroup = swatchByAttr.get(attrName);
                const displayType = swatchGroup?.displayType?.toUpperCase() ?? "";
                const findSwatch = (value: string) => swatchGroup?.options.find(o => o.name === value || o.value === value);
                const hasAnyColor = swatchGroup?.options.some(o => o.swatchColor);
                const hasAnyImage = swatchGroup?.options.some(o => o.swatchImageUrl);
                const isColor = displayType.includes("COLOR") || (displayType === "MIXED_SWATCH" && hasAnyColor && !hasAnyImage);
                const isImage = displayType.includes("IMAGE") || (displayType === "MIXED_SWATCH" && hasAnyImage && !hasAnyColor);
                const isMixed = displayType === "MIXED_SWATCH" && hasAnyColor && hasAnyImage;

                return (
                  <div key={attrName} className="mb-6">
                    <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-3">
                      {attrName}: {currentValue}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {uniqueValues.map(value => {
                        const swatch = findSwatch(value);
                        const selected = currentValue === value;
                        const onSelect = () => {
                          const match = product.variants?.find(v => getVariantOptions(v).some(o => o.name === attrName && o.value === value));
                          if (match) setSelectedVariant(match);
                        };

                        if (isColor && swatch?.swatchColor) {
                          return (
                            <button key={value} onClick={onSelect} title={value} aria-label={value}
                              className={cn(
                                "w-10 h-10 rounded-full border transition-all relative",
                                selected ? "border-foreground ring-2 ring-foreground ring-offset-2" : "border-border hover:border-foreground"
                              )}
                              style={swatch.swatchColor2
                                ? { background: `linear-gradient(135deg, ${swatch.swatchColor} 50%, ${swatch.swatchColor2} 50%)` }
                                : { backgroundColor: swatch.swatchColor }} />
                          );
                        }

                        if (isImage && swatch?.swatchImageUrl) {
                          return (
                            <button key={value} onClick={onSelect} title={value} aria-label={value}
                              className={cn(
                                "w-14 h-14 overflow-hidden border transition-all",
                                selected ? "border-foreground ring-2 ring-foreground ring-offset-2" : "border-border hover:border-foreground"
                              )}>
                              <img src={swatch.swatchImageUrl} alt={value} className="w-full h-full object-cover" />
                            </button>
                          );
                        }

                        return (
                          <button key={value} onClick={onSelect}
                            className={cn(
                              "px-4 py-2 text-sm border transition-colors",
                              selected ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                            )}>
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="mb-6">
                <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground block mb-3">Quantity</span>
                <QuantitySelector quantity={qty} onQuantityChange={setQty} />
              </div>

              <Button size="lg" onClick={handleAdd} disabled={adding || !canPurchase}
                className="rounded-none w-full py-6 text-sm tracking-[0.15em] uppercase btn-premium">
                <ShoppingBag className="w-4 h-4 mr-3" />
                {!canPurchase ? "Out of Stock" : adding ? "Adding…" : "Add to Bag"}
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="py-20 md:py-28 bg-linen">
          <div className="container-full">
            <h2 className="font-serif text-3xl md:text-4xl mb-12">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ProductDetail;
