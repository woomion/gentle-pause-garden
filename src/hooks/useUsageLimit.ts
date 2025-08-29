import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MAX_FREE_ITEMS_MONTHLY = 10;

export const useUsageLimit = () => {
  const { user } = useAuth();
  const [monthlyItemsUsed, setMonthlyItemsUsed] = useState(0);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [loading, setLoading] = useState(false); // No need to load usage data anymore

  // No usage tracking needed - unlimited pauses for everyone
  useEffect(() => {
    setLoading(false);
  }, []);

  const canAddItem = () => {
    // Unlimited pauses for everyone
    return true;
  };

  const incrementUsage = async () => {
    // No usage tracking needed
  };

  const checkUsageLimit = () => {
    // Always allow adding items
    return true;
  };

  const closeUsageLimitModal = () => {
    setShowUsageLimitModal(false);
  };

  const resetUsage = async () => {
    setMonthlyItemsUsed(0);
    
    if (!user) {
      localStorage.removeItem('monthlyUsage');
    } else {
      try {
        await supabase
          .from('user_settings')
          .update({ 
            monthly_usage_count: 0,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error resetting usage:', error);
      }
    }
  };

  return {
    monthlyItemsUsed: 0, // Always 0 since we don't track usage
    maxFreeItems: Infinity, // Unlimited
    canAddItem,
    incrementUsage,
    checkUsageLimit,
    showUsageLimitModal: false, // Never show modal
    closeUsageLimitModal,
    resetUsage,
    isAtLimit: false, // Never at limit
    loading,
  };
};