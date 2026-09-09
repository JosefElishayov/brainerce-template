import { useEffect, useState } from "react";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import type { FaqItem } from "brainerce";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";

const Faq = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client.content.faq
      .get(undefined, locale)
      .then((c) => setItems(c?.data?.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locale]);

  const jsonLd = items.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer.replace(/<[^>]*>/g, "") },
        })),
      }
    : undefined;

  return (
    <Layout>
      <SEO
        title={t("faq.seoTitle")}
        description={t("faq.seoDescription")}
        path="/faq"
        jsonLd={jsonLd}
        alternates={[
          { hrefLang: "en", href: "/en/faq" },
          { hrefLang: "he", href: "/he/faq" },
          { hrefLang: "x-default", href: "/en/faq" },
        ]}
      />
      <section className="py-16 md:py-24">
        <div className="container-narrow">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-4">{t("faq.eyebrow")}</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-10">{t("faq.title")}</h1>
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <p className="text-muted-foreground">{t("faq.empty")}</p>
          ) : (
            <Accordion type="single" collapsible className="border-t border-border">
              {items.map((item, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-start font-serif text-lg">{item.question}</AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="text-muted-foreground leading-relaxed [&_a]:underline [&_ul]:list-disc [&_ul]:ps-6"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item.answer || "") }}
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Faq;
