import { useEffect } from "react";
import { client } from "@/lib/brainerce";

declare global {
  interface Window {
    renderOptIn?: () => void;
    gapi?: { load: (n: string, cb: () => void) => void; surveyoptin?: { render: (o: Record<string, unknown>) => void } };
  }
}

/** Google Customer Reviews opt-in survey; renders nothing unless Brainerce enables it. */
export const GoogleReviewsSurvey = ({ checkoutId }: { checkoutId: string }) => {
  useEffect(() => {
    let cancelled = false;
    client
      .getGoogleCustomerReviewsSurvey(checkoutId)
      .then((s) => {
        if (cancelled || !s.enabled || !s.merchantId) return;
        const opts: Record<string, unknown> = {
          merchant_id: Number(s.merchantId),
          order_id: s.orderId,
          email: s.email,
          delivery_country: s.deliveryCountry,
          estimated_delivery_date: s.estimatedDeliveryDate,
        };
        if (s.lang && s.languageSupported !== false) opts.lang = s.lang;
        window.renderOptIn = () => {
          window.gapi?.load("surveyoptin", () => window.gapi?.surveyoptin?.render(opts));
        };
        if (document.getElementById("gcr-script")) {
          window.renderOptIn();
          return;
        }
        const sc = document.createElement("script");
        sc.id = "gcr-script";
        sc.src = "https://apis.google.com/js/platform.js?onload=renderOptIn";
        sc.async = true;
        sc.defer = true;
        document.body.appendChild(sc);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [checkoutId]);
  return null;
};
