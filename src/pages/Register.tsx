import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { client, setCustomerToken } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setLoggedIn, refreshCart } = useStore();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onField = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth = await client.registerCustomer(form);
      if (auth.requiresVerification) {
        localStorage.setItem("verificationToken", auth.token);
        localStorage.setItem("verificationEmail", form.email);
        navigate("/verify-email");
        return;
      }
      setCustomerToken(auth.token);
      setLoggedIn(true);
      await refreshCart();
      navigate("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.registrationFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="max-w-md mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-serif text-4xl mb-2 text-center">{t("auth.createAccount")}</h1>
            <p className="text-sm text-muted-foreground text-center mb-10">
              {t("auth.joinUs")}
            </p>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 border border-destructive/30 bg-destructive/5 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 text-destructive" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input name="firstName" required placeholder={t("auth.firstName")} value={form.firstName} onChange={onField} className="rounded-none h-12" />
                <Input name="lastName" required placeholder={t("auth.lastName")} value={form.lastName} onChange={onField} className="rounded-none h-12" />
              </div>
              <Input name="email" type="email" required placeholder={t("auth.email")} value={form.email} onChange={onField} className="rounded-none h-12" />
              <Input name="password" type="password" required placeholder={t("auth.password")} value={form.password} onChange={onField} className="rounded-none h-12" />
              <p className="text-xs text-muted-foreground">
                {t("auth.passwordHint")}
              </p>
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.createAccount")}
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t("auth.haveAccount")}{" "}
              <Link to="/login" className="text-foreground underline underline-offset-4">
                {t("auth.signInLink")}
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Register;
