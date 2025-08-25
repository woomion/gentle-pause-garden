import { useState, useEffect, useCallback } from 'react';
import { supabasePausedItemsStore, PausedItem } from '../stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useAuth } from '../contexts/AuthContext';
import PausedItemDetail from './PausedItemDetail';
import GuestModeIndicator from './GuestModeIndicator';
import PausedItemsCarousel from './PausedItemsCarousel';
import PausedSectionEmpty from './PausedSectionEmpty';
import PausedSectionLoading from './PausedSectionLoading';
import ItemReviewModal from './ItemReviewModal';
import { useItemReview } from '../hooks/useItemReview';

const PausedSection = () => {
  const [pausedItems, setPausedItems] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [selectedItem, setSelectedItem] = useState<PausedItem | LocalPausedItem | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewItem, setReviewItem] = useState<PausedItem | LocalPausedItem | null>(null);

  const { user } = useAuth();
  const itemReview = useItemReview();

  const sortItemsByDate = useCallback((items: (PausedItem | LocalPausedItem)[]) => {
    return items
      .sort((a, b) => new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime());
  }, []);

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
    const index = pausedItems.findIndex(i => i.id === item.id);
    setSelectedItem(item);
    setSelectedItemIndex(index);
  }, [pausedItems]);

  const handleCloseDetail = useCallback(() => {
    setSelectedItem(null);
    setSelectedItemIndex(0);
  }, []);

  const handleNavigateNext = useCallback(() => {
    if (selectedItemIndex < pausedItems.length - 1) {
      const nextIndex = selectedItemIndex + 1;
      setSelectedItemIndex(nextIndex);
      setSelectedItem(pausedItems[nextIndex]);
    }
  }, [selectedItemIndex, pausedItems]);

  const handleNavigatePrevious = useCallback(() => {
    if (selectedItemIndex > 0) {
      const prevIndex = selectedItemIndex - 1;
      setSelectedItemIndex(prevIndex);
      setSelectedItem(pausedItems[prevIndex]);
    }
  }, [selectedItemIndex, pausedItems]);

  const handleDeleteItem = useCallback(async (id: string) => {
    if (user) {
      await supabasePausedItemsStore.removeItem(id);
    } else {
      pausedItemsStore.removeItem(id);
    }
    setSelectedItem(null);
  }, [user]);

  const handleDecideNow = useCallback((item: PausedItem | LocalPausedItem) => {
    console.log('🎯 PausedSection: handleDecideNow called for item:', item.id);
    console.log('🎯 PausedSection: Current showReviewModal state:', showReviewModal);
    
    // Open the review modal with just this specific item
    setReviewItem(item);
    setShowReviewModal(true);
    
    console.log('🎯 PausedSection: Set reviewItem and showReviewModal to true');
    console.log('🎯 PausedSection: reviewItem now set to:', item);
  }, [showReviewModal]);

  const handleEditItem = useCallback(async (item: PausedItem | LocalPausedItem, updates: Partial<PausedItem | LocalPausedItem>) => {
    try {
      if (user) {
        // Update in Supabase store for authenticated users
        // For now, just log - we'll need to add this method to the store
        console.log('Editing item in Supabase store:', item.id, updates);
      } else {
        // Update in local store for guest users
        // For now, just log - we'll need to add this method to the store
        console.log('Editing item in local store:', item.id, updates);
      }
    } catch (error) {
      console.error('Error editing item:', error);
    }
  }, [user]);

  // Loading state
  if (isLoading) {
    return <PausedSectionLoading />;
  }

  // Check if this is a first-time user (no items ever created)
  const allItemsEver = user 
    ? supabasePausedItemsStore.getItems().length + supabasePausedItemsStore.getItemsForReview().length
    : pausedItems.length + pausedItemsStore.getItemsForReview().length;
  const isFirstTime = allItemsEver === 0;

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
        <PausedSectionEmpty isGuest={!user} hasReviewItems={false} isFirstTime={isFirstTime} />
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
        onDelete={handleDeleteItem}
        onDecideNow={handleDecideNow}
        onEdit={handleEditItem}
        currentUserId={user?.id}
      />

      {selectedItem && (
        <PausedItemDetail
          item={selectedItem}
          items={pausedItems}
          currentIndex={selectedItemIndex}
          isOpen={!!selectedItem}
          onClose={handleCloseDetail}
          onDelete={handleDeleteItem}
          onNavigateNext={handleNavigateNext}
          onNavigatePrevious={handleNavigatePrevious}
          onEdit={handleEditItem}
          currentUserId={user?.id}
        />
      )}

      {/* Review Modal for individual "Decide now" actions */}
      {showReviewModal && reviewItem && (
        <ItemReviewModal
          items={[reviewItem]}
          currentIndex={0}
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewItem(null);
          }}
          onItemDecided={(id: string) => {
            console.log('🎯 PausedSection: Item decided:', id);
            // Remove from the paused items list
            if (user) {
              supabasePausedItemsStore.removeItem(id);
            } else {
              pausedItemsStore.removeItem(id);
            }
            setShowReviewModal(false);
            setReviewItem(null);
          }}
          onNext={() => {
            // Since it's just one item, close the modal
            setShowReviewModal(false);
            setReviewItem(null);
          }}
        />
      )}
    </div>
  );
};

export default PausedSection;
