import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { StoreProvider } from "./contexts/StoreContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import { RegionProvider } from "./contexts/RegionContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import OAuthCallback from "./pages/OAuthCallback";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";
import { BrainerceBotWidget } from "./components/BrainerceBotWidget";

const queryClient = new QueryClient();

const SUPPORTED_LANGS = ["en", "he"] as const;
const LOCALE_STORAGE_KEY = "storeLocale";

function detectInitialLang(): "en" | "he" {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored && (SUPPORTED_LANGS as readonly string[]).includes(stored)) {
    return stored as "en" | "he";
  }
  const nav = navigator.language?.toLowerCase() || "en";
  return nav.startsWith("he") ? "he" : "en";
}

function resolveBasename(): string {
  if (typeof window === "undefined") return "/en";
  const segments = window.location.pathname.split("/").filter(Boolean);
  const first = segments[0];
  if (first && (SUPPORTED_LANGS as readonly string[]).includes(first)) {
    return `/${first}`;
  }
  // Inject language prefix into the current URL before the router mounts
  const lang = detectInitialLang();
  const rest = window.location.pathname === "/" ? "" : window.location.pathname;
  const newPath = `/${lang}${rest}${window.location.search}${window.location.hash}`;
  window.history.replaceState(null, "", newPath);
  return `/${lang}`;
}

const BASENAME = resolveBasename();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={BASENAME}>
        <LocaleProvider>
          <StoreProvider>
            <RegionProvider>
              <ScrollToTop />
              <BrainerceBotWidget />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<OAuthCallback />} />
                <Route path="/account" element={<Account />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </RegionProvider>
          </StoreProvider>
        </LocaleProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
