import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { startAuthPersistenceMonitor } from '@/utils/persistAuthState';

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
  const [authMonitorCleanup, setAuthMonitorCleanup] = useState<(() => void) | null>(null);

  useEffect(() => {
    console.log('🔐 AuthProvider: Initializing authentication...');
    
    // Set up auth state listener FIRST - this is critical for session persistence
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Ensure session persists for closed-app notifications
        if (session) {
          console.log('🔐 Session active - user can receive closed-app notifications');
          
          // Auto-setup push token when user signs in or token refreshes
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            setTimeout(async () => {
              try {
                const { autoSetupPushToken } = await import('../utils/autoTokenSetup');
                const success = await autoSetupPushToken();
                console.log('🔔 Auto token setup on auth change:', success);
                
                // Start auth persistence monitoring for closed-app notifications
                if (!authMonitorCleanup) {
                  const cleanup = startAuthPersistenceMonitor();
                  setAuthMonitorCleanup(() => cleanup);
                }
              } catch (error) {
                console.error('🔔 Auto setup failed:', error);
              }
            }, 1000);
          }
        } else {
          console.log('🔐 No session - closed-app notifications not available');
          
          // Stop auth monitoring when signed out
          if (authMonitorCleanup) {
            authMonitorCleanup();
            setAuthMonitorCleanup(null);
          }
        }
      }
    );

    // THEN check for existing session - this ensures we don't miss auth events
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔐 Initial session check:', session?.user?.email || 'no user');
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // If we have a session on load, ensure push tokens are set up and start monitoring
      if (session) {
        setTimeout(async () => {
          try {
            const { autoSetupPushToken } = await import('../utils/autoTokenSetup');
            await autoSetupPushToken();
            
            // Start auth persistence monitoring for closed-app notifications
            if (!authMonitorCleanup) {
              const cleanup = startAuthPersistenceMonitor();
              setAuthMonitorCleanup(() => cleanup);
            }
          } catch (error) {
            console.error('🔔 Initial auto setup failed:', error);
          }
        }, 2000);
      }
    });

    return () => {
      console.log('🔐 AuthProvider: Cleaning up auth listener');
      subscription.unsubscribe();
      
      // Clean up auth monitor
      if (authMonitorCleanup) {
        authMonitorCleanup();
      }
    };
  }, [authMonitorCleanup]);

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
      console.log('🔐 Signing out - closed-app notifications will be disabled');
      await supabase.auth.signOut();
      
      // Stop auth monitoring when signing out
      if (authMonitorCleanup) {
        authMonitorCleanup();
        setAuthMonitorCleanup(null);
      }
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