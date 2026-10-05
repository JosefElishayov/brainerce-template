import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/brainerce";

const KEY = "maison-consent-choice";

/** Cookie consent banner feeding Brainerce Consent Mode v2 (analytics + ads). */
export const ConsentBanner = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      try {
        client.updateConsent(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    } else setOpen(true);
  }, []);

  const choose = (granted: boolean) => {
    const choice = { analytics: granted, ads: granted };
    localStorage.setItem(KEY, JSON.stringify(choice));
    client.updateConsent(choice);
    setOpen(false);
  };

  if (!open) return null;
  return (
    <div className="fixed bottom-4 inset-x-4 md:start-4 md:end-auto md:max-w-md z-50 rounded-lg border border-border bg-card text-card-foreground shadow-lg p-5">
      <p className="text-sm mb-4">{t("consent.message")}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={() => choose(false)}>
          {t("consent.reject")}
        </Button>
        <Button size="sm" onClick={() => choose(true)}>
          {t("consent.accept")}
        </Button>
      </div>
    </div>
  );
};
