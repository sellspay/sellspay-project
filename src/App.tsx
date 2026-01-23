import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth";
import MainLayout from "@/components/layout/MainLayout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import CreateProduct from "./pages/CreateProduct";
import Creators from "./pages/Creators";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Tools from "./pages/Tools";
import AudioCutter from "./pages/tools/AudioCutter";
import AudioRecorder from "./pages/tools/AudioRecorder";
import AudioJoiner from "./pages/tools/AudioJoiner";
import VideoToAudio from "./pages/tools/VideoToAudio";
import AudioConverter from "./pages/tools/AudioConverter";
import WaveformGenerator from "./pages/tools/WaveformGenerator";
import Community from "./pages/Community";
import HireEditors from "./pages/HireEditors";
import WorkWithEditors from "./pages/WorkWithEditors";
import Notifications from "./pages/Notifications";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Refunds from "./pages/Refunds";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Auth pages without layout */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            
            {/* Main pages with layout */}
            <Route path="/" element={<MainLayout><Home /></MainLayout>} />
            <Route path="/products" element={<MainLayout><Products /></MainLayout>} />
            <Route path="/product/:id" element={<MainLayout><ProductDetail /></MainLayout>} />
            <Route path="/create-product" element={<MainLayout><CreateProduct /></MainLayout>} />
            <Route path="/creators" element={<MainLayout><Creators /></MainLayout>} />
            <Route path="/profile" element={<MainLayout><Profile /></MainLayout>} />
            <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
            <Route path="/admin" element={<MainLayout><Admin /></MainLayout>} />
            <Route path="/community" element={<MainLayout><Community /></MainLayout>} />
            <Route path="/hire-editors" element={<MainLayout><HireEditors /></MainLayout>} />
            <Route path="/work-with-editors" element={<MainLayout><WorkWithEditors /></MainLayout>} />
            <Route path="/notifications" element={<MainLayout><Notifications /></MainLayout>} />
            <Route path="/terms" element={<MainLayout><Terms /></MainLayout>} />
            <Route path="/privacy" element={<MainLayout><Privacy /></MainLayout>} />
            <Route path="/refunds" element={<MainLayout><Refunds /></MainLayout>} />
            <Route path="/@:username" element={<MainLayout><Profile /></MainLayout>} />
            
            {/* Tools */}
            <Route path="/tools" element={<MainLayout><Tools /></MainLayout>} />
            <Route path="/tools/audio-cutter" element={<MainLayout><AudioCutter /></MainLayout>} />
            <Route path="/tools/audio-recorder" element={<MainLayout><AudioRecorder /></MainLayout>} />
            <Route path="/tools/audio-joiner" element={<MainLayout><AudioJoiner /></MainLayout>} />
            <Route path="/tools/video-to-audio" element={<MainLayout><VideoToAudio /></MainLayout>} />
            <Route path="/tools/audio-converter" element={<MainLayout><AudioConverter /></MainLayout>} />
            <Route path="/tools/waveform-generator" element={<MainLayout><WaveformGenerator /></MainLayout>} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
