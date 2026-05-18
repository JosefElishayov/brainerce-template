import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type { StoreInfo, Cart, CartWithIncludes, Product, ProductVariant, ModifierSelection } from "brainerce";
import { client, isLoggedIn } from "@/lib/brainerce";

interface StoreContextValue {
  storeInfo: StoreInfo | null;
  currency: string;
  cart: CartWithIncludes | Cart | null;
  itemCount: number;
  loggedIn: boolean;
  refreshCart: () => Promise<void>;
  addToCart: (
    product: Product,
    opts?: {
      variant?: ProductVariant | null;
      quantity?: number;
      metadata?: Record<string, unknown>;
      selections?: ModifierSelection[];
    },
  ) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string) => Promise<void>;
  setLoggedIn: (v: boolean) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [cart, setCart] = useState<CartWithIncludes | Cart | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(isLoggedIn());

  useEffect(() => {
    client.getStoreInfo().then(setStoreInfo).catch((e) => console.error("storeInfo", e));
  }, []);

  const refreshCart = useCallback(async () => {
    try {
      const c = await client.smartGetCart({ include: ["recommendations", "upgrades", "bundles"] });
      setCart(c);
    } catch (e) {
      console.error("cart", e);
      setCart(null);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart, loggedIn]);

  const addToCart: StoreContextValue["addToCart"] = useCallback(
    async (product, opts = {}) => {
      const variant = opts.variant ?? null;
      await client.smartAddToCart({
        productId: product.id,
        variantId: variant?.id,
        quantity: opts.quantity ?? 1,
        metadata: opts.metadata,
        selections: opts.selections,
      });
      await refreshCart();
    },
    [refreshCart],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, variantId?: string) => {
      await client.smartUpdateCartItem(productId, quantity, variantId);
      await refreshCart();
    },
    [refreshCart],
  );

  const removeFromCart = useCallback(
    async (productId: string, variantId?: string) => {
      await client.smartRemoveFromCart(productId, variantId);
      await refreshCart();
    },
    [refreshCart],
  );

  const itemCount = cart?.items?.reduce((n, i) => n + i.quantity, 0) ?? 0;
  const currency = storeInfo?.currency || "USD";

  return (
    <StoreContext.Provider
      value={{
        storeInfo,
        currency,
        cart,
        itemCount,
        loggedIn,
        refreshCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        setLoggedIn,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
