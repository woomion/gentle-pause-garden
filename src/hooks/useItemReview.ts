import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
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
  }, [user]);

  const handleItemDecided = async (id: string) => {
    if (user) {
      await supabasePausedItemsStore.removeItem(id);
    } else {
      pausedItemsStore.removeItem(id);
    }
    
    // Update the items list
    const updatedItems = itemsForReview.filter(item => item.id !== id);
    setItemsForReview(updatedItems);
    
    // If this was the last item, trigger confetti
    if (updatedItems.length === 0) {
      // Gentle confetti effect
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E7D9FA', '#BFD1BF', '#DDE7DD', '#CAB6F7'],
        gravity: 0.8,
        scalar: 0.8,
        drift: 0.1
      });
    }
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