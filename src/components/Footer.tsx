import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/contexts/StoreContext";
import { client } from "@/lib/brainerce";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
}

export const Footer = () => {
  const { storeInfo } = useStore();
  const brandName = storeInfo?.name || "Lumeno";
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    client
      .getCategories()
      .then((res) => {
        setCategories(((res?.categories || []) as CategoryItem[]).slice(0, 6));
      })
      .catch(() => setCategories([]));
  }, []);

  return (
    <footer className="bg-foreground text-background">
      <div className="border-b border-background/10">
        <div className="container-full py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <Link to="/" className="font-serif text-3xl md:text-4xl tracking-tight text-background">
                {brandName}
              </Link>
              <p className="mt-3 text-sm text-background/50 leading-relaxed max-w-xs">
                Curated home objects and lifestyle pieces for considered living.
              </p>
            </div>
            <div className="max-w-sm w-full">
              <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-background/40 mb-3">
                Stay Connected
              </p>
              <form className="flex gap-0" onSubmit={(e) => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Your email"
                  className="flex-1 h-12 px-4 text-sm bg-background/5 border border-background/15 text-background placeholder:text-background/30 focus:outline-none focus:border-background/40 transition-colors"
                />
                <button
                  type="submit"
                  className="h-12 px-5 text-sm font-medium bg-background text-foreground hover:bg-background/90 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="container-full py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              Collections
            </h4>
            <ul className="space-y-3">
              {categories.length === 0 ? (
                <li className="text-sm text-background/40">No collections yet</li>
              ) : (
                categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/products?category=${c.slug}`}
                      className="text-sm text-background/60 hover:text-background transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              Explore
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products" className="text-sm text-background/60 hover:text-background transition-colors">
                  Shop All
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-background/60 hover:text-background transition-colors">
                  Our Story
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-sm text-background/60 hover:text-background transition-colors">
                  Shopping Bag
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              Account
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/login" className="text-sm text-background/60 hover:text-background transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-background/60 hover:text-background transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <Link to="/account" className="text-sm text-background/60 hover:text-background transition-colors">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              Help
            </h4>
            <ul className="space-y-3">
              <li className="text-sm text-background/60">Shipping & Returns</li>
              <li className="text-sm text-background/60">Care Guide</li>
              <li className="text-sm text-background/60">FAQ</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="container-full py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/30">
            © {new Date().getFullYear()} {brandName}. All rights reserved.
          </p>
          <div className="flex gap-8">
            <span className="text-xs text-background/30">Powered by Brainerce</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
