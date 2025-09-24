
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
        
        // Enhanced session persistence for app closure scenarios
        if (session) {
          const sessionData = {
            userId: session.user.id,
            email: session.user.email,
            timestamp: Date.now(),
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
            expiresAt: session.expires_at
          };
          localStorage.setItem('pocket-pause-session-backup', JSON.stringify(sessionData));
          localStorage.setItem('pocket-pause-last-session', JSON.stringify({
            userId: session.user.id,
            email: session.user.email,
            timestamp: Date.now()
          }));
        } else {
          localStorage.removeItem('pocket-pause-session-backup');
          localStorage.removeItem('pocket-pause-last-session');
        }
        
        // Auto-setup push token when user signs in or session is restored
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

    // THEN check for existing session with enhanced persistence recovery
    const initializeAuth = async (retryCount = 0) => {
      try {
        console.log('🔐 Getting initial session... (attempt', retryCount + 1, ')');
        
        // Check localStorage for session backup
        const sessionBackup = localStorage.getItem('pocket-pause-session-backup');
        const lastSession = localStorage.getItem('pocket-pause-last-session');
        
        if (sessionBackup) {
          try {
            const backup = JSON.parse(sessionBackup);
            console.log('🔐 Found session backup:', {
              email: backup.email,
              userId: backup.userId,
              age: Math.round((Date.now() - backup.timestamp) / 1000 / 60) + ' minutes ago',
              hasTokens: !!(backup.accessToken && backup.refreshToken)
            });
          } catch (e) {
            console.log('🔐 Session backup parse error:', e);
          }
        }
        
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
          
          // Try backup restoration if available
          if (sessionBackup && retryCount === 0) {
            console.log('🔐 Attempting session restoration from backup...');
            try {
              const backup = JSON.parse(sessionBackup);
              const now = Math.floor(Date.now() / 1000);
              
              // Check if backup session is still valid (not expired)
              if (backup.expiresAt && backup.expiresAt > now) {
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (!refreshError && refreshData.session) {
                  console.log('🔐 Session restored from backup');
                  setSession(refreshData.session);
                  setUser(refreshData.session.user);
                  setLoading(false);
                  return;
                }
              }
            } catch (backupError) {
              console.error('🔐 Backup restoration failed:', backupError);
            }
          }
          
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
          
          // If no session but we had one before, try multiple recovery methods
          if (!session && (lastSession || sessionBackup) && retryCount === 0) {
            console.log('🔐 No session found but had one before, attempting recovery...');
            try {
              // First try explicit refresh
              const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error('🔐 Session refresh failed:', refreshError);
                
                // Try again with slight delay for PWA scenarios
                console.log('🔐 Retrying with delay for PWA...');
                setTimeout(() => initializeAuth(1), 1000);
                return;
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

    // Enhanced PWA and mobile session recovery
    const handleVisibilityChange = () => {
      if (!document.hidden && (!user || !session)) {
        console.log('🔐 App became visible and no session, checking auth state...');
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session && !user) {
            console.log('🔐 Found session on visibility change:', session.user.email);
            setSession(session);
            setUser(session.user);
            
            // Re-setup push token after app becomes visible
            setTimeout(async () => {
              try {
                const { autoSetupPushToken } = await import('../utils/autoTokenSetup');
                const success = await autoSetupPushToken();
                console.log('🔔 Push token re-setup on visibility:', success);
              } catch (error) {
                console.error('🔔 Push re-setup failed:', error);
              }
            }, 500);
          }
        });
      }
    };
    
    // Handle page focus for PWA scenarios
    const handleFocus = () => {
      if (!user || !session) {
        console.log('🔐 Window focused, attempting session recovery...');
        initializeAuth();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      console.log('🔐 Cleaning up auth listener');
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Empty dependency array - only run once on mount

  const signInWithMagicLink = async (email: string) => {
    try {
      // Redirect to production domain for PWA testing
      const redirectUrl = 'https://pocketpause.app/';
      
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
