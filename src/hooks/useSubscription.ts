import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Subscription {
  tier: string;
  status: string;
  expires_at?: string;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const hasPausePartnerAccess = () => {
    // Temporarily allow free tier for testing
    return true;
    // return subscription?.tier === 'premium' || subscription?.tier === 'pause_partner';
  };

  const loadSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) {
        console.error('Error loading subscription:', error);
        setSubscription({ tier: 'free', status: 'active' });
      } else {
        setSubscription(data || { tier: 'free', status: 'active' });
      }
    } catch (error) {
      console.error('Error in loadSubscription:', error);
      setSubscription({ tier: 'free', status: 'active' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscription();
  }, [user]);

  return {
    subscription,
    loading,
    hasPausePartnerAccess,
    reload: loadSubscription
  };
};