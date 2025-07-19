import { useState, useEffect, useCallback } from 'react';
import { supabasePausedItemsStore, PausedItem } from '../stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useAuth } from '../contexts/AuthContext';
import PausedItemDetail from './PausedItemDetail';
import GuestModeIndicator from './GuestModeIndicator';
import PausedItemsCarousel from './PausedItemsCarousel';
import PausedSectionEmpty from './PausedSectionEmpty';
import PausedSectionLoading from './PausedSectionLoading';

const PausedSection = () => {
  const [pausedItems, setPausedItems] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [selectedItem, setSelectedItem] = useState<PausedItem | LocalPausedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  const sortItemsByDate = useCallback((items: (PausedItem | LocalPausedItem)[]) => {
    return items
      .filter(item => {
        // Only show items that belong to the current user AND are not shared with partners
        // Items shared with partners should only appear in Partner Pauses section
        const itemUserId = (item as any).originalUserId || (item as any).user_id;
        const sharedWithPartners = (item as any).sharedWithPartners || [];
        
        // For authenticated users: show only items created by them that are NOT shared with partners
        if (user) {
          return itemUserId === user.id && sharedWithPartners.length === 0;
        }
        
        // For guest users: show all local items (they can't share with partners)
        return true;
      })
      .sort((a, b) => new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime());
  }, [user]);

  useEffect(() => {
    const updateItems = () => {
      if (user) {
        // Use Supabase store for authenticated users
        const allItems = supabasePausedItemsStore.getItems();
        const reviewItems = supabasePausedItemsStore.getItemsForReview();
        const reviewItemIds = new Set(reviewItems.map(item => item.id));
        const nonReviewItems = allItems.filter(item => !reviewItemIds.has(item.id));
        setPausedItems(sortItemsByDate(nonReviewItems));
        
        if (supabasePausedItemsStore.isDataLoaded()) {
          setIsLoading(false);
        }
      } else {
        // Use local store for guest users
        const allItems = pausedItemsStore.getItems();
        const reviewItems = pausedItemsStore.getItemsForReview();
        const reviewItemIds = new Set(reviewItems.map(item => item.id));
        const nonReviewItems = allItems.filter(item => !reviewItemIds.has(item.id));
        
        console.log('📋 PausedSection - All items:', allItems);
        console.log('📋 PausedSection - Review items:', reviewItems);
        console.log('📋 PausedSection - Non-review items:', nonReviewItems);
        
        setPausedItems(sortItemsByDate(nonReviewItems));
        setIsLoading(false);
      }
    };

    updateItems();

    let unsubscribe: (() => void) | undefined;
    let interval: NodeJS.Timeout | undefined;

    if (user) {
      // Set up Supabase store subscription
      unsubscribe = supabasePausedItemsStore.subscribe(updateItems);
      // Update every minute to keep countdown accurate
      interval = setInterval(updateItems, 60000);
    } else {
      // Set up local store subscription
      unsubscribe = pausedItemsStore.subscribe(updateItems);
      // Update every minute to keep countdown accurate
      interval = setInterval(updateItems, 60000);
    }

    return () => {
      if (unsubscribe) unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, [sortItemsByDate, user]);

  const handleItemClick = useCallback((item: PausedItem | LocalPausedItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleDeleteItem = useCallback(async (id: string) => {
    if (user) {
      await supabasePausedItemsStore.removeItem(id);
    } else {
      pausedItemsStore.removeItem(id);
    }
    setSelectedItem(null);
  }, [user]);

  // Loading state
  if (isLoading) {
    return <PausedSectionLoading />;
  }

  // Empty state when no items
  if (pausedItems.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
          Paused for now
        </h2>
        <p className="text-base mb-3" style={{ color: '#6b6b6b' }}>
          You haven't decided yet and that's okay
        </p>
        <PausedSectionEmpty isGuest={!user} hasReviewItems={false} />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
        Paused for now
      </h2>
      <p className="text-base mb-3" style={{ color: '#6b6b6b' }}>
        You haven't decided yet and that's okay
      </p>

      <GuestModeIndicator 
        show={!user && pausedItems.length > 0}
      />

      {/* Paused items display */}
      <PausedItemsCarousel 
        items={pausedItems}
        onItemClick={handleItemClick}
      />

      {selectedItem && (
        <PausedItemDetail
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={handleCloseDetail}
          onDelete={handleDeleteItem}
          currentUserId={user?.id}
        />
      )}
    </div>
  );
};

export default PausedSection;
