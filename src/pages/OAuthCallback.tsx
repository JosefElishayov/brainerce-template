import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Loader2 } from "lucide-react";
import { setCustomerToken } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { setLoggedIn, refreshCart } = useStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (params.get("oauth_success") === "true") {
        const token = params.get("token");
        if (token) {
          setCustomerToken(token);
          setLoggedIn(true);
          await refreshCart();
          navigate("/account");
          return;
        }
        setError("Missing token in callback");
      } else if (params.get("oauth_error")) {
        setError(params.get("oauth_error"));
      } else {
        setError("Unknown OAuth response");
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
