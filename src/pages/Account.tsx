import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, LogOut, Package } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CustomerProfile, Order } from "brainerce";
import { formatPrice } from "brainerce";
import { Layout } from "@/components/Layout";
import { SEO } from "@/components/SEO";

const ACCOUNT_SEO = (
  <SEO
    title="Your Account — Maison"
    description="Manage your Maison profile, view past orders, and update your delivery details in one place."
    path="/account"
    noIndex
  />
);
import { Button } from "@/components/ui/button";
import { client, setCustomerToken } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

const Account = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loggedIn, setLoggedIn, refreshCart, currency } = useStore();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loggedIn) {
      navigate("/login");
      return;
    }
    (async () => {
      try {
        const [p, o] = await Promise.all([
          client.getMyProfile(),
          client.getMyOrders({ page: 1, limit: 10 }),
        ]);
        setProfile(p);
        setOrders(o.data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : t("account.failedLoad"));
      } finally {
        setLoading(false);
      }
    })();
  }, [loggedIn, navigate]);

  async function handleLogout() {
    setCustomerToken(null);
    setLoggedIn(false);
    await refreshCart();
    navigate("/");
  }

  if (loading) {
    return (
      <Layout>
        <div className="py-28 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 md:py-20">
        <div className="container-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-end justify-between gap-6 mb-12"
          >
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-2">
                {t("account.myAccount")}
              </p>
              <h1 className="font-serif text-4xl md:text-5xl">
                {t("account.hello", { name: profile?.firstName || t("account.friend") })}
              </h1>
              {profile?.email && (
                <p className="text-sm text-muted-foreground mt-2">{profile.email}</p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="rounded-none px-6 py-5 text-xs tracking-[0.15em] uppercase"
            >
              <LogOut className="w-4 h-4 mr-2" /> {t("account.signOut")}
            </Button>
          </motion.div>

          {error && (
            <div className="mb-8 p-4 border border-destructive/30 bg-destructive/5 text-sm">{error}</div>
          )}

          <div>
            <h2 className="font-serif text-2xl mb-6">{t("account.orderHistory")}</h2>

            {orders.length === 0 ? (
              <div className="border border-border p-12 text-center">
                <Package className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-6">
                  {t("account.noOrders")}
                </p>
                <Button
                  asChild
                  className="rounded-none px-8 py-5 text-xs tracking-[0.15em] uppercase btn-premium"
                >
                  <Link to="/products">{t("account.startShopping")}</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-border p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">
                          {t("account.order")} {order.orderNumber}
                        </p>
                        <p className="text-sm mt-1">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-muted text-xs tracking-widest uppercase">
                          {order.status}
                        </span>
                        <p className="font-serif text-xl mt-2">
                          {formatPrice(String(order.totalAmount), { currency })}
                        </p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="border-t border-border pt-4 space-y-3">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex gap-4 text-sm">
                            {item.image && (
                              <div className="w-14 h-14 bg-muted/30 overflow-hidden flex-shrink-0">
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{t("account.qty")}: {item.quantity}</p>
                            </div>
                            <p>{formatPrice(String(item.unitPrice), { currency })}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Account;
