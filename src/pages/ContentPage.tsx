import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import type { Content } from "brainerce";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";

const ContentPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useLocale();
  const [page, setPage] = useState<Content<"PAGE"> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    client.content.page
      .getBySlug(decodeURIComponent(slug), locale)
      .then(setPage)
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug, locale]);

  if (loading) {
    return (
      <Layout>
        <div className="container-narrow py-24 space-y-4">
          <div className="h-10 w-1/2 bg-muted/40 animate-pulse" />
          <div className="h-64 bg-muted/40 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!page?.data) {
    return (
      <Layout>
        <SEO title={t("page.notFoundTitle")} description={t("page.notFoundHint")} path={`/p/${slug ?? ""}`} noIndex />
        <div className="container-narrow py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">{t("page.notFoundTitle")}</h1>
          <p className="text-muted-foreground mb-8">{t("page.notFoundHint")}</p>
          <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
            <Link to="/">{t("common.backHome")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const data = page.data;
  const path = `/p/${data.slug}`;

  return (
    <Layout>
      <SEO
        title={data.seo?.title || data.title}
        description={(data.seo?.description || data.title).slice(0, 160)}
        path={path}
        image={data.seo?.ogImage}
        alternates={[
          { hrefLang: "en", href: `/en${path}` },
          { hrefLang: "he", href: `/he${path}` },
          { hrefLang: "x-default", href: `/en${path}` },
        ]}
      />
      <article className="py-16 md:py-24">
        <div className="container-narrow">
          <h1 className="font-serif text-3xl md:text-5xl leading-tight mb-10">{data.title}</h1>
          <div
            className="text-muted-foreground leading-[1.9] space-y-5 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-foreground [&_a]:underline [&_ul]:list-disc [&_ul]:ps-6"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(data.html || "") }}
          />
        </div>
      </article>
    </Layout>
  );
};

export default ContentPage;
