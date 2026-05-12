import type { CheckoutCustomFieldDefinition } from "brainerce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowRight } from "lucide-react";

interface Props {
  fields: CheckoutCustomFieldDefinition[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onApply: () => void;
  loading?: boolean;
}

export function CustomFieldsStep({ fields, values, onChange, onApply, loading }: Props) {
  return (
    <div>
      <h2 className="font-serif text-xl mb-6">Additional Options</h2>
      <div className="space-y-5">
        {fields.map((field) => {
          const value = values[field.key] ?? "";
          const label = (
            <label className="block text-xs tracking-[0.15em] uppercase text-muted-foreground mb-2">
              {field.name}
              {field.required && <span className="text-destructive"> *</span>}
            </label>
          );
          const help = field.description && (
            <p className="text-xs text-muted-foreground mt-1.5">{field.description}</p>
          );

          switch (field.type) {
            case "TEXT":
              return (
                <div key={field.key}>
                  {label}
                  <Input
                    type="text"
                    value={value as string}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    required={field.required}
                    minLength={field.minLength ?? undefined}
                    maxLength={field.maxLength ?? undefined}
                    className="rounded-none h-12"
                  />
                  {help}
                </div>
              );
            case "TEXTAREA":
              return (
                <div key={field.key}>
                  {label}
                  <textarea
                    value={value as string}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    required={field.required}
                    minLength={field.minLength ?? undefined}
                    maxLength={field.maxLength ?? undefined}
                    rows={4}
                    className="w-full border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  {help}
                </div>
              );
            case "NUMBER":
              return (
                <div key={field.key}>
                  {label}
                  <Input
                    type="number"
                    value={value as number | string}
                    onChange={(e) => onChange(field.key, e.target.valueAsNumber)}
                    required={field.required}
                    min={field.minValue ?? undefined}
                    max={field.maxValue ?? undefined}
                    className="rounded-none h-12"
                  />
                  {help}
                </div>
              );
            case "BOOLEAN":
              return (
                <label key={field.key} className="flex items-start gap-3 p-4 border border-border cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value === true}
                    onChange={(e) => onChange(field.key, e.target.checked)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">{field.name}</p>
                    {field.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
                    )}
                  </div>
                </label>
              );
            case "SELECT":
              return (
                <div key={field.key}>
                  {label}
                  <select
                    value={value as string}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    required={field.required}
                    className="w-full h-12 border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">— Select —</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {help}
                </div>
              );
            case "DATE":
              return (
                <div key={field.key}>
                  {label}
                  <Input
                    type="date"
                    value={value as string}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    required={field.required}
                    className="rounded-none h-12"
                  />
                  {help}
                </div>
              );
            default:
              return null;
          }
        })}
      </div>

      <Button
        type="button"
        onClick={onApply}
        disabled={loading}
        size="lg"
        className="w-full mt-8 rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating…</>
        ) : (
          <>Continue to Payment <ArrowRight className="ml-3 w-4 h-4" /></>
        )}
      </Button>
    </div>
  );
}
