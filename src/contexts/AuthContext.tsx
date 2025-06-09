
import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
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
    console.log('AuthProvider: Setting up auth state listener');
    console.log('AuthProvider: Mobile check - User agent:', navigator.userAgent);
    console.log('AuthProvider: Mobile check - Screen size:', window.innerWidth, 'x', window.innerHeight);
    
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    try {
      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          console.log('AuthProvider: Auth state changed', event, !!session);
          if (mounted) {
            setSession(session);
            setUser(session?.user ?? null);
            if (timeoutId) clearTimeout(timeoutId);
            setLoading(false);
          }
        }
      );

      // Get initial session with better error handling
      console.log('AuthProvider: Getting initial session');
      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          console.log('AuthProvider: Initial session loaded', !!session, 'Error:', error);
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

      // Shorter timeout for mobile - 5 seconds
      timeoutId = setTimeout(() => {
        console.log('AuthProvider: Timeout reached, forcing loading to false');
        if (mounted) {
          setLoading(false);
        }
      }, 5000);

      return () => {
        console.log('AuthProvider: Cleaning up auth listener');
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

  console.log('AuthProvider: Rendering with loading:', loading, 'user:', !!user);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
