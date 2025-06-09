
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PauseLog from "./pages/PauseLog";
import About from "./pages/About";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import GreaterJoyFund from "./pages/GreaterJoyFund";
import NotFound from "./pages/NotFound";
import DonationSuccess from "./pages/DonationSuccess";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/AuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";

const queryClient = new QueryClient();

const App = () => {
  console.log('App component rendering');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/" element={
                    <AuthGuard>
                      <Index />
                    </AuthGuard>
                  } />
                  <Route path="/pause-log" element={
                    <AuthGuard>
                      <PauseLog />
                    </AuthGuard>
                  } />
                  <Route path="/about" element={
                    <AuthGuard>
                      <About />
                    </AuthGuard>
                  } />
                  <Route path="/greater-joy-fund" element={
                    <AuthGuard>
                      <GreaterJoyFund />
                    </AuthGuard>
                  } />
                  <Route path="/donation-success" element={
                    <AuthGuard>
                      <DonationSuccess />
                    </AuthGuard>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
