import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DOMPurify from "dompurify";
import { useTranslation } from "react-i18next";
import { buildArticleJsonLd, buildBreadcrumbJsonLd } from "brainerce";
import type { BlogPost as BlogPostType } from "brainerce";
import { Layout } from "@/components/Layout";
import { SEO, SITE_URL } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";
import { useStore } from "@/contexts/StoreContext";

const BlogPostPage = () => {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useLocale();
  const { storeInfo } = useStore();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    client.blog
      .getPost(decodeURIComponent(slug))
      .then(setPost)
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [slug, locale]);

  if (loading) {
    return (
      <Layout>
        <div className="container-narrow py-24 space-y-4">
          <div className="h-10 w-2/3 bg-muted/40 animate-pulse" />
          <div className="aspect-[16/9] bg-muted/40 animate-pulse" />
          <div className="h-40 bg-muted/40 animate-pulse" />
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <SEO title={t("blog.notFoundTitle")} description={t("blog.notFoundHint")} path={`/blog/${slug ?? ""}`} noIndex />
        <div className="container-narrow py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">{t("blog.notFoundTitle")}</h1>
          <p className="text-muted-foreground mb-8">{t("blog.notFoundHint")}</p>
          <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
            <Link to="/blog">{t("blog.backToBlog")}</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const path = `/blog/${post.slug}`;
  const description = (post.seoDescription || post.excerpt || post.title).slice(0, 160);

  return (
    <Layout>
      <SEO
        title={post.seoTitle || `${post.title} — ${storeInfo?.name || "Maison"}`}
        description={description}
        path={path}
        type="article"
        image={post.ogImageUrl || post.coverImageUrl}
        alternates={[
          { hrefLang: "en", href: `/en${path}` },
          { hrefLang: "he", href: `/he${path}` },
          { hrefLang: "x-default", href: `/en${path}` },
        ]}
        jsonLd={[
          buildArticleJsonLd(post, {
            siteUrl: SITE_URL,
            path: `/${locale}${path}`,
            organizationName: storeInfo?.name,
          }),
          buildBreadcrumbJsonLd(
            [
              { name: t("blog.title"), url: `${SITE_URL}/${locale}/blog` },
              { name: post.title, url: `${SITE_URL}/${locale}${path}` },
            ],
            { siteUrl: SITE_URL },
          ),
        ]}
      />

      <article className="py-16 md:py-24">
        <div className="container-narrow">
          <Link to="/blog" className="text-xs tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground">
            ← {t("blog.backToBlog")}
          </Link>
          {post.category && (
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mt-8 mb-3">
              {post.category}
            </p>
          )}
          <h1 className="font-serif text-3xl md:text-5xl leading-[1.1] mb-4">{post.title}</h1>
          <p className="text-sm text-muted-foreground mb-10">
            {[post.author, post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale) : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {post.coverImageUrl && (
            <img
              src={post.coverImageUrl}
              alt={post.coverImageAlt || post.title}
              className="w-full aspect-[16/9] object-cover mb-12"
            />
          )}
          <div
            className="prose-editorial text-muted-foreground leading-[1.9] space-y-5 [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:text-foreground [&_h3]:font-serif [&_h3]:text-xl [&_h3]:text-foreground [&_a]:underline [&_img]:my-6 [&_ul]:list-disc [&_ul]:ps-6"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content || "") }}
          />
          {post.tags?.length ? (
            <div className="flex flex-wrap gap-2 mt-12">
              {post.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 border border-border text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </article>
    </Layout>
  );
};

export default BlogPostPage;
