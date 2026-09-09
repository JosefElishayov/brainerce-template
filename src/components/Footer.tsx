import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStore } from "@/contexts/StoreContext";
import { client } from "@/lib/brainerce";
import { useLocale } from "@/contexts/LocaleContext";
import { NewsletterSignup } from "./NewsletterSignup";
import type { FooterColumn, FooterSocialLink } from "brainerce";

interface CategoryItem {
  id: string;
  name: string;
}

export const Footer = () => {
  const { t } = useTranslation();
  const { storeInfo } = useStore();
  const brandName = storeInfo?.name || "Lumeno";
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const { locale } = useLocale();
  const [managedColumns, setManagedColumns] = useState<FooterColumn[]>([]);
  const [social, setSocial] = useState<FooterSocialLink[]>([]);
  const [copyright, setCopyright] = useState<string | null>(null);

  useEffect(() => {
    client
      .getCategories()
      .then((res) => {
        setCategories(((res?.categories || []) as CategoryItem[]).slice(0, 6));
      })
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    client.content.footer
      .get(undefined, locale)
      .then((c) => {
        setManagedColumns(c?.data?.columns || []);
        setSocial(c?.data?.social || []);
        setCopyright(c?.data?.copyright || null);
      })
      .catch(() => setManagedColumns([]));
  }, [locale]);

  return (
    <footer className="bg-foreground text-background">
      <div className="border-b border-background/10">
        <div className="container-full py-12 md:py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <Link to="/" className="font-serif text-3xl md:text-4xl tracking-tight text-background">
                {brandName}
              </Link>
              <p className="mt-3 text-sm text-background/50 leading-relaxed max-w-xs">
                {t("footer.tagline")}
              </p>
            </div>
            <div className="max-w-sm w-full space-y-5">
              <NewsletterSignup />
              <Link
                to="/contact"
                className="inline-flex items-center gap-3 text-xs font-medium tracking-[0.2em] uppercase text-background/60 hover:text-background transition-colors"
              >
                {t("footer.getInTouch")}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-full py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              {t("footer.collections")}
            </h4>
            <ul className="space-y-3">
              {categories.length === 0 ? (
                <li className="text-sm text-background/40">{t("footer.noCollections")}</li>
              ) : (
                categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/products?category=${c.id}`}
                      className="text-sm text-background/60 hover:text-background transition-colors"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              {t("footer.explore")}
            </h4>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.shopAll")}</Link></li>
              <li><Link to="/about" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.ourStory")}</Link></li>
              <li><Link to="/contact" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.contact")}</Link></li>
              <li><Link to="/blog" className="text-sm text-background/60 hover:text-background transition-colors">{t("blog.title")}</Link></li>
              <li><Link to="/donate" className="text-sm text-background/60 hover:text-background transition-colors">{t("donate.title")}</Link></li>
              <li><Link to="/cart" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.shoppingBag")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              {t("footer.account")}
            </h4>
            <ul className="space-y-3">
              <li><Link to="/login" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.signIn")}</Link></li>
              <li><Link to="/register" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.createAccount")}</Link></li>
              <li><Link to="/account" className="text-sm text-background/60 hover:text-background transition-colors">{t("footer.myOrders")}</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-semibold tracking-[0.25em] uppercase text-background/40 mb-5">
              {t("footer.help")}
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/faq" className="text-sm text-background/60 hover:text-background transition-colors">
                  {t("footer.faq")}
                </Link>
              </li>
              {managedColumns
                .flatMap((col) => col.links || [])
                .slice(0, 6)
                .map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-background/60 hover:text-background transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-background/10">
        <div className="container-full py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-background/30">
            {copyright || `© ${new Date().getFullYear()} ${brandName}. ${t("footer.rightsReserved")}`}
          </p>
          <div className="flex items-center gap-6">
            {social.map((s2) => (
              <a
                key={s2.url}
                href={s2.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-background/40 hover:text-background transition-colors capitalize"
              >
                {s2.platform}
              </a>
            ))}
            <span className="text-xs text-background/30">{t("footer.poweredBy")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
