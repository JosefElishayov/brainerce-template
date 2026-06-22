import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://brainerce-template.lovable.app";

export interface HrefLangAlternate {
  hrefLang: string; // e.g. "en", "he", "x-default"
  href: string;     // absolute or root-relative path
}

interface SEOProps {
  title: string;
  description: string;
  path: string; // root-relative ("/product/foo") or absolute
  image?: string;
  type?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /**
   * Per-locale alternates for hreflang. Include one for `x-default`
   * when possible. The canonical itself stays on `path`.
   */
  alternates?: HrefLangAlternate[];
}

function toAbsolute(url: string): string {
  if (!url) return SITE_URL;
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const SEO = ({ title, description, path, image, type = "website", jsonLd, alternates }: SEOProps) => {
  const lds = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  const canonical = toAbsolute(path);
  return (
    <Helmet>
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
