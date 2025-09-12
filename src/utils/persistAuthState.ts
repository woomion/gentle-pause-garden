// Utility to ensure authentication state persists for closed-app notifications
import { supabase } from '@/integrations/supabase/client';

export async function ensureAuthPersistence(): Promise<boolean> {
  try {
    console.log('🔐 Checking auth persistence for closed-app notifications...');
    
    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error checking session:', error);
      return false;
    }
    
    if (!session) {
      console.log('❌ No active session - closed-app notifications unavailable');
      return false;
    }
    
    // Check if session is still valid
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('❌ Session invalid:', userError);
      return false;
    }
    
    if (!user) {
      console.log('❌ No user data - session may be expired');
      return false;
    }
    
    console.log('✅ Auth state persistent - closed-app notifications enabled for:', user.email);
    return true;
    
  } catch (error) {
    console.error('❌ Error ensuring auth persistence:', error);
    return false;
  }
}

// Periodically verify auth state for closed-app notifications
export function startAuthPersistenceMonitor(): () => void {
  console.log('🔄 Starting auth persistence monitor...');
  
  const interval = setInterval(async () => {
    const isValid = await ensureAuthPersistence();
    if (!isValid) {
      console.log('⚠️ Auth state lost - closed-app notifications may not work');
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  return () => {
    console.log('🛑 Stopping auth persistence monitor');
    clearInterval(interval);
  };
}