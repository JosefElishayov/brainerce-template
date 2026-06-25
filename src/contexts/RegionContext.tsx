import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
interface PublicRegion {
  id: string;
  name: string;
  slug: string;
  currency: string;
  countries: string[];
  taxInclusive: boolean;
  isDefault: boolean;
}
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const REGION_STORAGE_KEY = "storeRegionId";

interface RegionContextValue {
  regions: PublicRegion[];
  regionId: string | null;
  region: PublicRegion | null;
  /** Effective currency: region currency override OR store currency. */
  currency: string;
  setRegion: (regionId: string) => void;
  loading: boolean;
}

const RegionContext = createContext<RegionContextValue | null>(null);

export function RegionProvider({ children }: { children: ReactNode }) {
  const { storeInfo } = useStore();
  const [regions, setRegions] = useState<PublicRegion[]>([]);
  const [regionId, setRegionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REGION_STORAGE_KEY);
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Load public regions from the SDK. If the storefront mode doesn't expose
  // regions (e.g. sales-channel-only setup with no regions configured), we
  // silently keep the list empty and the selector hides itself.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    client
      .getStoreRegions()
      .then((res) => {
        if (cancelled) return;
        const list = res?.data ?? [];
        setRegions(list);

        // Resolve initial region: persisted -> auto-detect -> default
        const persisted = regionId && list.find((r) => r.id === regionId);
        if (persisted) {
          setLoading(false);
          return;
        }
        const finalize = (id: string | null) => {
          if (cancelled) return;
          setRegionId(id);
          if (typeof window !== "undefined") {
            if (id) localStorage.setItem(REGION_STORAGE_KEY, id);
            else localStorage.removeItem(REGION_STORAGE_KEY);
          }
          setLoading(false);
        };
        client
          .getAutoRegion()
          .then((auto) => finalize(auto?.region?.id ?? list.find((r) => r.isDefault)?.id ?? list[0]?.id ?? null))
          .catch(() => finalize(list.find((r) => r.isDefault)?.id ?? list[0]?.id ?? null));
      })
      .catch(() => {
        if (cancelled) return;
        setRegions([]);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setRegion = useCallback((id: string) => {
    setRegionId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem(REGION_STORAGE_KEY, id);
      // Hard reload to refetch all product/cart data in the new region/currency
      window.location.reload();
    }
  }, []);

  const region = regions.find((r) => r.id === regionId) ?? null;
  const currency = region?.currency || storeInfo?.currency || "USD";

  return (
    <RegionContext.Provider value={{ regions, regionId, region, currency, setRegion, loading }}>
      {children}
    </RegionContext.Provider>
  );
}

export function useRegion() {
  const ctx = useContext(RegionContext);
  if (!ctx) throw new Error("useRegion must be used within RegionProvider");
  return ctx;
}
