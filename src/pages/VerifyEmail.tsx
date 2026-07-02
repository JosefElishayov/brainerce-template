import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { client, setCustomerToken } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { setLoggedIn, refreshCart } = useStore();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const email = typeof window !== "undefined" ? localStorage.getItem("verificationEmail") : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("verificationToken");
      if (!token) throw new Error("Verification session expired. Please register or login again.");
      const result = await client.verifyEmail(code, token);
      if (result.verified) {
        const activeToken = result.token || token;
        setCustomerToken(activeToken);
        localStorage.removeItem("verificationToken");
        localStorage.removeItem("verificationEmail");
        setLoggedIn(true);
        await refreshCart();
        navigate("/account");
      } else {
        setError("Invalid verification code");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      const token = localStorage.getItem("verificationToken");
      if (!token) throw new Error("Session expired");
      const result = await client.resendVerificationEmail(token);
      if (result.token) localStorage.setItem("verificationToken", result.token);
      setInfo("A new code has been sent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setResending(false);
    }
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="max-w-md mx-auto px-6">
          <h1 className="font-serif text-4xl mb-2 text-center">Verify Your Email</h1>
          <p className="text-sm text-muted-foreground text-center mb-10">
            We sent a code to {email || "your email"}.
          </p>

          {error && (
            <div className="mb-6 flex items-start gap-3 p-4 border border-destructive/30 bg-destructive/5 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 text-destructive" /> <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="mb-6 p-4 border border-border bg-muted/30 text-sm">{info}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              required
              placeholder="Verification code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="rounded-none h-12 text-center tracking-[0.5em]"
            />
            <Button type="submit" disabled={loading} className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
            </Button>
          </form>

          <button
            onClick={handleResend}
            disabled={resending}
            className="mt-6 w-full text-sm text-muted-foreground hover:text-foreground"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </section>
    </Layout>
  );
};

export default VerifyEmail;
