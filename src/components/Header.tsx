import { Link } from "react-router-dom";
import { User, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CartIcon } from "@/components/CartIcon";
import { useStore } from "@/contexts/StoreContext";
import { client } from "@/lib/brainerce";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export const Header = () => {
  const { storeInfo, loggedIn } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    client
      .getCategories()
      .then((res) => {
        const list = (res?.categories || []) as CategoryItem[];
        setCategories(list.slice(0, 8));
      })
      .catch(() => setCategories([]));
  }, []);

  const brandName = storeInfo?.name || "Lumeno";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-background/80 backdrop-blur-sm border-b border-transparent",
      )}
    >
      <nav className="container-full">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link
            to="/"
            className="font-serif text-2xl md:text-3xl tracking-tight text-foreground hover:text-primary transition-colors duration-300"
          >
            {brandName}
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {categories.length > 0 && (
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground">
                      Collections
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-1 p-4 md:w-[500px] md:grid-cols-2">
                        {categories.map((c) => (
                          <li key={c.id}>
                            <NavigationMenuLink asChild>
                              <Link
                                to={`/products?category=${c.slug}`}
                                className="block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                              >
                                <div className="text-sm font-medium leading-none">{c.name}</div>
                                {c.description && (
                                  <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                    {c.description}
                                  </p>
                                )}
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}

            <Link
              to="/products"
              className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 link-underline"
            >
              Shop All
            </Link>
            <Link
              to="/about"
              className="text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 link-underline"
            >
              About
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={loggedIn ? "/account" : "/login"}
              aria-label={loggedIn ? "My account" : "Sign in"}
              className="p-2 hover:bg-accent transition-colors duration-300 group"
            >
              <User className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
            </Link>
            <CartIcon />
            <button
              className="md:hidden p-2 hover:bg-accent transition-colors duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="py-8 space-y-6">
                {categories.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground/50 px-2 mb-3">
                      Collections
                    </p>
                    {categories.slice(0, 6).map((c) => (
                      <Link
                        key={c.id}
                        to={`/products?category=${c.slug}`}
                        className="block px-2 py-2.5 text-sm hover:bg-accent transition-colors duration-300"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                )}
                <div className="pt-6 border-t border-border space-y-1">
                  {[
                    { to: "/products", label: "Shop All" },
                    { to: "/about", label: "About" },
                    { to: "/cart", label: "Shopping Bag" },
                    { to: loggedIn ? "/account" : "/login", label: loggedIn ? "My Account" : "Sign In" },
                  ].map((link) => (
                    <Link
                      key={link.to + link.label}
                      to={link.to}
                      className="block px-2 py-2.5 text-sm font-medium hover:bg-accent transition-colors duration-300"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
