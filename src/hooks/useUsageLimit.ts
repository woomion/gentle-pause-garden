import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const MAX_FREE_ITEMS = 3;

export const useUsageLimit = () => {
  const { user } = useAuth();
  const [freeItemsUsed, setFreeItemsUsed] = useState(0);
  const [showUsageLimitModal, setShowUsageLimitModal] = useState(false);

  // Load free items count from localStorage for guest users
  useEffect(() => {
    if (!user) {
      const stored = localStorage.getItem('freeItemsUsed');
      setFreeItemsUsed(stored ? parseInt(stored, 10) : 0);
    } else {
      // For authenticated users, we'll eventually check their subscription
      // For now, they get unlimited access
      setFreeItemsUsed(0);
    }
  }, [user]);

  const canAddItem = () => {
    if (user) return true; // Authenticated users have unlimited access for now
    return freeItemsUsed < MAX_FREE_ITEMS;
  };

  const incrementUsage = () => {
    if (user) return; // Don't track for authenticated users
    
    const newCount = freeItemsUsed + 1;
    setFreeItemsUsed(newCount);
    localStorage.setItem('freeItemsUsed', newCount.toString());
    
    // Show modal when at limit
    if (newCount >= MAX_FREE_ITEMS) {
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

  const resetUsage = () => {
    setFreeItemsUsed(0);
    localStorage.removeItem('freeItemsUsed');
  };

  return {
    freeItemsUsed,
    maxFreeItems: MAX_FREE_ITEMS,
    canAddItem,
    incrementUsage,
    checkUsageLimit,
    showUsageLimitModal,
    closeUsageLimitModal,
    resetUsage,
    isAtLimit: freeItemsUsed >= MAX_FREE_ITEMS,
  };
};