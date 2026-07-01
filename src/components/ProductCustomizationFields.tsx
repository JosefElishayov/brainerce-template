import { useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import type { ProductCustomizationField } from "brainerce";
import { Input } from "@/components/ui/input";
import { client } from "@/lib/brainerce";

export type CustomizationValues = Record<string, string | string[] | number | boolean>;

interface Props {
  fields: ProductCustomizationField[];
  values: CustomizationValues;
  onChange: (key: string, value: string | string[] | number | boolean) => void;
}

export function ProductCustomizationFields({ fields, values, onChange }: Props) {
  if (!fields?.length) return null;

  return (
    <div className="mb-8 space-y-5 border-t border-border pt-6">
      <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground">
        Personalize
      </p>
      {fields
        .slice()
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
        .map((field) => (
          <FieldRenderer
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(v) => onChange(field.key, v)}
          />
        ))}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ProductCustomizationField;
  value: string | string[] | number | boolean | undefined;
  onChange: (value: string | string[] | number | boolean) => void;
}) {
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
    case "URL":
    case "COLOR":
    case "DIMENSION":
    case "WEIGHT":
      return (
        <div>
          {label}
          <Input
            type={field.type === "URL" ? "url" : "text"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            minLength={field.minLength ?? undefined}
            maxLength={field.maxLength ?? undefined}
            className="rounded-none h-12"
          />
          {help}
        </div>
      );

    case "TEXTAREA":
    case "JSON":
      return (
        <div>
          {label}
          <textarea
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            minLength={field.minLength ?? undefined}
            maxLength={field.maxLength ?? undefined}
            rows={3}
            className="w-full border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          {help}
        </div>
      );

    case "NUMBER":
      return (
        <div>
          {label}
          <Input
            type="number"
            value={(value as number | string) ?? ""}
            onChange={(e) => onChange(e.target.valueAsNumber)}
            required={field.required}
            min={field.minValue ?? undefined}
            max={field.maxValue ?? undefined}
            className="rounded-none h-12"
          />
          {help}
        </div>
      );

    case "DATE":
    case "DATETIME":
      return (
        <div>
          {label}
          <Input
            type={field.type === "DATETIME" ? "datetime-local" : "date"}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="rounded-none h-12"
          />
          {help}
        </div>
      );

    case "BOOLEAN":
      return (
        <label className="flex items-start gap-3 p-4 border border-border cursor-pointer">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
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
        <div>
          {label}
          <select
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="w-full h-12 border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">— Select —</option>
            {(field.enumValues ?? []).map((opt) => {
              const val = typeof opt === "string" ? opt : opt.value;
              const lbl = typeof opt === "string" ? opt : opt.label;
              return (
                <option key={val} value={val}>
                  {lbl}
                </option>
              );
            })}
          </select>
          {help}
        </div>
      );

    case "MULTI_SELECT": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div>
          {label}
          <div className="space-y-2">
            {(field.enumValues ?? []).map((opt) => {
              const val = typeof opt === "string" ? opt : opt.value;
              const lbl = typeof opt === "string" ? opt : opt.label;
              const checked = arr.includes(val);
              return (
                <label key={val} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      onChange(
                        e.target.checked
                          ? [...arr, val]
                          : arr.filter((v) => v !== val),
                      )
                    }
                  />
                  {lbl}
                </label>
              );
            })}
          </div>
          {help}
        </div>
      );
    }

    case "IMAGE":
      return (
        <ImageUploadField
          label={label}
          help={help}
          value={value as string}
          onChange={onChange}
          required={field.required}
        />
      );

    case "GALLERY": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      return (
        <GalleryUploadField
          label={label}
          help={help}
          values={arr}
          onChange={onChange}
        />
      );
    }

    default:
      return null;
  }
}

function ImageUploadField({
  label,
  help,
  value,
  onChange,
  required,
}: {
  label: React.ReactNode;
  help: React.ReactNode;
  value?: string;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const { url } = await client.uploadCustomizationFile(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label}
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="" className="w-32 h-32 object-cover border border-border" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 p-1 bg-background border border-border"
            aria-label="Remove"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <label className="flex items-center justify-center gap-2 h-12 border border-dashed border-border cursor-pointer hover:border-foreground text-sm">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span>{uploading ? "Uploading…" : "Upload image"}</span>
          <input
            type="file"
            accept="image/*"
            required={required && !value}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </label>
      )}
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      {help}
    </div>
  );
}

function GalleryUploadField({
  label,
  help,
  values,
  onChange,
}: {
  label: React.ReactNode;
  help: React.ReactNode;
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList) {
    setUploading(true);
    setError(null);
    try {
      const uploaded: string[] = [];
      for (const f of Array.from(files)) {
        const { url } = await client.uploadCustomizationFile(f);
        uploaded.push(url);
      }
      onChange([...values, ...uploaded]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      {label}
      <div className="flex flex-wrap gap-2 mb-2">
        {values.map((url, i) => (
          <div key={i} className="relative">
            <img src={url} alt="" className="w-20 h-20 object-cover border border-border" />
            <button
              type="button"
              onClick={() => onChange(values.filter((_, idx) => idx !== i))}
              className="absolute -top-2 -right-2 p-1 bg-background border border-border"
              aria-label="Remove"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <label className="flex items-center justify-center gap-2 h-12 border border-dashed border-border cursor-pointer hover:border-foreground text-sm">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
        <span>{uploading ? "Uploading…" : "Add images"}</span>
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </label>
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
      {help}
    </div>
  );
}
