
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
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
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('🔐 Auth state change:', event, 'Session:', session?.user?.email, 'User ID:', session?.user?.id);
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
          }
        }
      );

      // Get initial session with better error handling
      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          console.log('🔐 Initial session check:', session?.user?.email, 'User ID:', session?.user?.id, 'Error:', error);
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
          }
        })
        .catch((error) => {
          console.error('AuthProvider: Error getting initial session:', error);
          if (mounted) {
            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
          }
        });

      // Timeout for loading state - 5 seconds
      timeoutId = setTimeout(() => {
        if (mounted) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        mounted = false;
        if (timeoutId) clearTimeout(timeoutId);
        subscription.unsubscribe();
      };
    } catch (error) {
      console.error('AuthProvider: Error in useEffect:', error);
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
    signUp,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
