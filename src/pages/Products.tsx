import { useEffect, useMemo, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import type { Product } from "brainerce";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { client } from "@/lib/brainerce";
import { cn } from "@/lib/utils";

interface Category { id: string; name: string; image?: string | null }

type SortOption = "featured" | "newest" | "price-asc" | "price-desc" | "name-asc";
const sortOptions: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name-asc", label: "Alphabetical A-Z" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get("category") || "all";
  const activeSort = (searchParams.get("sort") as SortOption) || "featured";
  const saleOnly = searchParams.get("sale") === "true";

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    client.getCategories().then(r => setCategories((r?.categories || []) as Category[])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params: Record<string, unknown> = { page: 1, limit: 48 };
    if (activeCategory !== "all") params.categories = [activeCategory];
    if (saleOnly) params.metafields = { sale: ["true"] };
    if (activeSort === "price-asc") { params.sortBy = "price"; params.sortOrder = "asc"; }
    if (activeSort === "price-desc") { params.sortBy = "price"; params.sortOrder = "desc"; }
    if (activeSort === "name-asc") { params.sortBy = "name"; params.sortOrder = "asc"; }
    if (activeSort === "newest") { params.sortBy = "createdAt"; params.sortOrder = "desc"; }
    client.getProducts(params)
      .then(r => setProducts(r.data))
      .catch(e => setError(e instanceof Error ? e.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, [activeCategory, activeSort, saleOnly]);

  const currentCategory = useMemo(
    () => (activeCategory !== "all" ? categories.find(c => c.id === activeCategory) : null),
    [activeCategory, categories]
  );

  const handleFilterChange = (id: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (id === "all") newParams.delete("category");
    else newParams.set("category", id);
    setSearchParams(newParams);
  };

  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "featured") newParams.delete("sort");
    else newParams.set("sort", value);
    setSearchParams(newParams);
  };

  return (
    <Layout>
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
          alt={currentCategory?.name || "All Products"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/20 to-charcoal/10" />
        <div className="relative container-full h-full flex flex-col justify-end pb-12 md:pb-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-white/50 mb-3">
              {saleOnly ? "Special Offers" : currentCategory ? "Collection" : "Shop"}
            </p>
            <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-white leading-[0.95]">
              {saleOnly ? "Sale" : currentCategory?.name || "All Pieces"}
            </h1>
          </motion.div>
        </div>
      </section>

      <section className="py-5 border-b border-border sticky top-16 md:top-20 bg-background/95 backdrop-blur-md z-40">
        <div className="container-full">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 -mb-2 md:mb-0 scrollbar-hide">
              <Button
                variant="ghost" size="sm"
                onClick={() => handleFilterChange("all")}
                className={cn(
                  "rounded-none px-5 whitespace-nowrap text-xs tracking-[0.1em] uppercase",
                  activeCategory === "all" ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background" : "hover:bg-accent",
                )}
              >
                All
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id} variant="ghost" size="sm"
                  onClick={() => handleFilterChange(c.id)}
                  className={cn(
                    "rounded-none px-5 whitespace-nowrap text-xs tracking-[0.1em] uppercase",
                    activeCategory === c.id ? "bg-foreground text-background hover:bg-foreground/90 hover:text-background" : "hover:bg-accent",
                  )}
                >
                  {c.name}
                </Button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground tracking-[0.1em] uppercase">Sort by</span>
              <Select value={activeSort} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] rounded-none text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20">
        <div className="container-full">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] bg-muted/40 animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="text-center py-28 text-destructive">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-28">
              <p className="font-serif text-2xl text-muted-foreground mb-4">No pieces found</p>
              <Button asChild variant="outline" className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
                <Link to="/products">View All Pieces</Link>
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-10">{products.length} {products.length === 1 ? "piece" : "pieces"}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-10">
                {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
              </div>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Products;
