import { Helmet } from "react-helmet-async";
import { useLocale } from "@/contexts/LocaleContext";

export const SITE_URL = "https://brainerce-template.lovable.app";

export interface HrefLangAlternate {
  hrefLang: string; // e.g. "en", "he", "x-default"
  href: string;     // absolute or root-relative path (already locale-prefixed)
}

interface SEOProps {
  title: string;
  description: string;
  /** Route path WITHOUT the language prefix (e.g. "/products"). SEO prepends /{locale}. */
  path: string;
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /**
   * Per-locale alternates for hreflang. Each href must already include
   * its language prefix (e.g. "/he/product/foo"). Include `x-default` when possible.
   */
  alternates?: HrefLangAlternate[];
}

function toAbsolute(url: string): string {
  if (!url) return SITE_URL;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const SEO = ({ title, description, path, image, type = "website", jsonLd, alternates }: SEOProps) => {
  const { locale } = useLocale();
  const lds = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  // Prepend locale prefix so canonical/og:url match the actual URL
  const prefixed = path.startsWith(`/${locale}`) ? path : `/${locale}${path === "/" ? "" : path}`;
  const canonical = toAbsolute(prefixed);
  return (
    <Helmet>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {alternates?.map((a) => (
        <link key={a.hrefLang} rel="alternate" hrefLang={a.hrefLang} href={toAbsolute(a.href)} />
      ))}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
      {lds.map((ld, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(ld)}</script>
      ))}
    </Helmet>
  );
};
