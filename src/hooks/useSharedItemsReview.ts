import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabasePausedItemsStore, PausedItem } from '@/stores/supabasePausedItemsStore';
import { usePausePartners } from './usePausePartners';

export const useSharedItemsReview = () => {
  const [sharedItemsForReview, setSharedItemsForReview] = useState<PausedItem[]>([]);
  const [partnerNames, setPartnerNames] = useState<string[]>([]);
  const { user } = useAuth();
  const { partners, loading: partnersLoading } = usePausePartners();

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const updateSharedItemsForReview = () => {
      // Early return if no user or partners still loading or component unmounted
      if (!user || partnersLoading || !isMounted) {
        if (isMounted) {
          setSharedItemsForReview([]);
          setPartnerNames([]);
        }
        return;
      }

      try {
        // Get all items for review - only if store is loaded
        if (!supabasePausedItemsStore.isDataLoaded()) {
          return;
        }
        
        const allReviewItems = supabasePausedItemsStore.getItemsForReview();
        
        // Filter for shared items with proper null checks
        const sharedItems = allReviewItems.filter(item => {
          try {
            return (
              item?.sharedWithPartners && 
              Array.isArray(item.sharedWithPartners) &&
              item.sharedWithPartners.includes(user.id) &&
              item.originalUserId && 
              item.originalUserId !== user.id
            );
          } catch (error) {
            console.error('Error filtering shared item:', error, item);
            return false;
          }
        });

        if (!isMounted) return; // Check if still mounted

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

        if (isMounted) {
          setPartnerNames(names);
        }
      } catch (error) {
        console.error('Error in updateSharedItemsForReview:', error);
        if (isMounted) {
          setSharedItemsForReview([]);
          setPartnerNames([]);
        }
      }
    };

    updateSharedItemsForReview();

    // Subscribe to store updates only if we have valid data
    let unsubscribe: (() => void) | null = null;
    let interval: NodeJS.Timeout | null = null;
    
    if (user && !partnersLoading) {
      unsubscribe = supabasePausedItemsStore.subscribe(() => {
        if (isMounted) {
          updateSharedItemsForReview();
        }
      });

      // Update every minute to keep check-in times accurate
      interval = setInterval(() => {
        if (isMounted) {
          updateSharedItemsForReview();
        }
      }, 60000);
    }

    return () => {
      isMounted = false; // Mark as unmounted
      if (unsubscribe) {
        unsubscribe();
      }
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user, partners, partnersLoading]);

  return {
    sharedItemsForReview,
    partnerNames,
    sharedItemsCount: sharedItemsForReview.length
  };
};
