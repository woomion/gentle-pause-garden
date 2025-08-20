
import React, { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PauseLog from "./pages/PauseLog";
import About from "./pages/About";
// import Courses from "./pages/Courses";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import NotFound from "./pages/NotFound";
import Bookmarklet from "./pages/Bookmarklet";
import GetApp from "./pages/GetApp";
import OfflineIndicator from "./components/OfflineIndicator";

import PWAInstallBanner from "./components/PWAInstallBanner";

import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./components/ThemeProvider";
import AuthGuard from "./components/AuthGuard";
import ErrorBoundary from "./components/ErrorBoundary";
import MobileDebugger from "./components/MobileDebugger";

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
  const [appError, setAppError] = useState<string | null>(null);

  // Add mobile debugging immediately
  useEffect(() => {
    console.log('🚀 App starting - User Agent:', navigator.userAgent);
    console.log('🚀 App starting - Platform:', navigator.platform);
    console.log('🚀 App starting - Window size:', window.innerWidth, 'x', window.innerHeight);
    console.log('🚀 App starting - Location:', window.location.href);
  }, []);

  // Initialize push notifications AFTER app loads, with comprehensive error handling
  useEffect(() => {
    let mounted = true;
    
    // Delay push notification initialization to avoid blocking app startup
    const initializePushNotifications = async () => {
      try {
        console.log('🔔 Starting push notification initialization...');
        
        if (!mounted) {
          console.log('🔔 Component unmounted, skipping push notification init');
          return;
        }
        
        // Add a small delay to ensure app is fully loaded
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        if (!mounted) {
          console.log('🔔 Component unmounted during delay, skipping push notification init');
          return;
        }
        
        // Push notifications removed - using web notifications instead
        const success = true;
        console.log('🔔 Push notification initialization result:', success);
        
      } catch (error) {
        console.error('❌ Failed to initialize push notifications (non-blocking):', error);
        // Don't set app error - this should be non-blocking
      }
    };

    // Start initialization in the background, but don't block app startup
    initializePushNotifications();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize offline sync service with error handling
  useEffect(() => {
    try {
      console.log('🔄 Initializing offline sync service');
      offlineSyncService.startPeriodicSync();
    } catch (error) {
      console.error('❌ Failed to initialize offline sync (non-blocking):', error);
      // Don't block app for this either
    }
  }, []);


  // If there's an app-level error, show it
  if (appError) {
    return (
      <div className="min-h-screen min-h-[100dvh] bg-cream dark:bg-[#200E3B] flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-black dark:text-[#F9F5EB] text-lg mb-4">App Error</div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">{appError}</div>
          <button 
            onClick={() => {
              setAppError(null);
              window.location.reload();
            }}
            className="bg-lavender text-black px-4 py-2 rounded"
          >
            Reload App
          </button>
        </div>
      </div>
    );
  }

  
  console.log('🎯 Rendering main app...');
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider defaultTheme="light">
            <TooltipProvider>
              <MobileDebugger />
              <OfflineIndicator />
              <PWAInstallBanner />
              <Toaster />
              <Sonner />

              <BrowserRouter>
                <ScrollToTop />
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/get" element={<GetApp />} />
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
                  <Route path="/courses" element={<Navigate to="/" replace />} />
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
