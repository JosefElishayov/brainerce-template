## Goal
Support the new "Morning" payment provider in the checkout flow. The Brainerce SDK already exposes provider-agnostic rendering via `clientSdk.renderType`. The current `PaymentRenderer` only handles `stripe`, `sandbox`, and `iframe` and falls through to "unsupported" for everything else (including Morning).

## Changes

### `src/pages/Checkout.tsx` — `PaymentRenderer`
Refactor to branch primarily on `payment.renderType` (the SDK's recommended pattern) instead of provider name:

1. `renderType === "sandbox"` (or provider `sandbox`) → keep existing test-mode UI.
2. `renderType === "redirect"` → render a "Pay Now" button that calls `window.location.href = payment.clientSecret`. Show a short note that the customer will be redirected to the provider to complete payment. This covers Morning (and any future redirect-based provider).
3. `renderType === "iframe"` → keep existing iframe block. Detect Brainerce-hosted embed (`/embed/` in URL) and render inline; otherwise still inline (modal not needed for our layout).
4. `renderType === "sdk-widget"` for `provider === "stripe"` → keep existing Stripe Elements path.
5. `renderType === "sdk-widget"` for other providers (generic) → dynamically load `clientSdk.scriptUrl` via a `<script>` tag and mount a `<div id={clientSdk.containerId}>`. Not strictly needed for Morning but covers Grow/PayPal cleanly.
6. Anything else → existing "unsupported provider" fallback.

Also extend `PaymentData` to carry `clientSdk` (`scriptUrl`, `containerId`) so the widget path has what it needs, and pass it through from `initPayment`.

### `src/i18n/locales/en.ts` and `src/i18n/locales/he.ts`
Add new keys used by the redirect path:
- `checkout.redirectNotice` — "You'll be redirected to {{provider}} to complete payment securely." / Hebrew equivalent.
- `checkout.redirectToPay` — "Continue to Payment" / "המשך לתשלום".
- `checkout.redirecting` — "Redirecting…" / "מעביר לתשלום…".

No other files need to change — provider detection (`getPaymentProviders`) and intent creation already work for Morning out of the box.

## Out of scope
- No backend / SDK changes.
- No new dependencies.
- Order confirmation polling (`OrderConfirmation.tsx`) already handles the post-redirect `checkout_id` return.
