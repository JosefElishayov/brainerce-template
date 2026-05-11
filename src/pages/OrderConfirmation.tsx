import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const OrderConfirmation = () => {
  const [params] = useSearchParams();
  const checkoutId = params.get("checkout_id");
  const { refreshCart } = useStore();
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) {
      setStatus("error");
      return;
    }
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        const checkout = await client.getCheckout(checkoutId);
        if (cancelled) return;
        if (checkout.orderId) {
          setOrderId(checkout.orderId);
          setStatus("ok");
          refreshCart();
          return;
        }
      } catch {
        /* keep polling */
      }
      attempts += 1;
      if (attempts < 20) setTimeout(poll, 1500);
      else if (!cancelled) setStatus("error");
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [checkoutId, refreshCart]);

  return (
    <Layout>
      <div className="container-narrow py-28 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-6 animate-spin text-muted-foreground" />
            <h1 className="font-serif text-3xl mb-2">Confirming your order…</h1>
            <p className="text-muted-foreground">Just a moment.</p>
          </>
        )}
        {status === "ok" && (
          <>
            <CheckCircle2 className="w-14 h-14 mx-auto mb-6 text-primary" />
            <h1 className="font-serif text-4xl mb-3">Thank you</h1>
            <p className="text-muted-foreground mb-2">Your order has been placed.</p>
            {orderId && (
              <p className="text-xs tracking-[0.15em] uppercase text-muted-foreground/70 mb-8">
                Order ID: {orderId}
              </p>
            )}
            <Button asChild size="lg" className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </>
        )}
        {status === "error" && (
          <>
            <h1 className="font-serif text-3xl mb-3">We couldn't confirm your order</h1>
            <p className="text-muted-foreground mb-8">
              If you were charged, please contact support — your order is safe.
            </p>
            <Button asChild className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium">
              <Link to="/">Back Home</Link>
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
};

export default OrderConfirmation;
