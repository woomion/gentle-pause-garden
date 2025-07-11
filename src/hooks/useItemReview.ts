import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePausedItemsStore, PausedItem } from '@/stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '@/stores/pausedItemsStore';

export const useItemReview = () => {
  const [itemsForReview, setItemsForReview] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const { user } = useAuth();

  // Track items for review
  useEffect(() => {
    const updateItemsForReview = () => {
      if (user) {
        const reviewItems = supabasePausedItemsStore.getItemsForReview();
        setItemsForReview(reviewItems);
      } else {
        const reviewItems = pausedItemsStore.getItemsForReview();
        setItemsForReview(reviewItems);
      }
    };

    updateItemsForReview();

    let unsubscribe: (() => void) | undefined;
    let interval: NodeJS.Timeout | undefined;

    if (user) {
      unsubscribe = supabasePausedItemsStore.subscribe(updateItemsForReview);
      interval = setInterval(updateItemsForReview, 60000);
    } else {
      unsubscribe = pausedItemsStore.subscribe(updateItemsForReview);
      interval = setInterval(updateItemsForReview, 60000);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [user?.id]); // Only depend on user.id, not the whole user object

  const handleItemDecided = async (id: string) => {
    if (user) {
      await supabasePausedItemsStore.removeItem(id);
    } else {
      pausedItemsStore.removeItem(id);
    }
    setItemsForReview(prev => prev.filter(item => item.id !== id));
  };

  const handleNextReview = () => {
    setCurrentReviewIndex(prev => prev + 1);
  };

  const resetReviewIndex = () => {
    setCurrentReviewIndex(0);
  };

  return {
    itemsForReview,
    currentReviewIndex,
    handleItemDecided,
    handleNextReview,
    resetReviewIndex,
  };
};