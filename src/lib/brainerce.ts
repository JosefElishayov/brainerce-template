import { BrainerceClient } from "brainerce";

export const SALES_CHANNEL_ID = "vc_7ZPigJbqSn7VUtQlPS10K";

export const client = new BrainerceClient({
  salesChannelId: SALES_CHANNEL_ID,
});

// Restore customer token immediately so SDK calls are authenticated
if (typeof window !== "undefined") {
  const token = localStorage.getItem("customerToken");
  if (token) client.setCustomerToken(token);
}

export function setCustomerToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("customerToken", token);
    client.setCustomerToken(token);
  } else {
    localStorage.removeItem("customerToken");
    client.clearCustomerToken();
  }
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("customerToken");
}
