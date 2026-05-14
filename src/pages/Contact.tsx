import { useEffect, useState, FormEvent } from "react";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { client } from "@/lib/brainerce";
import { toast } from "@/hooks/use-toast";
import type { ContactFormPublic, ContactFormPublicField } from "brainerce";

const widthClass = (w?: ContactFormPublicField["width"]) =>
  w === "HALF" ? "md:col-span-3" : w === "THIRD" ? "md:col-span-2" : "md:col-span-6";

const inputCls =
  "w-full h-12 px-4 text-sm bg-background border border-border focus:outline-none focus:border-foreground transition-colors";

const Contact = () => {
  const [form, setForm] = useState<ContactFormPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    let cancelled = false;
    client.contactForms
      .get("main")
      .then((f) => {
        if (cancelled) return;
        setForm(f);
        const defaults: Record<string, unknown> = {};
        f.fields.forEach((field) => {
          if (field.defaultValue !== undefined) defaults[field.key] = field.defaultValue;
          else if (field.type === "CHECKBOX") defaults[field.key] = false;
          else if (field.type === "MULTI_SELECT") defaults[field.key] = [];
        });
        setValues(defaults);
      })
      .catch(() => {
        setForm({
          id: "fallback",
          key: "main",
          name: "Get in touch",
          submitButton: "Send message",
          successMessage: "Thanks — we'll be in touch shortly.",
          fields: [
            { key: "name", type: "TEXT", label: "Name", isRequired: true, width: "HALF" },
            { key: "email", type: "EMAIL", label: "Email", isRequired: true, width: "HALF" },
            { key: "subject", type: "TEXT", label: "Subject", isRequired: false, width: "FULL" },
            { key: "message", type: "TEXTAREA", label: "Message", isRequired: true, width: "FULL" },
          ],
        });
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (key: string, v: unknown) => setValues((p) => ({ ...p, [key]: v }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form) return;
    for (const f of form.fields) {
      const v = values[f.key];
      if (f.isRequired && (v === undefined || v === "" || v === null || (Array.isArray(v) && v.length === 0))) {
        toast({ title: "Missing field", description: `${f.label} is required`, variant: "destructive" });
        return;
      }
    }
    setSubmitting(true);
    try {
      await client.createInquiry({
        formKey: form.key,
        fields: values,
        sourceMetadata: { page: window.location.pathname },
      });
      setSubmitted(true);
    } catch (err) {
      toast({
        title: "Could not send",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (f: ContactFormPublicField) => {
    const v = values[f.key];
    const common = { id: f.key, name: f.key, required: f.isRequired, placeholder: f.placeholder };
    switch (f.type) {
      case "TEXTAREA":
        return (
          <textarea
            {...common}
            value={(v as string) ?? ""}
            onChange={(e) => setField(f.key, e.target.value)}
            rows={5}
            minLength={f.validation?.minLength}
            maxLength={f.validation?.maxLength}
            className={`${inputCls} h-auto py-3 resize-y`}
          />
        );
      case "SELECT":
        return (
          <select
            {...common}
            value={(v as string) ?? ""}
            onChange={(e) => setField(f.key, e.target.value)}
            className={inputCls}
          >
            <option value="">—</option>
            {f.enumValues?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "MULTI_SELECT":
        return (
          <div className="flex flex-wrap gap-2">
            {f.enumValues?.map((o) => {
              const arr = (v as string[]) || [];
              const active = arr.includes(o.value);
              return (
                <button
                  type="button"
                  key={o.value}
                  onClick={() =>
                    setField(f.key, active ? arr.filter((x) => x !== o.value) : [...arr, o.value])
                  }
                  className={`px-3 py-2 text-xs border transition-colors ${
                    active ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground"
                  }`}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        );
      case "CHECKBOX":
        return (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!v}
              onChange={(e) => setField(f.key, e.target.checked)}
              required={f.isRequired}
            />
            {f.helpText || f.label}
          </label>
        );
      case "DATE":
        return (
          <input
            {...common}
            type="date"
            value={(v as string) ?? ""}
            onChange={(e) => setField(f.key, e.target.value)}
            className={inputCls}
          />
        );
      case "NUMBER":
        return (
          <input
            {...common}
            type="number"
            value={(v as string) ?? ""}
            min={f.validation?.min}
            max={f.validation?.max}
            onChange={(e) => setField(f.key, e.target.value)}
            className={inputCls}
          />
        );
      case "EMAIL":
        return (
          <input
            {...common}
            type="email"
            value={(v as string) ?? ""}
            onChange={(e) => setField(f.key, e.target.value)}
            className={inputCls}
          />
        );
      case "PHONE":
        return (
          <input
            {...common}
            type="tel"
            value={(v as string) ?? ""}
            onChange={(e) => setField(f.key, e.target.value)}
            className={inputCls}
          />
        );
      case "URL":
        return (
          <input
            {...common}
            type="url"
            value={(v as string) ?? ""}
            onChange={(e) => setField(f.key, e.target.value)}
            className={inputCls}
          />
        );
      default:
        return (
          <input
            {...common}
            type="text"
            value={(v as string) ?? ""}
            minLength={f.validation?.minLength}
            maxLength={f.validation?.maxLength}
            onChange={(e) => setField(f.key, e.target.value)}
            className={inputCls}
          />
        );
    }
  };

  return (
    <Layout>
      <SEO
        title="Contact — Maison"
        description="Get in touch with the Maison studio. We'd love to hear from you about pieces, partnerships, or projects."
        path="/contact"
      />
      <section className="container-full py-16 md:py-24 max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Contact
          </p>
          <h1 className="font-serif text-4xl md:text-5xl tracking-tight">
            {form?.name || "Get in touch"}
          </h1>
          {form?.description && (
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">{form.description}</p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading…</div>
        ) : submitted ? (
          <div className="border border-border p-10 text-center">
            <h2 className="font-serif text-2xl mb-3">Message sent</h2>
            <p className="text-muted-foreground">{form?.successMessage || "Thanks — we'll be in touch."}</p>
          </div>
        ) : (
          form && (
            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-5">
              {form.fields.map((f) => (
                <div key={f.key} className={`flex flex-col gap-2 ${widthClass(f.width)}`}>
                  {f.type !== "CHECKBOX" && (
                    <label htmlFor={f.key} className="text-[11px] font-medium tracking-[0.15em] uppercase text-muted-foreground">
                      {f.label}
                      {f.isRequired && " *"}
                    </label>
                  )}
                  {renderField(f)}
                  {f.helpText && f.type !== "CHECKBOX" && (
                    <span className="text-xs text-muted-foreground">{f.helpText}</span>
                  )}
                </div>
              ))}
              <div className="md:col-span-6 mt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-12 px-8 bg-foreground text-background text-xs font-medium tracking-[0.2em] uppercase hover:bg-foreground/90 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending…" : form.submitButton}
                </button>
              </div>
            </form>
          )
        )}
      </section>
    </Layout>
  );
};

export default Contact;
