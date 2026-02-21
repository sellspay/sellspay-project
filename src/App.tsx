import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import { UsernameSetupDialog } from "@/components/auth/UsernameSetupDialog";
import ScrollToTop from "@/components/ScrollToTop";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OAuthCallback from "./pages/OAuthCallback";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import CreateProduct from "./pages/CreateProduct";
import EditProduct from "./pages/EditProduct";
import Creators from "./pages/Creators";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Tools from "./pages/Tools";
import Community from "./pages/Community";
import Discord from "./pages/community/Discord";
import Spotlight from "./pages/community/Spotlight";
import Updates from "./pages/community/Updates";
import FAQ from "./pages/FAQ";
import HireEditors from "./pages/HireEditors";
import Dashboard from "./pages/Dashboard";
import Notifications from "./pages/Notifications";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import Pricing from "./pages/Pricing";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refunds from "./pages/Refunds";
import NotFound from "./pages/NotFound";
import AIBuilder from "./pages/AIBuilder";
import SellerAgreement from "./pages/SellerAgreement";
import ProhibitedItems from "./pages/ProhibitedItems";
import Cart from "./pages/Cart";

const queryClient = new QueryClient();

function AtUsernameRoute() {
  const { atUsername } = useParams<{ atUsername?: string }>();
  const value = atUsername ?? "";

  // Only treat /@username as a profile route; otherwise fall through to 404
  if (!value.startsWith("@") || value.length < 2) {
    return <NotFound />;
  }

  return (
    <MainLayout hideFooter>
      {/* Profile reads the param from the URL */}
      <Profile />
    </MainLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <UsernameSetupDialog />
        <BrowserRouter>
          <ScrollToTop />
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
            <Route path="/hire-editors" element={<MainLayout><HireEditors /></MainLayout>} />
            <Route path="/dashboard" element={<MainLayout><Dashboard /></MainLayout>} />
            <Route path="/notifications" element={<MainLayout><Notifications /></MainLayout>} />
            <Route path="/subscription-plans" element={<SubscriptionPlans />} />
            <Route path="/pricing" element={<Pricing />} />
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
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
