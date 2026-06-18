import { useEffect } from "react";
import { BrainerceBot } from "brainerce/bot";
import { client, SALES_CHANNEL_ID } from "@/lib/brainerce";
import { useStore } from "@/contexts/StoreContext";

export function BrainerceBotWidget() {
  const { refreshCart } = useStore();

  useEffect(() => {
    let instance: Awaited<ReturnType<typeof BrainerceBot.mount>> | null = null;
    let cancelled = false;

    BrainerceBot.mount({
      connectionId: SALES_CHANNEL_ID,
      onAddToCart: async ({ productId, variantId, quantity }) => {
        try {
          await client.smartAddToCart({
            productId,
            variantId: variantId ?? undefined,
            quantity,
          });
          await refreshCart();
          return true;
        } catch (e) {
          console.error("bot add to cart failed", e);
          return false;
        }
      },
    })
      .then((bot) => {
        if (cancelled) {
          bot?.destroy();
        } else {
          instance = bot;
        }
      })
      .catch((e) => console.error("BrainerceBot.mount failed", e));

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, [refreshCart]);

  return null;
}
