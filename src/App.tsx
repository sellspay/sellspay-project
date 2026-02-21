import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import { UsernameSetupDialog } from "@/components/auth/UsernameSetupDialog";
import ScrollToTop from "@/components/ScrollToTop";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages — prevents massive bundle from crashing the preview
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const OAuthCallback = lazy(() => import("./pages/OAuthCallback"));
const Signup = lazy(() => import("./pages/Signup"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Products = lazy(() => import("./pages/Products"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const CreateProduct = lazy(() => import("./pages/CreateProduct"));
const EditProduct = lazy(() => import("./pages/EditProduct"));
const Creators = lazy(() => import("./pages/Creators"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Tools = lazy(() => import("./pages/Tools"));
const Community = lazy(() => import("./pages/Community"));
const Discord = lazy(() => import("./pages/community/Discord"));
const Spotlight = lazy(() => import("./pages/community/Spotlight"));
const Updates = lazy(() => import("./pages/community/Updates"));
const FAQ = lazy(() => import("./pages/FAQ"));
const HireProfessionals = lazy(() => import("./pages/HireProfessionals"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Notifications = lazy(() => import("./pages/Notifications"));
const SubscriptionPlans = lazy(() => import("./pages/SubscriptionPlans"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Billing = lazy(() => import("./pages/Billing"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refunds = lazy(() => import("./pages/Refunds"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AIBuilder = lazy(() => import("./pages/AIBuilder"));
const SellerAgreement = lazy(() => import("./pages/SellerAgreement"));
const ProhibitedItems = lazy(() => import("./pages/ProhibitedItems"));
const Cart = lazy(() => import("./pages/Cart"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function AtUsernameRoute() {
  const { atUsername } = useParams<{ atUsername?: string }>();
  const value = atUsername ?? "";

  // Only treat /@username as a profile route; otherwise fall through to 404
  if (!value.startsWith("@") || value.length < 2) {
    return (
      <Suspense fallback={<PageLoader />}>
        <NotFound />
      </Suspense>
    );
  }

  return (
    <MainLayout hideFooter>
      <Suspense fallback={<PageLoader />}>
        <Profile />
      </Suspense>
    </MainLayout>
  );
}

const App = () => (
  <GlobalErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UsernameSetupDialog />
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Auth pages without layout */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/~oauth/callback" element={<OAuthCallback />} />
              
              {/* Main pages with layout */}
              <Route path="/" element={<MainLayout><Home /></MainLayout>} />
              <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
              <Route path="/product/:idOrSlug" element={<MainLayout><ProductDetail /></MainLayout>} />
              <Route path="/p/:idOrSlug" element={<MainLayout><ProductDetail /></MainLayout>} />
              <Route path="/create-product" element={<MainLayout><CreateProduct /></MainLayout>} />
              <Route path="/edit-product/:id" element={<MainLayout><EditProduct /></MainLayout>} />
              <Route path="/creators" element={<MainLayout><Creators /></MainLayout>} />
              <Route path="/profile" element={<MainLayout hideFooter><Profile /></MainLayout>} />
              <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
              <Route path="/admin" element={<MainLayout><Admin /></MainLayout>} />
              <Route path="/community" element={<MainLayout><Community /></MainLayout>} />
              <Route path="/community/updates" element={<MainLayout><Updates /></MainLayout>} />
              <Route path="/community/discord" element={<MainLayout><Discord /></MainLayout>} />
              <Route path="/community/spotlight" element={<MainLayout><Spotlight /></MainLayout>} />
              <Route path="/faq" element={<MainLayout><FAQ /></MainLayout>} />
              <Route path="/hire-professionals" element={<MainLayout><HireProfessionals /></MainLayout>} />
              <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
              <Route path="/notifications" element={<MainLayout><Notifications /></MainLayout>} />
              <Route path="/subscription-plans" element={<SubscriptionPlans />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/terms" element={<MainLayout><Terms /></MainLayout>} />
              <Route path="/privacy" element={<MainLayout><Privacy /></MainLayout>} />
              <Route path="/refunds" element={<MainLayout><Refunds /></MainLayout>} />
              <Route path="/prohibited-items" element={<MainLayout><ProhibitedItems /></MainLayout>} />
              <Route path="/onboarding/seller-agreement" element={<MainLayout><SellerAgreement /></MainLayout>} />
              <Route path="/cart" element={<MainLayout><Cart /></MainLayout>} />
              <Route path="/ai-builder" element={<AIBuilder />} />
              {/* Instagram-style profile route: /@username */}
              <Route path="/:atUsername" element={<AtUsernameRoute />} />
              
              {/* Studio */}
              <Route path="/studio" element={<Tools />} />
              <Route path="/studio/:toolId" element={<Tools />} />
              {/* Legacy /tools redirects */}
              <Route path="/tools" element={<Tools />} />
              <Route path="/tools/*" element={<Tools />} />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
