import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePausedItemsStore, PausedItem } from '@/stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '@/stores/pausedItemsStore';

export const useItemReview = () => {
  const [itemsForReview, setItemsForReview] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const { user } = useAuth();

  // Track items for review - load immediately for guest mode
  useEffect(() => {
    const updateItemsForReview = () => {
      if (user) {
        const allReviewItems = supabasePausedItemsStore.getItemsForReview();
        
        // Filter for solo items (items owned by current user that are NOT shared)
        const soloItems = allReviewItems.filter(item => {
          const isOwned = item.originalUserId === user.id;
          const isNotShared = true;
          return isOwned && isNotShared;
        });
        
        setItemsForReview(soloItems);
      } else {
        // Guest mode - load immediately
        const reviewItems = pausedItemsStore.getItemsForReview();
        setItemsForReview(reviewItems);
      }
    };

    updateItemsForReview();

    let unsubscribe: (() => void) | undefined;
    let interval: NodeJS.Timeout | undefined;

    if (user) {
      unsubscribe = supabasePausedItemsStore.subscribe(updateItemsForReview);
      // Reduced interval frequency for better performance
      interval = setInterval(updateItemsForReview, 120000); // 2 minutes instead of 1
    } else {
      unsubscribe = pausedItemsStore.subscribe(updateItemsForReview);
      interval = setInterval(updateItemsForReview, 120000);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [user]);

  const handleItemDecided = async (id: string) => {
    // Store the current length before removal
    const currentLength = itemsForReview.length;
    
    if (user) {
      await supabasePausedItemsStore.removeItem(id);
    } else {
      pausedItemsStore.removeItem(id);
    }
    
    // Update the items list
    const updatedItems = itemsForReview.filter(item => item.id !== id);
    setItemsForReview(updatedItems);
    
    // If this was the last item (currentLength was 1), trigger confetti
    if (currentLength === 1) {
      // Gentle confetti effect with gold stars
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E7D9FA', '#BFD1BF', '#DDE7DD', '#CAB6F7', '#FFD700', '#FFA500'],
        gravity: 0.4,
        scalar: 0.7,
        drift: 0.05,
        shapes: ['star', 'circle'],
        ticks: 300
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