import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePausedItemsStore, PausedItem } from '@/stores/supabasePausedItemsStore';
import { usePausePartners } from './usePausePartners';

export const useSharedItemsReview = () => {
  const [sharedItemsForReview, setSharedItemsForReview] = useState<PausedItem[]>([]);
  const [partnerNames, setPartnerNames] = useState<string[]>([]);
  const { user } = useAuth();
  const { partners } = usePausePartners();

  useEffect(() => {
    const updateSharedItemsForReview = () => {
      if (!user) {
        setSharedItemsForReview([]);
        setPartnerNames([]);
        return;
      }

      // Get all items for review
      const allReviewItems = supabasePausedItemsStore.getItemsForReview();
      
      // Filter for shared items (items where current user is in sharedWithPartners but not the owner)
      const sharedItems = allReviewItems.filter(item => 
        item.sharedWithPartners && 
        item.sharedWithPartners.includes(user.id) &&
        item.originalUserId !== user.id
      );

      setSharedItemsForReview(sharedItems);

      // Extract unique partner names from shared items
      const uniquePartnerIds = new Set<string>();
      sharedItems.forEach(item => {
        if (item.originalUserId) {
          uniquePartnerIds.add(item.originalUserId);
        }
      });

      // Map partner IDs to names
      const names: string[] = [];
      uniquePartnerIds.forEach(partnerId => {
        const partner = partners.find(p => p.partner_id === partnerId);
        if (partner) {
          names.push(partner.partner_name);
        }
      });

      setPartnerNames(names);
    };

    updateSharedItemsForReview();

    // Subscribe to store updates
    const unsubscribe = supabasePausedItemsStore.subscribe(updateSharedItemsForReview);

    // Update every minute to keep check-in times accurate
    const interval = setInterval(updateSharedItemsForReview, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [user, partners]);

  return {
    sharedItemsForReview,
    partnerNames,
    sharedItemsCount: sharedItemsForReview.length
  };
};
