import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PauseLog from "./pages/PauseLog";
import About from "./pages/About";
import Courses from "./pages/Courses";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import GreaterJoyFund from "./pages/GreaterJoyFund";
import NotFound from "./pages/NotFound";
import DonationSuccess from "./pages/DonationSuccess";
import Bookmarklet from "./pages/Bookmarklet";
import OfflineIndicator from "./components/OfflineIndicator";

import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import AuthGuard from "./components/AuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import MobileDebugger from "./components/MobileDebugger";

import { pushNotificationService } from "./services/pushNotificationService";
import { offlineSyncService } from "./services/offlineSyncService";

const queryClient = new QueryClient();

// Component to handle scroll restoration on route changes
const ScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    
    scrollToTop();
    
    // Additional scroll restoration with delay for mobile
    setTimeout(scrollToTop, 0);
    setTimeout(scrollToTop, 100);
  }, [location]);
  
  return null;
};

const App = () => {
  // Initialize push notifications on app start
  useEffect(() => {
    let mounted = true;
    
    const initializePushNotifications = async () => {
      try {
        if (!mounted) return;
        
        await pushNotificationService.initialize();
      } catch (error) {
        if (mounted) {
          console.error('Failed to initialize push notifications:', error);
        }
      }
    };

    initializePushNotifications();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize offline sync service
  useEffect(() => {
    console.log('🔄 Initializing offline sync service');
    offlineSyncService.startPeriodicSync();
  }, []);
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <MobileDebugger />
              <OfflineIndicator />
              <Toaster />
              <Sonner />
              
              <BrowserRouter>
                <ScrollToTop />
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
                  <Route path="/courses" element={
                    <AuthGuard>
                      <Courses />
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
                  <Route path="/bookmarklet" element={
                    <AuthGuard>
                      <Bookmarklet />
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
