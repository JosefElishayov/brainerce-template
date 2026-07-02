import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Loader2 } from "lucide-react";
import { client, setCustomerToken } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setLoggedIn, refreshCart } = useStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (params.get("oauth_error")) {
          setError(params.get("oauth_error"));
          return;
        }
        if (params.get("oauth_success") !== "true") {
          setError("Unknown OAuth response");
          return;
        }

        // New SDK flow: exchange one-time auth_code for a customer token
        const authCode = params.get("auth_code");
        const legacyToken = params.get("token");

        if (authCode) {
          const result = await client.exchangeOAuthCode(authCode);
          const token = result?.token;
          if (!token) throw new Error("No token returned from OAuth exchange");
          setCustomerToken(token);
          setLoggedIn(true);
          await refreshCart();
          navigate("/account");
          return;
        }

        if (legacyToken) {
          setCustomerToken(legacyToken);
          setLoggedIn(true);
          await refreshCart();
          navigate("/account");
          return;
        }

        setError("Missing auth_code in callback");
      } catch (err) {
        setError(err instanceof Error ? err.message : "OAuth sign-in failed");
      }
    })();
  }, [params, navigate, setLoggedIn, refreshCart]);

  return (
    <Layout>
      <section className="py-28">
        <div className="max-w-md mx-auto px-6 text-center">
          {error ? (
            <>
              <h1 className="font-serif text-3xl mb-4">Sign-in Failed</h1>
              <p className="text-sm text-muted-foreground mb-6">{error}</p>
              <Link to="/login" className="text-sm underline">Back to login</Link>
            </>
          ) : (
            <>
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Signing you in…</p>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default OAuthCallback;
