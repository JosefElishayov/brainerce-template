import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search as SearchIcon, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { client } from "@/lib/brainerce";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductSuggestion {
  id: string;
  name: string;
  slug?: string | null;
  image?: string | null;
  basePrice?: string;
}

interface CategorySuggestion {
  id: string;
  name: string;
}

export const SearchDialog = ({ open, onOpenChange }: SearchDialogProps) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductSuggestion[]>([]);
  const [categories, setCategories] = useState<CategorySuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setProducts([]);
      setCategories([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setProducts([]);
      setCategories([]);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      client
        .getSearchSuggestions(query.trim())
        .then((res) => {
          setProducts(((res?.products || []) as ProductSuggestion[]).slice(0, 6));
          setCategories(((res?.categories || []) as CategorySuggestion[]).slice(0, 4));
        })
        .catch(() => {
          setProducts([]);
          setCategories([]);
        })
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    onOpenChange(false);
    navigate(`/products?q=${encodeURIComponent(q)}`);
  };

  const goProduct = (p: ProductSuggestion) => {
    onOpenChange(false);
    navigate(p.slug ? `/products/${p.slug}` : `/products?q=${encodeURIComponent(p.name)}`);
  };

  const goCategory = (c: CategorySuggestion) => {
    onOpenChange(false);
    navigate(`/products?category=${c.id}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 rounded-none gap-0 top-[15%] translate-y-0">
        <form onSubmit={submit} className="flex items-center gap-3 border-b border-border px-5 py-4">
          <SearchIcon className="w-5 h-5 text-muted-foreground" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, collections..."
            aria-label="Search products and collections"
            className="flex-1 bg-transparent outline-none text-base placeholder:text-muted-foreground/60"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} aria-label="Clear">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </form>

        <div className="max-h-[60vh] overflow-y-auto">
          {query.trim().length < 2 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">
              Type at least 2 characters to search
            </p>
          ) : loading ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">Searching…</p>
          ) : products.length === 0 && categories.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground text-center">No results found</p>
          ) : (
            <div className="py-2">
              {categories.length > 0 && (
                <div className="px-2 py-2">
                  <p className="px-3 text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground/60 mb-2">
                    Collections
                  </p>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => goCategory(c)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
              {products.length > 0 && (
                <div className="px-2 py-2">
                  <p className="px-3 text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground/60 mb-2">
                    Products
                  </p>
                  {products.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => goProduct(p)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent transition-colors text-left"
                    >
                      {p.image ? (
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-cover" loading="lazy" />
                      ) : (
                        <div className="w-10 h-10 bg-muted" />
                      )}
                      <span className="text-sm">{p.name}</span>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={(e) => submit(e as unknown as React.FormEvent)}
                className="w-full text-center px-5 py-3 text-xs tracking-[0.15em] uppercase border-t border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                View all results for "{query}"
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
