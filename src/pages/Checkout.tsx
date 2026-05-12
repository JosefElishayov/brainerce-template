import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { loadStripe, type Stripe as StripeJs } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  formatPrice,
  getCartTotals,
  getCartItemName,
  getCartItemImage,
  type ShippingRate,
  type CheckoutCustomFieldDefinition,
} from "brainerce";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/contexts/StoreContext";
import { client } from "@/lib/brainerce";
import { useToast } from "@/hooks/use-toast";
import { OrderBumpCard } from "@/components/upsell/OrderBumpCard";
import { CustomFieldsStep } from "@/components/CustomFieldsStep";

interface AppliedSurcharge {
  key: string;
  name: string;
  amount: string | number;
}

function CouponInput() {
  const { cart, refreshCart } = useStore();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const applied = cart && "couponCode" in cart ? (cart as { couponCode?: string }).couponCode : null;

  async function apply(e: React.FormEvent) {
    e.preventDefault();
    if (!cart || !("id" in cart) || !code.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await client.applyCoupon(cart.id, code.trim());
      await refreshCart();
      setCode("");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!cart || !("id" in cart)) return;
    setBusy(true);
    try {
      await client.removeCoupon(cart.id);
      await refreshCart();
    } finally {
      setBusy(false);
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between text-sm border border-border p-3">
        <span>
          Coupon <strong>{applied}</strong> applied
        </span>
        <button onClick={remove} disabled={busy} className="text-xs underline text-muted-foreground hover:text-foreground">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-none h-11"
        />
        <Button type="submit" variant="outline" disabled={busy || !code.trim()} className="rounded-none px-5 text-xs tracking-widest uppercase">
          Apply
        </Button>
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
    </form>
  );
}

interface PaymentData {
  clientSecret: string;
  provider: string;
  checkoutId: string;
  renderType?: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { cart, currency, storeInfo } = useStore();
  const upsell = (storeInfo as unknown as { upsell?: Record<string, boolean> })?.upsell;
  const showBumps = upsell?.checkoutOrderBumpEnabled !== false;

  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
    country: "US",
    phone: "",
  });

  const [step, setStep] = useState<"address" | "custom-fields" | "payment">("address");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [stripePromise, setStripePromise] =
    useState<ReturnType<typeof loadStripe> | null>(null);
  const [bumps, setBumps] = useState<Array<Parameters<typeof OrderBumpCard>[0]["bump"]>>([]);
  const [addedBumpIds, setAddedBumpIds] = useState<Set<string>>(new Set());
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(null);
  const [customFields, setCustomFields] = useState<CheckoutCustomFieldDefinition[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, unknown>>({});
  const [appliedSurcharges, setAppliedSurcharges] = useState<AppliedSurcharge[]>([]);
  const [surchargeAmount, setSurchargeAmount] = useState<number>(0);

  // Fetch order bumps once we have a checkoutId
  useEffect(() => {
    if (!showBumps || !payment?.checkoutId) return;
    client.getCheckoutBumps(payment.checkoutId)
      .then((res) => {
        const list = (res?.bumps ?? []) as Array<Parameters<typeof OrderBumpCard>[0]["bump"]>;
        setBumps(list);
      })
      .catch(() => setBumps([]));
  }, [showBumps, payment?.checkoutId]);

  // Track which bumps are already in cart
  useEffect(() => {
    if (!cart) return;
    const ids = new Set<string>();
    for (const item of cart.items) {
      const meta = (item as unknown as { metadata?: { isOrderBump?: boolean; bumpId?: string } }).metadata;
      if (meta?.isOrderBump && meta.bumpId) ids.add(meta.bumpId);
    }
    setAddedBumpIds(ids);
  }, [cart]);

  const totals = useMemo(() => {
    if (!cart || !("id" in cart)) return null;
    return getCartTotals(cart);
  }, [cart]);

  if (!cart || cart.items.length === 0) {
    return (
      <Layout>
        <div className="container-narrow py-28 text-center">
          <h1 className="font-serif text-4xl mb-4">No Items to Checkout</h1>
          <p className="text-muted-foreground mb-8">Your bag is empty.</p>
          <Button
            asChild
            size="lg"
            className="rounded-none px-10 py-6 text-sm tracking-[0.15em] uppercase btn-premium"
          >
            <Link to="/products">
              Start Shopping <ArrowRight className="ml-3 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const onField = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  async function startBrainerceCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // 1. Detect providers
      const { hasPayments, providers } = await client.getPaymentProviders();
      if (!hasPayments)
        throw new Error("Payment is not configured for this store yet.");

      // 2. Start checkout (guest or logged-in)
      let checkoutId: string;
      if (client.isCustomerLoggedIn() && cart && "id" in cart) {
        const co = await client.createCheckout({ cartId: cart.id });
        checkoutId = co.id;
      } else {
        const result = await client.startGuestCheckout();
        if (!result.tracked)
          throw new Error(
            "Checkout tracking is not enabled on this store. Enable it in Brainerce admin.",
          );
        checkoutId = result.checkoutId;
      }

      // 3. Set shipping address (returns shipping rates)
      const { rates: shippingRates } = await client.setShippingAddress(
        checkoutId,
        {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          line1: form.line1,
          line2: form.line2 || undefined,
          city: form.city,
          region: form.region,
          postalCode: form.postalCode,
          country: form.country,
          phone: form.phone || undefined,
        },
      );

      const rateList = shippingRates ?? [];
      setRates(rateList);

      // 4. Pick a shipping method (first one by default)
      let rateId = selectedRateId;
      if (rateList.length > 0) {
        rateId = rateList[0].id;
        setSelectedRateId(rateId);
        await client.selectShippingMethod(checkoutId, rateId);
      }

      // 5. Check for custom checkout fields
      let fields: CheckoutCustomFieldDefinition[] = [];
      try {
        fields = await client.getCheckoutCustomFields(checkoutId);
      } catch (e) {
        console.warn("custom fields", e);
      }

      if (fields.length > 0) {
        setCustomFields(fields);
        // initialize defaults
        const initial: Record<string, unknown> = {};
        for (const f of fields) {
          if (f.type === "BOOLEAN") initial[f.key] = false;
          else initial[f.key] = "";
        }
        setCustomFieldValues(initial);
        setPendingCheckoutId(checkoutId);
        setStep("custom-fields");
        return;
      }

      // No custom fields → go straight to payment
      await initPayment(checkoutId, providers);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start checkout";
      setError(msg);
      toast({ title: "Checkout error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function initPayment(
    checkoutId: string,
    providers: Awaited<ReturnType<typeof client.getPaymentProviders>>["providers"],
  ) {
    const intent = await client.createPaymentIntent(checkoutId, {
      successUrl: `${window.location.origin}/order-confirmation?checkout_id=${checkoutId}`,
      cancelUrl: `${window.location.origin}/checkout?error=payment_cancelled`,
    });

    if (intent.provider === "stripe") {
      const stripeProvider = providers.find((p) => p.provider === "stripe");
      if (stripeProvider) {
        setStripePromise(
          loadStripe(stripeProvider.publicKey, {
            stripeAccount: stripeProvider.stripeAccountId,
          }),
        );
      }
    }

    setPayment({
      clientSecret: intent.clientSecret,
      provider: intent.provider,
      checkoutId,
      renderType: intent.clientSdk?.renderType,
    });
    setStep("payment");
  }

  async function applyCustomFields() {
    if (!pendingCheckoutId) return;
    setError(null);
    setLoading(true);
    try {
      const updated = (await client.setCheckoutCustomFields(
        pendingCheckoutId,
        customFieldValues,
      )) as unknown as {
        appliedSurcharges?: AppliedSurcharge[];
        surchargeAmount?: string | number;
      };
      setAppliedSurcharges(updated.appliedSurcharges ?? []);
      setSurchargeAmount(parseFloat(String(updated.surchargeAmount ?? 0)) || 0);

      const { providers } = await client.getPaymentProviders();
      await initPayment(pendingCheckoutId, providers);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save selections";
      setError(msg);
      toast({ title: "Could not save options", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="container-full py-6 border-b border-border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Link to="/cart" className="hover:text-foreground">
            Your Bag
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground">Checkout</span>
        </div>
      </div>

      <section className="py-10 md:py-16">
        <div className="container-full">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-4xl md:text-5xl mb-12"
          >
            Checkout
          </motion.h1>

          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7">
              {error && (
                <div className="mb-6 flex items-start gap-3 p-4 border border-destructive/30 bg-destructive/5 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-destructive" />
                  <span>{error}</span>
                </div>
              )}

              {step === "address" && (
                <form onSubmit={startBrainerceCheckout} className="space-y-8">
                  <div>
                    <h2 className="font-serif text-xl mb-6">Contact</h2>
                    <Input
                      name="email"
                      type="email"
                      required
                      placeholder="Email"
                      value={form.email}
                      onChange={onField}
                      className="rounded-none h-12"
                    />
                  </div>

                  <div>
                    <h2 className="font-serif text-xl mb-6">Shipping Address</h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Input name="firstName" required placeholder="First name" value={form.firstName} onChange={onField} className="rounded-none h-12" />
                      <Input name="lastName" required placeholder="Last name" value={form.lastName} onChange={onField} className="rounded-none h-12" />
                    </div>
                    <Input name="line1" required placeholder="Street address" value={form.line1} onChange={onField} className="rounded-none h-12 mt-4" />
                    <Input name="line2" placeholder="Apt, suite (optional)" value={form.line2} onChange={onField} className="rounded-none h-12 mt-4" />
                    <div className="grid sm:grid-cols-3 gap-4 mt-4">
                      <Input name="city" required placeholder="City" value={form.city} onChange={onField} className="rounded-none h-12" />
                      <Input name="region" required placeholder="State / Region" value={form.region} onChange={onField} className="rounded-none h-12" />
                      <Input name="postalCode" required placeholder="Postal code" value={form.postalCode} onChange={onField} className="rounded-none h-12" />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 mt-4">
                      <Input name="country" required placeholder="Country (e.g. US)" value={form.country} onChange={onField} className="rounded-none h-12" />
                      <Input name="phone" placeholder="Phone (optional)" value={form.phone} onChange={onField} className="rounded-none h-12" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading}
                    className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium"
                  >
                    {loading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Preparing payment…</>
                    ) : (
                      <>Continue to Payment <ArrowRight className="ml-3 w-4 h-4" /></>
                    )}
                  </Button>
                </form>
              )}

              {step === "payment" && payment && (
                <div className="space-y-6">
                  {rates.length > 0 && (
                    <div>
                      <h2 className="font-serif text-xl mb-4">Shipping Method</h2>
                      <div className="space-y-2">
                        {rates.map((r) => (
                          <label
                            key={r.id}
                            className={`flex items-center justify-between p-4 border cursor-pointer ${selectedRateId === r.id ? "border-primary" : "border-border"}`}
                          >
                            <span className="flex items-center gap-3 text-sm">
                              <input
                                type="radio"
                                name="rate"
                                checked={selectedRateId === r.id}
                                onChange={async () => {
                                  setSelectedRateId(r.id);
                                  await client.selectShippingMethod(payment.checkoutId, r.id);
                                }}
                              />
                              <span>
                                <span className="font-medium">{r.name}</span>
                                {r.estimatedDays != null && (
                                  <span className="text-muted-foreground"> · ~{r.estimatedDays} days</span>
                                )}
                              </span>
                            </span>
                            <span>{formatPrice(String(r.price), { currency })}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h2 className="font-serif text-xl mb-4">Payment</h2>
                    <PaymentRenderer
                      payment={payment}
                      stripePromise={stripePromise}
                      onComplete={() => navigate(`/order-confirmation?checkout_id=${payment.checkoutId}`)}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-5">
              <div className="bg-linen p-8 lg:sticky lg:top-28">
                <h2 className="font-serif text-2xl mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => {
                    const name = getCartItemName(item);
                    const image = getCartItemImage(item);
                    const lineTotal = parseFloat(item.unitPrice) * item.quantity;
                    return (
                      <div
                        key={`${item.product.id}-${item.variant?.id ?? "_"}`}
                        className="flex gap-4"
                      >
                        <div className="w-16 h-20 bg-muted/30 overflow-hidden">
                          {image ? (
                            <img src={image} alt={name} className="w-full h-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium line-clamp-1">{name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Qty: {item.quantity}</p>
                          <p className="text-sm mt-1">{formatPrice(String(lineTotal), { currency })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {showBumps && bumps.length > 0 && payment?.checkoutId && (
                  <div className="border-t border-border pt-4 mb-4 space-y-3">
                    <p className="text-[11px] font-semibold tracking-[0.25em] uppercase text-muted-foreground">
                      Add to your order
                    </p>
                    {bumps.map((b) => (
                      <OrderBumpCard
                        key={b.id}
                        bump={b}
                        cartId={payment.checkoutId}
                        added={addedBumpIds.has(b.id)}
                      />
                    ))}
                  </div>
                )}

                {totals && (
                  <>
                    <div className="border-t border-border pt-4 mb-4">
                      <CouponInput />
                    </div>
                    <div className="border-t border-border pt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>{formatPrice(String(totals.subtotal), { currency })}</span>
                      </div>
                      {totals.discount > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Discount</span>
                          <span>-{formatPrice(String(totals.discount), { currency })}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-serif text-xl border-t border-border pt-4">
                        <span>Total</span>
                        <span>{formatPrice(String(totals.total), { currency })}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

/* ----- Payment renderer ----- */

function PaymentRenderer({
  payment,
  stripePromise,
  onComplete,
}: {
  payment: PaymentData;
  stripePromise: ReturnType<typeof loadStripe> | null;
  onComplete: () => void;
}) {
  if (payment.provider === "sandbox") {
    return (
      <div className="p-6 border border-border bg-muted/20">
        <p className="font-medium mb-2">Test mode</p>
        <p className="text-sm text-muted-foreground mb-4">
          No real payment will be charged. Click below to complete the test order.
        </p>
        <Button
          onClick={async () => {
            await client.completeGuestCheckout(payment.checkoutId);
            onComplete();
          }}
          className="rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium"
        >
          Complete Test Order
        </Button>
      </div>
    );
  }

  if (payment.renderType === "iframe") {
    return (
      <iframe
        src={payment.clientSecret}
        title="Payment"
        allow="payment"
        style={{ width: "100%", height: 640, border: 0 }}
      />
    );
  }

  if (payment.provider === "stripe" && stripePromise) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret }}>
        <StripeForm checkoutId={payment.checkoutId} onComplete={onComplete} />
      </Elements>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">
      Unsupported payment provider: {payment.provider}
    </p>
  );
}

function StripeForm({
  checkoutId,
  onComplete,
}: {
  checkoutId: string;
  onComplete: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError(null);

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/order-confirmation?checkout_id=${checkoutId}`,
      },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed");
      setLoading(false);
      return;
    }
    onComplete();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="text-sm text-destructive p-3 border border-destructive/30 bg-destructive/5">
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-none py-6 text-sm tracking-[0.15em] uppercase btn-premium"
      >
        {loading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
        ) : (
          "Pay Now"
        )}
      </Button>
    </form>
  );
}

export default Checkout;
