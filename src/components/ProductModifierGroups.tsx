import { useMemo } from "react";
import type { ModifierGroup, Modifier } from "brainerce";
import { formatPrice } from "brainerce";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export type ModifierSelections = Record<string, string[]>;

interface Props {
  groups: ModifierGroup[];
  selections: ModifierSelections;
  onChange: (next: ModifierSelections) => void;
  currency: string;
}

export function computeModifierExtras(groups: ModifierGroup[], selections: ModifierSelections) {
  let total = 0;
  const freeMap: Record<string, boolean> = {};

  for (const g of groups) {
    const ids = selections[g.id] ?? [];
    const picks = ids
      .map((id) => g.modifiers.find((m) => m.id === id))
      .filter((m): m is Modifier => !!m);

    const eligible = picks.filter(
      (m) => !m.excludeFromFree && parseFloat(m.priceDelta) > 0,
    );
    const sorted = [...eligible];
    if (g.freeAllocationPolicy === "EXPENSIVE_FREE") {
      sorted.sort((a, b) => parseFloat(b.priceDelta) - parseFloat(a.priceDelta));
    } else if (g.freeAllocationPolicy === "CHEAPEST_FREE") {
      sorted.sort((a, b) => parseFloat(a.priceDelta) - parseFloat(b.priceDelta));
    }
    const freeIds = new Set(sorted.slice(0, g.freeQuantity ?? 0).map((m) => m.id));

    for (const m of picks) {
      const isFree = freeIds.has(m.id);
      freeMap[m.id] = isFree;
      if (!isFree) total += parseFloat(m.priceDelta);
    }
  }
  return { total, freeMap };
}

export function validateModifierSelections(
  groups: ModifierGroup[],
  selections: ModifierSelections,
): string | null {
  for (const g of groups) {
    const count = (selections[g.id] ?? []).length;
    const min = g.required ? Math.max(1, g.min ?? 0) : g.min ?? 0;
    if (count < min) {
      return `Please select at least ${min} option${min === 1 ? "" : "s"} for "${g.name}".`;
    }
    if (g.max != null && count > g.max) {
      return `Please select up to ${g.max} option${g.max === 1 ? "" : "s"} for "${g.name}".`;
    }
  }
  return null;
}

export function selectionsToPayload(selections: ModifierSelections) {
  return Object.entries(selections)
    .filter(([, ids]) => ids.length > 0)
    .map(([modifierGroupId, modifierIds]) => ({ modifierGroupId, modifierIds }));
}

export const ProductModifierGroups = ({ groups, selections, onChange, currency }: Props) => {
  const { freeMap } = useMemo(
    () => computeModifierExtras(groups, selections),
    [groups, selections],
  );

  if (!groups?.length) return null;

  const toggle = (g: ModifierGroup, m: Modifier) => {
    const current = selections[g.id] ?? [];
    const isSelected = current.includes(m.id);
    let next: string[];

    if (g.selectionType === "SINGLE") {
      // Radio: select this; allow deselect if not required
      if (isSelected) {
        next = g.required ? current : [];
      } else {
        next = [m.id];
      }
    } else {
      // MULTIPLE
      if (isSelected) {
        next = current.filter((id) => id !== m.id);
      } else {
        if (g.max != null && current.length >= g.max) return; // ignore overflow
        next = [...current, m.id];
      }
    }
    onChange({ ...selections, [g.id]: next });
  };

  const ruleLabel = (g: ModifierGroup) => {
    const parts: string[] = [];
    if (g.required || g.min > 0) parts.push(`Required`);
    if (g.selectionType === "SINGLE") parts.push("Choose 1");
    else if (g.max != null) parts.push(`Choose up to ${g.max}`);
    else if (g.min > 0) parts.push(`Choose ${g.min}+`);
    else parts.push("Optional");
    if (g.freeQuantity > 0) parts.push(`${g.freeQuantity} free`);
    return parts.join(" · ");
  };

  return (
    <div className="space-y-6 mb-8">
      {groups.map((g) => {
        const current = selections[g.id] ?? [];
        return (
          <div key={g.id}>
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
                {g.name}
              </span>
              <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/70">
                {ruleLabel(g)}
              </span>
            </div>

            <div className="grid gap-2">
              {g.modifiers
                .filter((m) => m.available !== false)
                .map((m) => {
                  const isSelected = current.includes(m.id);
                  const delta = parseFloat(m.priceDelta);
                  const isFree = freeMap[m.id];
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggle(g, m)}
                      className={cn(
                        "flex items-center gap-3 border px-4 py-3 text-left transition-colors",
                        isSelected
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex items-center justify-center w-5 h-5 border flex-shrink-0",
                          g.selectionType === "SINGLE" ? "rounded-full" : "",
                          isSelected
                            ? "bg-foreground border-foreground text-background"
                            : "border-border",
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </span>

                      {m.image?.url && (
                        <img
                          src={m.image.url}
                          alt={m.name}
                          className="w-12 h-12 object-cover flex-shrink-0"
                        />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        {m.description && (
                          <p className="text-xs text-muted-foreground truncate">
                            {m.description}
                          </p>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {delta === 0 ? (
                          "Included"
                        ) : isSelected && isFree ? (
                          <span className="text-primary">Free</span>
                        ) : (
                          <span>
                            {delta > 0 ? "+" : ""}
                            {formatPrice(String(delta), { currency })}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
