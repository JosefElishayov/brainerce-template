import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const { t } = useTranslation();
  return (
    <Layout>
      <SEO title="Page Not Found — Maison" description="The page you were looking for isn't here. Browse our collections or return to the Maison home." path="/404" noIndex />
      <section className="py-20 md:py-28">
        <div className="container-narrow text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-8xl font-serif text-muted-foreground/30 mb-4">404</p>
            <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">
              {t("notFound.title")}
            </h1>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {t("notFound.hint")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="rounded-sm">
                <Link to="/">{t("notFound.returnHome")}</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-sm">
                <Link to="/products">{t("notFound.browseProducts")}</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default NotFound;
