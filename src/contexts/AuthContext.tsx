
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithMagicLink: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    try {
      console.log('🔐 AuthProvider: Initializing authentication...');
      
      // Set up auth state listener first
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('🔐 Auth state change:', event, 'Session:', session?.user?.email, 'User ID:', session?.user?.id);
          if (mounted) {
            // Persist session immediately
            setSession(session);
            setUser(session?.user ?? null);
            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
            
            // Log session storage for debugging
            if (session) {
              console.log('🔐 Session persisted successfully');
              localStorage.setItem('supabase-session-check', 'true');
              // Auto-setup push token and register user when user logs in
              if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                setTimeout(async () => {
                  try {
                    // Setup push token (user registration happens within this call now)
                    const { autoSetupPushToken } = await import('../utils/autoTokenSetup');
                    const success = await autoSetupPushToken();
                    console.log('🔔 Auto token setup on auth change:', success);
                  } catch (error) {
                    console.error('🔔 Auto setup failed:', error);
                  }
                }, 1000);
              }
            } else {
              console.log('🔐 Session cleared');
              localStorage.removeItem('supabase-session-check');
            }
          }
        }
      );

      // Mobile app lifecycle management for session persistence
      const saveAuthState = () => {
        console.log('📱 App closing - saving auth state');
        if (session) {
          localStorage.setItem('app-auth-backup', JSON.stringify({
            user: user,
            session: session,
            timestamp: Date.now()
          }));
          console.log('📱 Auth state saved for app closure');
        }
      };

      const restoreAuthState = () => {
        console.log('📱 App opening - checking for saved auth state');
        try {
          const saved = localStorage.getItem('app-auth-backup');
          if (saved) {
            const parsed = JSON.parse(saved);
            const age = Date.now() - parsed.timestamp;
            
            // If saved state is less than 24 hours old, use it temporarily
            if (age < 24 * 60 * 60 * 1000) {
              console.log('📱 Found recent auth state, will verify with server');
              return parsed;
            } else {
              console.log('📱 Saved auth state too old, removing');
              localStorage.removeItem('app-auth-backup');
            }
          }
        } catch (e) {
          console.log('📱 Error restoring auth state:', e);
          localStorage.removeItem('app-auth-backup');
        }
        return null;
      };

      // Listen for app lifecycle events
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          console.log('📱 App going to background');
          saveAuthState();
        } else if (document.visibilityState === 'visible') {
          console.log('📱 App coming to foreground - verifying session');
          if (session) {
            // Verify session is still valid when returning
            supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
              if (!currentSession && session) {
                console.log('📱 Session expired while app was backgrounded');
                setSession(null);
                setUser(null);
                localStorage.removeItem('app-auth-backup');
              }
            });
          }
        }
      };

      const handleBeforeUnload = () => {
        console.log('📱 App unloading - saving state');
        saveAuthState();
      };

      // Progressier-specific app events
      const handleProgressierHidden = () => {
        console.log('📱 Progressier app hidden');
        saveAuthState();
      };

      const handleProgressierVisible = () => {
        console.log('📱 Progressier app visible');
        if (session) {
          supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            if (currentSession) {
              setSession(currentSession);
              setUser(currentSession.user);
            } else {
              console.log('📱 Session invalid after Progressier resume');
              setSession(null);
              setUser(null);
              localStorage.removeItem('app-auth-backup');
            }
          });
        }
      };

      // Enhanced mobile web detection
      const isMobileWeb = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('📱 Mobile web detected:', isMobileWeb);

      // Add event listeners for web app lifecycle
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('pagehide', handleBeforeUnload);
      window.addEventListener('focus', handleProgressierVisible);
      window.addEventListener('blur', handleProgressierHidden);
      
      // Progressier-specific events (if available)
      if (typeof window !== 'undefined' && (window as any).progressier) {
        console.log('📱 Progressier detected, adding specific handlers');
        // Listen for Progressier app state changes
        document.addEventListener('progressier:hidden', handleProgressierHidden);
        document.addEventListener('progressier:visible', handleProgressierVisible);
      }

      // Check for restored auth state first
      const restoredState = restoreAuthState();
      if (restoredState) {
        console.log('📱 Temporarily restoring auth state while verifying...');
        setUser(restoredState.user);
        setSession(restoredState.session);
        setLoading(false);
      }
      // Enhanced session recovery for mobile app closures
      const getInitialSession = async () => {
        try {
          console.log('📱 === MOBILE SESSION RECOVERY START ===');
          console.log('📱 Current URL:', window.location.href);
          console.log('📱 Is mobile:', /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
          
          // First attempt: Get session normally
          let { data: { session }, error } = await supabase.auth.getSession();
          console.log('📱 Initial session check:', { hasSession: !!session, error });
          
          // If no session but we have localStorage data, try to refresh
          if (!session && !error) {
            const authKeys = Object.keys(localStorage).filter(k => k.includes('supabase'));
            console.log('📱 Found localStorage keys:', authKeys);
            
            // Check for existing refresh token in localStorage
            for (const key of authKeys) {
              try {
                const value = localStorage.getItem(key);
                if (value) {
                  const parsed = JSON.parse(value);
                  if (parsed?.refresh_token) {
                    console.log('📱 Found refresh token, attempting recovery...');
                    
                    // Try to refresh the session
                    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession({
                      refresh_token: parsed.refresh_token
                    });
                    
                    if (refreshData?.session && !refreshError) {
                      console.log('📱 Session recovery successful!');
                      session = refreshData.session;
                      break;
                    } else {
                      console.log('📱 Session refresh failed:', refreshError);
                    }
                  }
                }
              } catch (e) {
                console.log('📱 Error parsing localStorage key:', key, e);
              }
            }
          }
          
          // Final session state
          console.log('📱 Final session state:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userEmail: session?.user?.email,
            expiresAt: session?.expires_at
          });
          
          console.log('📱 === MOBILE SESSION RECOVERY END ===');
          
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
            
            if (session) {
              console.log('🔐 Session restored from storage');
              localStorage.setItem('supabase-session-check', 'true');
            }
          }
        } catch (error) {
          console.error('🔐 Error getting initial session:', error);
          // Retry once after a short delay
          setTimeout(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (mounted && session) {
                console.log('🔐 Session restored on retry');
                setSession(session);
                setUser(session?.user ?? null);
                localStorage.setItem('supabase-session-check', 'true');
              }
            } catch (retryError) {
              console.error('🔐 Session retry failed:', retryError);
            }
            if (mounted) {
              if (timeoutId) clearTimeout(timeoutId);
              setLoading(false);
            }
          }, 1000);
        }
      };

      getInitialSession();

      // Timeout for loading state - 8 seconds to allow for retry
      timeoutId = setTimeout(() => {
        if (mounted) {
          console.log('🔐 Auth loading timeout reached');
          setLoading(false);
        }
      }, 8000);

      return () => {
        mounted = false;
        if (timeoutId) clearTimeout(timeoutId);
        subscription.unsubscribe();
        
        // Clean up web app lifecycle event listeners
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        window.removeEventListener('pagehide', handleBeforeUnload);
        window.removeEventListener('focus', handleProgressierVisible);
        window.removeEventListener('blur', handleProgressierHidden);
        
        if (typeof window !== 'undefined' && (window as any).progressier) {
          document.removeEventListener('progressier:hidden', handleProgressierHidden);
          document.removeEventListener('progressier:visible', handleProgressierVisible);
        }
      };
    } catch (error) {
      console.error('🔐 AuthProvider: Error in useEffect:', error);
      if (mounted) {
        setLoading(false);
      }
    }
  }, []);

  const signInWithMagicLink = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error in signInWithMagicLink:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('AuthProvider: Error in signOut:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    signInWithMagicLink,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
