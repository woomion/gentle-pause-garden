
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
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
        (event, session) => {
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
            } else {
              console.log('🔐 Session cleared');
              localStorage.removeItem('supabase-session-check');
            }
          }
        }
      );

      // Get initial session with retry logic for better persistence
      const getInitialSession = async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('🔐 Initial session check:', session?.user?.email, 'User ID:', session?.user?.id, 'Error:', error);
          
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
      };
    } catch (error) {
      console.error('🔐 AuthProvider: Error in useEffect:', error);
      if (mounted) {
        setLoading(false);
      }
    }
  }, []);

  const signUp = async (email: string, password: string, firstName?: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            first_name: firstName
          }
        }
      });
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error in signUp:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error in signIn:', error);
      return { error };
    }
  };


  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl
        }
      });
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error in signInWithGoogle:', error);
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

  const resetPassword = async (email: string) => {
    try {
      const redirectUrl = `${window.location.origin}/auth?reset=true`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error in resetPassword:', error);
      return { error };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      return { error };
    } catch (error) {
      console.error('AuthProvider: Error in updatePassword:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
