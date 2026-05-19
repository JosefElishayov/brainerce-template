import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, Loader2, BadgeCheck, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { client } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductReview = Awaited<ReturnType<typeof client.listProductReviews>>["data"][number];
type MyProductReview = Awaited<ReturnType<typeof client.getMyProductReview>>;

interface Props {
  productId: string;
}

function Stars({
  value,
  size = 16,
  onChange,
  interactive = false,
}: {
  value: number;
  size?: number;
  onChange?: (n: number) => void;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const Icon = (
          <Star
            style={{ width: size, height: size }}
            className={cn(
              "transition-colors",
              filled ? "fill-primary text-primary" : "text-muted-foreground/40",
            )}
          />
        );
        if (!interactive) return <span key={n}>{Icon}</span>;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange?.(n)}
            className="p-0.5 hover:scale-110 transition-transform"
            aria-label={`${n} stars`}
          >
            {Icon}
          </button>
        );
      })}
    </div>
  );
}

export function ProductReviews({ productId }: Props) {
  const { loggedIn } = useStore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [meta, setMeta] = useState<{ total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [my, setMy] = useState<MyProductReview | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await client.listProductReviews(productId, { page: 1, limit: 20 });
      setReviews(res.data);
      setMeta({ total: res.meta?.total ?? res.data.length });
    } catch (err) {
      console.error("listProductReviews", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMy = async () => {
    if (!loggedIn) {
      setMy(null);
      return;
    }
    try {
      const res = await client.getMyProductReview(productId);
      setMy(res);
      if (res.myReview) {
        setRating(res.myReview.rating);
        setBody(res.myReview.body ?? "");
      }
    } catch (err) {
      console.error("getMyProductReview", err);
    }
  };

  useEffect(() => {
    load();
  }, [productId]);

  useEffect(() => {
    loadMy();
  }, [productId, loggedIn]);

  const submit = async () => {
    setSubmitting(true);
    try {
      if (my?.myReview) {
        await client.updateMyProductReview(productId, { rating, body: body || undefined });
        toast({ title: t("reviews.reviewUpdated") });
      } else {
        await client.submitProductReview(productId, { rating, body: body || undefined });
        toast({ title: t("reviews.reviewThanks") });
      }
      setShowForm(false);
      await Promise.all([load(), loadMy()]);
    } catch (err) {
      toast({
        title: t("reviews.couldNotSubmit"),
        description: err instanceof Error ? err.message : t("reviews.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async () => {
    if (!confirm(t("reviews.confirmDelete"))) return;
    try {
      await client.deleteMyProductReview(productId);
      setBody("");
      setRating(5);
      await Promise.all([load(), loadMy()]);
      toast({ title: t("reviews.reviewDeleted") });
    } catch (err) {
      toast({
        title: t("reviews.couldNotDelete"),
        description: err instanceof Error ? err.message : t("reviews.tryAgain"),
        variant: "destructive",
      });
    }
  };

  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const renderEligibilityCTA = () => {
    if (!loggedIn) {
      return (
        <p className="text-sm text-muted-foreground">
          <Link to="/login" className="underline underline-offset-4 text-foreground">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      );
    }
    if (!my) return null;
    if (!my.eligible) {
      const reasons: Record<string, string> = {
        no_eligible_order: "Only customers who purchased this product can review it.",
        reviews_disabled: "Reviews are currently disabled for this store.",
        product_not_found: "This product cannot be reviewed.",
      };
      return (
        <p className="text-sm text-muted-foreground">
          {reasons[my.reason ?? ""] ?? "You can't review this product right now."}
        </p>
      );
    }
    if (my.myReview && !showForm) {
      return (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowForm(true)}
            className="rounded-none text-xs tracking-[0.15em] uppercase"
          >
            <Pencil className="w-3.5 h-3.5 mr-2" /> Edit my review
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={remove}
            className="rounded-none text-xs tracking-[0.15em] uppercase text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
          </Button>
        </div>
      );
    }
    if (!showForm) {
      return (
        <Button
          onClick={() => setShowForm(true)}
          className="rounded-none text-xs tracking-[0.15em] uppercase btn-premium"
        >
          Write a Review
        </Button>
      );
    }
    return null;
  };

  return (
    <section className="border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Summary */}
          <div className="md:col-span-1">
            <p className="text-[11px] font-semibold tracking-[0.3em] uppercase text-muted-foreground mb-3">
              Customer Reviews
            </p>
            <h2 className="font-serif text-3xl md:text-4xl mb-5">What guests are saying</h2>
            <div className="flex items-center gap-3 mb-2">
              <Stars value={avg} size={20} />
              <span className="text-sm text-muted-foreground">
                {avg.toFixed(1)} · {meta?.total ?? 0} review{(meta?.total ?? 0) === 1 ? "" : "s"}
              </span>
            </div>
            <div className="mt-8">{renderEligibilityCTA()}</div>
          </div>

          {/* List + form */}
          <div className="md:col-span-2 space-y-8">
            {showForm && (
              <div className="border border-border p-6 bg-linen">
                <h3 className="font-serif text-xl mb-4">
                  {my?.myReview ? "Edit your review" : "Write a review"}
                </h3>
                <div className="mb-4">
                  <span className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
                    Your rating
                  </span>
                  <Stars value={rating} size={28} interactive onChange={setRating} />
                </div>
                <div className="mb-4">
                  <span className="block text-[11px] font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-2">
                    Your review (optional)
                  </span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 2000))}
                    rows={5}
                    placeholder="Share your thoughts about this piece…"
                    className="w-full border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">{body.length}/2000</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={submit}
                    disabled={submitting || rating < 1}
                    className="rounded-none text-xs tracking-[0.15em] uppercase btn-premium"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting…
                      </>
                    ) : my?.myReview ? (
                      "Update Review"
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowForm(false)}
                    className="rounded-none text-xs tracking-[0.15em] uppercase"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                No reviews yet — be the first to share your thoughts.
              </p>
            ) : (
              <ul className="space-y-8">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-border pb-8 last:border-0">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <Stars value={r.rating} size={14} />
                        <span className="text-sm font-medium">{r.authorName}</span>
                        {r.verifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.2em] uppercase text-primary">
                            <BadgeCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {r.body && (
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                        {r.body}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
