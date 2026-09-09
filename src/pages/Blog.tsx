import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import type { BlogPost } from "brainerce";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";

const Blog = () => {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    client.blog
      .getPosts({ page: 1, limit: 24 })
      .then((res) => setPosts(res?.data || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [locale]);

  return (
    <Layout>
      <SEO
        title={t("blog.seoTitle")}
        description={t("blog.seoDescription")}
        path="/blog"
        alternates={[
          { hrefLang: "en", href: "/en/blog" },
          { hrefLang: "he", href: "/he/blog" },
          { hrefLang: "x-default", href: "/en/blog" },
        ]}
      />

      <section className="py-16 md:py-24">
        <div className="container-full">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-4">
            {t("blog.eyebrow")}
          </p>
          <h1 className="font-serif text-4xl md:text-5xl mb-12">{t("blog.title")}</h1>

          {loading ? (
            <div className="grid gap-10 md:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-[4/3] bg-muted/40 animate-pulse" />
                  <div className="h-5 w-2/3 bg-muted/40 animate-pulse" />
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <p className="text-muted-foreground">{t("blog.empty")}</p>
          ) : (
            <div className="grid gap-10 md:grid-cols-3">
              {posts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                >
                  <Link to={`/blog/${post.slug}`} className="group block">
                    <div className="aspect-[4/3] overflow-hidden bg-muted/30 mb-5">
                      {post.coverImageUrl ? (
                        <img
                          src={post.coverImageUrl}
                          alt={post.coverImageAlt || post.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : null}
                    </div>
                    {post.category && (
                      <p className="text-[10px] font-semibold tracking-[0.3em] uppercase text-primary mb-2">
                        {post.category}
                      </p>
                    )}
                    <h2 className="font-serif text-2xl leading-tight mb-2 group-hover:text-primary transition-colors">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{post.excerpt}</p>
                    )}
                    {post.publishedAt && (
                      <p className="text-xs text-muted-foreground/70 mt-3">
                        {new Date(post.publishedAt).toLocaleDateString(locale)}
                      </p>
                    )}
                  </Link>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Blog;
