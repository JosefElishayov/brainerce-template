import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Product } from "brainerce";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { ProductCard } from "@/components/ProductCard";
import { CollectionCard } from "@/components/CollectionCard";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";
import { useRegion } from "@/contexts/RegionContext";

interface Category { id: string; name: string; image?: string | null }

const Index = () => {
  const { t } = useTranslation();
  const { storeInfo } = useStore();
  const { regionId } = useRegion();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImageY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    Promise.all([
      client.getProducts({ page: 1, limit: 8, ...(regionId ? { regionId } : {}) }).then(r => r.data).catch(() => []),
      client.getCategories().then(r => (r?.categories || []) as Category[]).catch(() => []),
    ]).then(([p, c]) => {
      setProducts(p);
      setCategories(c);
      setLoading(false);
    });
  }, [regionId]);

  const brandName = storeInfo?.name || "Lumeno";
  const featuredCollection = categories[0];

  return (
    <Layout>
      <SEO
        title={`${brandName} — Artisan Home & Lifestyle Store`}
        description="A curated collection of handcrafted home goods, lighting, and lifestyle pieces for considered living."
        path="/"
        jsonLd={[
          { "@context": "https://schema.org", "@type": "Organization", name: brandName, description: "Artisan home goods and lifestyle pieces." },
          { "@context": "https://schema.org", "@type": "WebSite", name: brandName, url: "/" },
        ]}
      />
      <section ref={heroRef} className="relative h-[100svh] -mt-16 md:-mt-20 overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroImageY }}>
          <img
            src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920&q=80"
            alt="Curated home lifestyle"
            width={1920}
            height={1080}
            fetchPriority="high"
            decoding="async"
            className="w-full h-[120%] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal/30 via-charcoal/10 to-charcoal/50" />
        </motion.div>
        <motion.div className="relative container-full h-full flex flex-col justify-end pb-20 md:pb-28 pt-16 md:pt-20" style={{ opacity: heroOpacity }}>
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }} className="max-w-3xl">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/70 mb-6">
              {t("home.eyebrow")}
            </p>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl xl:text-9xl text-white mb-8 leading-[0.9] tracking-tight">
              {brandName}
              <br />
              <span className="italic font-normal">{t("home.titleSuffix")}</span>
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-10 leading-relaxed max-w-lg">
              {t("home.subtitle")}
            </p>
            <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              <Link to="/products">
                {t("common.shopNow")}
                <ArrowRight className="ml-3 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[10px] tracking-[0.3em] uppercase text-white/50">{t("home.scroll")}</span>
            <ArrowDown className="w-4 h-4 text-white/50 animate-bounce" />
          </div>
        </motion.div>
      </section>

      {featuredCollection && (
        <section className="py-20 md:py-28 bg-linen">
          <div className="container-narrow text-center">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-4">
              {t("home.featuredCollection")}
            </p>
            <h2 className="font-serif text-4xl md:text-5xl mb-6">{featuredCollection.name}</h2>
            <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              <Link to={`/products?category=${featuredCollection.id}`}>
                {t("common.explore")} <ArrowRight className="ml-3 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      <section className="py-20 md:py-28">
        <div className="container-full">
          <div className="flex items-end justify-between mb-14">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("home.justArrived")}</p>
              <h2 className="font-serif text-4xl md:text-5xl text-foreground">{t("home.latestPieces")}</h2>
            </div>
            <Link to="/products" className="hidden md:flex items-center gap-3 text-sm tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground">
              {t("common.viewAll")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p className="font-serif text-2xl mb-2">{t("home.noProducts")}</p>
              <p className="text-sm">{t("home.noProductsHint")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
              {products.slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-24 md:py-32 bg-linen">
          <div className="container-full">
            <div className="text-center mb-16">
              <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-3">{t("home.browseBy")}</p>
              <h2 className="font-serif text-4xl md:text-5xl">{t("home.collections")}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.slice(0, 6).map((c, i) => (
                <CollectionCard key={c.id} collection={{ id: c.id, name: c.name, slug: c.id, image: c.image }} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 md:py-32">
        <div className="container-narrow text-center">
          <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-primary mb-6">{t("home.aboutEyebrow")}</p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.3] mb-8">
            {t("home.aboutHeadline")}{" "}
            <span className="italic">{t("home.aboutHeadlineEmphasis")}</span>.
          </h2>
          <Button asChild variant="outline" size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase">
            <Link to="/about">{t("home.readOurStory")} <ArrowRight className="ml-3 w-4 h-4" /></Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
