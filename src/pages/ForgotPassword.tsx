import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { client } from "@/lib/brainerce";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await client.forgotPassword(email);
      setSent(true);
    } catch {
      setSent(true); // Always show success to prevent enumeration
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <section className="py-20">
        <div className="max-w-md mx-auto px-6">
          <h1 className="font-serif text-4xl mb-2 text-center">Forgot Password</h1>
          <p className="text-sm text-muted-foreground text-center mb-10">
            We'll send you a link to reset your password.
          </p>

          {sent ? (
            <div className="p-6 border border-border bg-muted/30 text-sm text-center">
              If an account exists for <strong>{email}</strong>, you'll receive an email with reset instructions shortly.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                required
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-none h-12"
              />
              <Button type="submit" disabled={loading} className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Reset Link"}
              </Button>
            </form>
          )}

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

export default ForgotPassword;
