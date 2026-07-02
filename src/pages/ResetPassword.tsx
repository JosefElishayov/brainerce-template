import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, AlertCircle } from "lucide-react";
import { client } from "@/lib/brainerce";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError("Missing reset token");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await client.resetPassword(token, password);
      navigate("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="max-w-md mx-auto px-6">
          <h1 className="font-serif text-4xl mb-2 text-center">Reset Password</h1>
          <p className="text-sm text-muted-foreground text-center mb-10">
            Enter your new password below.
          </p>

          {!token && (
            <div className="mb-6 p-4 border border-destructive/30 bg-destructive/5 text-sm flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 text-destructive" />
              <span>Missing reset token. Please request a new reset link.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 border border-destructive/30 bg-destructive/5 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              required
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-none h-12"
            />
            <p className="text-xs text-muted-foreground">
              Min 8 characters with uppercase, lowercase, number, and special character.
            </p>
            <Button type="submit" disabled={loading || !token} className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset Password"}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-foreground underline underline-offset-4">
              Back to sign in
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
};

export default ResetPassword;
