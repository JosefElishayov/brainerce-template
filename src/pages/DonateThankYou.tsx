import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { formatPrice } from "brainerce";
import type { DonationIntent } from "brainerce";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/brainerce";

const DonateThankYou = () => {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const donationId = params.get("donationId") || params.get("donation_id");
  const [donation, setDonation] = useState<DonationIntent | null>(null);
  const [loading, setLoading] = useState(!!donationId);

  useEffect(() => {
    if (!donationId) return;
    client
      .getDonation(donationId)
      .then(setDonation)
      .catch(() => setDonation(null))
      .finally(() => setLoading(false));
  }, [donationId]);

  return (
    <Layout>
      <SEO title={t("donate.thanksTitle")} description={t("donate.thanksSubtitle")} path="/donate/thank-you" noIndex />
      <section className="py-24">
        <div className="container-narrow max-w-lg text-center">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          ) : (
            <>
              <CheckCircle2 className="w-10 h-10 mx-auto text-primary mb-6" />
              <h1 className="font-serif text-4xl mb-4">{t("donate.thanksTitle")}</h1>
              <p className="text-muted-foreground mb-6">{t("donate.thanksSubtitle")}</p>
              {donation && (
                <p className="text-sm mb-8">
                  {t("donate.thanksAmount", {
                    amount: formatPrice(donation.chargeAmount, { currency: donation.currency }),
                  })}
                </p>
              )}
              <Button asChild className="rounded-none px-8 text-sm tracking-[0.1em] uppercase">
                <Link to="/">{t("common.backHome")}</Link>
              </Button>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default DonateThankYou;
