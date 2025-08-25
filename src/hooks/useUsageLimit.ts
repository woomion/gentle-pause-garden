import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const MAX_FREE_ITEMS_MONTHLY = 10;

export const useUsageLimit = () => {
  const { user } = useAuth();
  const [monthlyItemsUsed, setMonthlyItemsUsed] = useState(0);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load monthly usage from database for authenticated users or localStorage for guest users
  useEffect(() => {
    loadUsageData();
  }, [user]);

  const loadUsageData = async () => {
    if (!user) {
      // For guest users, use localStorage with monthly tracking
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const stored = localStorage.getItem('monthlyUsage');
      
      if (stored) {
        const { month, year, count } = JSON.parse(stored);
        if (month === currentMonth && year === currentYear) {
          setMonthlyItemsUsed(count);
        } else {
          // Reset for new month
          setMonthlyItemsUsed(0);
          localStorage.setItem('monthlyUsage', JSON.stringify({
            month: currentMonth,
            year: currentYear,
            count: 0
          }));
        }
      } else {
        setMonthlyItemsUsed(0);
      }
      setLoading(false);
    } else {
      // For authenticated users, check database
      try {
        // First reset monthly usage if month has changed
        await supabase.rpc('reset_monthly_usage');
        
        const { data, error } = await supabase
          .from('user_settings')
          .select('monthly_usage_count')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching usage data:', error);
          setMonthlyItemsUsed(0);
        } else {
          setMonthlyItemsUsed(data?.monthly_usage_count || 0);
        }
      } catch (error) {
        console.error('Error in loadUsageData:', error);
        setMonthlyItemsUsed(0);
      }
      setLoading(false);
    }
  };

  const canAddItem = () => {
    // Free users get 10 items per month, paid users get unlimited
    return monthlyItemsUsed < MAX_FREE_ITEMS_MONTHLY;
  };

  const incrementUsage = async () => {
    const newCount = monthlyItemsUsed + 1;
    setMonthlyItemsUsed(newCount);
    
    if (!user) {
      // Update localStorage for guest users
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      localStorage.setItem('monthlyUsage', JSON.stringify({
        month: currentMonth,
        year: currentYear,
        count: newCount
      }));
    } else {
      // Update database for authenticated users
      try {
        await supabase
          .from('user_settings')
          .update({ 
            monthly_usage_count: newCount,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } catch (error) {
        console.error('Error updating usage count:', error);
      }
    }
    
    // Show modal when at limit
    if (newCount >= MAX_FREE_ITEMS_MONTHLY) {
      setShowUsageLimitModal(true);
    }
  };

  const checkUsageLimit = () => {
    if (!canAddItem()) {
      setShowUsageLimitModal(true);
      return false;
    }
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
    monthlyItemsUsed,
    maxFreeItems: MAX_FREE_ITEMS_MONTHLY,
    canAddItem,
    incrementUsage,
    checkUsageLimit,
    showUsageLimitModal,
    closeUsageLimitModal,
    resetUsage,
    isAtLimit: monthlyItemsUsed >= MAX_FREE_ITEMS_MONTHLY,
    loading,
  };
};