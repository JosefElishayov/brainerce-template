import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { client, setCustomerToken } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";
import type { CustomerOAuthProvider } from "brainerce";

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setLoggedIn, refreshCart } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [providers, setProviders] = useState<CustomerOAuthProvider[]>([]);

  useEffect(() => {
    client
      .getAvailableOAuthProviders()
      .then((r) => setProviders(r.providers || []))
      .catch(() => setProviders([]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const auth = await client.loginCustomer(email, password);
      if (auth.requiresVerification) {
        localStorage.setItem("verificationToken", auth.token);
        localStorage.setItem("verificationEmail", email);
        navigate("/verify-email");
        return;
      }
      setCustomerToken(auth.token);
      setLoggedIn(true);
      await refreshCart();
      navigate("/account");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuth(provider: CustomerOAuthProvider) {
    try {
      const { authorizationUrl } = await client.getOAuthAuthorizeUrl(provider, {
        redirectUrl: window.location.origin + "/auth/callback",
      });
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.oauthFailed"));
    }
  }

  return (
    <Layout>
      <SEO title="Sign In — Maison" description="Sign in to your Maison account to view orders, manage your wishlist, and check out faster." path="/login" noIndex />
      <section className="py-20">
        <div className="max-w-md mx-auto px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-serif text-4xl mb-2 text-center">{t("auth.welcomeBack")}</h1>
            <p className="text-sm text-muted-foreground text-center mb-10">
              {t("auth.signInToAccount")}
            </p>

            {error && (
              <div className="mb-6 flex items-start gap-3 p-4 border border-destructive/30 bg-destructive/5 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 text-destructive" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                required
                placeholder={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none h-12"
              />
              <Input
                type="password"
                required
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-none h-12"
              />
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                  {t("auth.forgotPassword")}
                </Link>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("auth.signIn")}
              </Button>
            </form>

            {providers.length > 0 && (
              <div className="mt-8">
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-3 text-muted-foreground tracking-widest uppercase">
                      {t("auth.or")}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  {providers.map((p) => (
                    <Button
                      key={p}
                      type="button"
                      variant="outline"
                      onClick={() => handleOAuth(p)}
                      className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase"
                    >
                      {t("auth.continueWith", { provider: p.charAt(0) + p.slice(1).toLowerCase() })}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-muted-foreground">
              {t("auth.noAccount")}{" "}
              <Link to="/register" className="text-foreground underline underline-offset-4">
                {t("auth.createOne")}
              </Link>
            </p>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default Login;
