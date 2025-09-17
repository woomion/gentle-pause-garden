
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
    console.log('🔐 AuthProvider: Initializing authentication...');
    
    // Set up auth state listener FIRST - this is critical
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Store session info for debugging mobile issues
        if (session) {
          localStorage.setItem('pocket-pause-last-session', JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
            timestamp: Date.now()
          }));
        } else {
          localStorage.removeItem('pocket-pause-last-session');
        }
        
        // Auto-setup push token when user signs in
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(async () => {
            try {
              const { autoSetupPushToken } = await import('../utils/autoTokenSetup');
              const success = await autoSetupPushToken();
              console.log('🔔 Auto token setup on auth change:', success);
            } catch (error) {
              console.error('🔔 Auto setup failed:', error);
            }
          }, 1000);
        }
      }
    );

    // THEN check for existing session with retry logic for mobile
    const initializeAuth = async (retryCount = 0) => {
      try {
        console.log('🔐 Getting initial session... (attempt', retryCount + 1, ')');
        
        // Check localStorage for debug info
        const lastSession = localStorage.getItem('pocket-pause-last-session');
        if (lastSession) {
          const parsed = JSON.parse(lastSession);
          console.log('🔐 Last known session:', {
            email: parsed.email,
            userId: parsed.userId,
            age: Math.round((Date.now() - parsed.timestamp) / 1000 / 60) + ' minutes ago'
          });
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔐 Error getting session:', error);
          
          // Retry once for mobile network issues
          if (retryCount === 0) {
            console.log('🔐 Retrying session fetch in 2 seconds...');
            setTimeout(() => initializeAuth(1), 2000);
            return;
          }
        } else {
          console.log('🔐 Initial session:', session?.user?.email || 'No session found');
          console.log('🔐 Session details:', {
            hasSession: !!session,
            hasUser: !!session?.user,
            userId: session?.user?.id,
            email: session?.user?.email,
            expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null
          });
          
          // If no session but we had one before, try to refresh
          if (!session && lastSession && retryCount === 0) {
            console.log('🔐 No session found but had one before, attempting refresh...');
            try {
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error('🔐 Session refresh failed:', refreshError);
              } else if (refreshData.session) {
                console.log('🔐 Session refreshed successfully');
                setSession(refreshData.session);
                setUser(refreshData.session.user);
                setLoading(false);
                return;
              }
            } catch (refreshErr) {
              console.error('🔐 Error during session refresh:', refreshErr);
            }
          }
          
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('🔐 Unexpected error getting session:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Additional mobile-specific session recovery
    // Listen for app becoming visible again (mobile PWA lifecycle)
    const handleVisibilityChange = () => {
      if (!document.hidden && (!user || !session)) {
        console.log('🔐 App became visible and no session, checking auth state...');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && !user) {
            console.log('🔐 Found session on visibility change:', session.user.email);
            setSession(session);
            setUser(session.user);
          }
        });
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      console.log('🔐 Cleaning up auth listener');
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, session]); // Add dependencies to re-run when state changes

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
