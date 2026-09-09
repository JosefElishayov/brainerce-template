import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import type {
  StoreInfo,
  Cart,
  CartWithIncludes,
  Product,
  ProductVariant,
  ModifierSelection,
  StoreCapabilities,
  TrackingEventName,
  TrackingEventPayload,
} from "brainerce";
import { client, isLoggedIn } from "@/lib/brainerce";

interface StoreContextValue {
  storeInfo: StoreInfo | null;
  capabilities: StoreCapabilities | null;
  currency: string;
  cart: CartWithIncludes | Cart | null;
  itemCount: number;
  loggedIn: boolean;
  refreshCart: () => Promise<void>;
  track: (name: TrackingEventName, payload?: TrackingEventPayload) => void;
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
  const [capabilities, setCapabilities] = useState<StoreCapabilities | null>(null);
  const [cart, setCart] = useState<CartWithIncludes | Cart | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean>(isLoggedIn());

  useEffect(() => {
    client
      .getStoreInfo()
      .then((info) => {
        setStoreInfo(info);
        // Boot marketing tags (GA4 / GTM / Meta / TikTok) configured in Brainerce
        try {
          client.initTracking(info?.tracking ?? null);
        } catch (e) {
          console.error("initTracking", e);
        }
      })
      .catch((e) => console.error("storeInfo", e));
    client.getStoreCapabilities().then(setCapabilities).catch(() => setCapabilities(null));
  }, []);

  const track = useCallback((name: TrackingEventName, payload?: TrackingEventPayload) => {
    try {
      client.trackMarketingEvent(name, payload);
    } catch {
      /* tracking must never break the storefront */
    }
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
      const quantity = opts.quantity ?? 1;
      await client.smartAddToCart({
        productId: product.id,
        variantId: variant?.id,
        quantity,
        metadata: opts.metadata,
        selections: opts.selections,
      });
      track("add_to_cart", {
        currency: storeInfo?.currency,
        value: Number(variant?.price ?? product.basePrice ?? 0) * quantity,
        items: [
          {
            itemId: product.id,
            itemName: product.name,
            price: Number(variant?.price ?? product.basePrice ?? 0),
            quantity,
          },
        ],
      });
      await refreshCart();
    },
    [refreshCart, track, storeInfo],
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
        capabilities,
        currency,
        cart,
        itemCount,
        loggedIn,
        refreshCart,
        track,
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
