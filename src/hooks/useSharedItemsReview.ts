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
        console.log('🔍 SharedItemsReview - Early return:', { user: !!user, partnersLoading, isMounted });
        if (isMounted) {
          setSharedItemsForReview([]);
          setPartnerNames([]);
        }
        return;
      }

      try {
        // Get all items for review - only if store is loaded
        if (!supabasePausedItemsStore.isDataLoaded()) {
          console.log('🔍 SharedItemsReview - Store not loaded yet');
          return;
        }
        
        const allReviewItems = supabasePausedItemsStore.getItemsForReview();
        console.log('🔍 SharedItemsReview - All review items:', allReviewItems.length, allReviewItems);
        
        // Filter for shared items with proper null checks
        const sharedItems = allReviewItems.filter(item => {
          try {
            // Case 1: Items shared WITH me (I'm in sharedWithPartners, not the owner)
            const isSharedWithMe = (
              item?.sharedWithPartners && 
              Array.isArray(item.sharedWithPartners) &&
              item.sharedWithPartners.includes(user.id) &&
              item.originalUserId && 
              item.originalUserId !== user.id
            );
            
            // Case 2: Items I shared WITH partners (I'm the owner, has sharedWithPartners)
            const isMySharedItem = (
              item?.sharedWithPartners && 
              Array.isArray(item.sharedWithPartners) &&
              item.sharedWithPartners.length > 0 &&
              item.originalUserId === user.id
            );
            
            const isSharedItem = isSharedWithMe || isMySharedItem;
            
            console.log('🔍 Checking shared item:', {
              itemId: item.id,
              itemTitle: item.itemName,
              sharedWithPartners: item.sharedWithPartners,
              itemUserId: item.originalUserId,
              currentUserId: user.id,
              isSharedWithMe,
              isMySharedItem,
              isSharedItem
            });
            
            return isSharedItem;
          } catch (error) {
            console.error('Error filtering shared item:', error, item);
            return false;
          }
        });

        console.log('🔍 SharedItemsReview - Filtered shared items:', sharedItems.length, sharedItems);

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

        console.log('🔍 SharedItemsReview - Final state:', {
          sharedItemsCount: sharedItems.length,
          partnerNames: names
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
