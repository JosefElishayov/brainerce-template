import { useTranslation } from "react-i18next";
import { useRegion } from "@/contexts/RegionContext";

/**
 * Small inline note that tells buyers whether prices include or exclude tax.
 * Driven by the active region's `taxInclusive` flag (Brainerce regions).
 *
 * Renders nothing while regions are still loading, or when no region is
 * configured (single-region storefronts without explicit regions).
 */
export const TaxNote = ({ className }: { className?: string }) => {
  const { region, loading } = useRegion();
  const { t } = useTranslation();
  if (loading || !region) return null;
  return (
    <p className={className ?? "text-xs text-muted-foreground"}>
      {region.taxInclusive ? t("tax.includedVat") : t("tax.excludedVat")}
    </p>
  );
};
