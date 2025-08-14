import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePausedItemsStore, PausedItem } from '@/stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '@/stores/pausedItemsStore';

export const useItemReview = () => {
  const [itemsForReview, setItemsForReview] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const { user } = useAuth();

  // Track items for review (solo items only - exclude shared items)
  useEffect(() => {
    const updateItemsForReview = () => {
      console.log('🔍 useItemReview: updateItemsForReview called, user:', !!user);
      
      if (user) {
        const allReviewItems = supabasePausedItemsStore.getItemsForReview();
        console.log('🔍 useItemReview: All review items from store:', allReviewItems.length, allReviewItems);
        
        // Filter for solo items (items owned by current user that are NOT shared)
        const soloItems = allReviewItems.filter(item => {
          const isOwned = item.originalUserId === user.id;
          const isNotShared = true;
          const isSolo = isOwned && isNotShared;
          
          console.log('🔍 useItemReview: Item filter check:', {
            itemId: item.id,
            itemName: item.itemName,
            originalUserId: item.originalUserId,
            currentUserId: user.id,
            
            isOwned,
            isNotShared,
            isSolo
          });
          
          return isSolo;
        });
        
        console.log('🔍 useItemReview: Solo items after filtering:', soloItems.length, soloItems);
        setItemsForReview(soloItems);
      } else {
        const reviewItems = pausedItemsStore.getItemsForReview();
        console.log('🔍 useItemReview: Guest items for review:', reviewItems.length, reviewItems);
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
    console.log('🔍 useItemReview: handleItemDecided called for item:', id);
    console.log('🔍 useItemReview: current items count:', itemsForReview.length);
    
    // Store the current length before removal (for confetti logic)
    const currentLength = itemsForReview.length;
    
    // Remove from store - the store listeners will handle updating itemsForReview automatically
    if (user) {
      await supabasePausedItemsStore.removeItem(id);
    } else {
      pausedItemsStore.removeItem(id);
    }
    
    // If this was the last item, trigger confetti
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