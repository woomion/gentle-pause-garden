import { useState, useEffect, useCallback } from 'react';
import { supabasePausedItemsStore, PausedItem } from '../stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useAuth } from '../contexts/AuthContext';
import PausedItemDetail from './PausedItemDetail';
import ItemReviewModal from './ItemReviewModal';
import ReviewBanner from './ReviewBanner';
import GuestModeIndicator from './GuestModeIndicator';
import PausedItemsCarousel from './PausedItemsCarousel';
import PausedSectionEmpty from './PausedSectionEmpty';
import PausedSectionLoading from './PausedSectionLoading';

const PausedSection = () => {
  const [pausedItems, setPausedItems] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [itemsForReview, setItemsForReview] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [selectedItem, setSelectedItem] = useState<PausedItem | LocalPausedItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const { user } = useAuth();

  const sortItemsByDate = useCallback((items: (PausedItem | LocalPausedItem)[]) => {
    return items.sort((a, b) => new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime());
  }, []);

  useEffect(() => {
    const updateItems = () => {
      if (user) {
        // Use Supabase store for authenticated users
        const allItems = supabasePausedItemsStore.getItems();
        const reviewItems = supabasePausedItemsStore.getItemsForReview();
        
        setPausedItems(sortItemsByDate(allItems));
        setItemsForReview(reviewItems);
        
        if (supabasePausedItemsStore.isDataLoaded()) {
          setIsLoading(false);
        }
      } else {
        // Use local store for guest users
        const allItems = pausedItemsStore.getItems();
        const reviewItems = pausedItemsStore.getItemsForReview();
        
        setPausedItems(sortItemsByDate(allItems));
        setItemsForReview(reviewItems);
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

  const handleStartReview = useCallback(() => {
    setCurrentReviewIndex(0);
    setShowReviewModal(true);
  }, []);

  const handleCloseReview = useCallback(() => {
    setShowReviewModal(false);
    setCurrentReviewIndex(0);
  }, []);

  const handleItemDecided = useCallback(async (id: string) => {
    if (user) {
      await supabasePausedItemsStore.removeItem(id);
    } else {
      pausedItemsStore.removeItem(id);
    }
    // Update the review items list
    setItemsForReview(prev => prev.filter(item => item.id !== id));
  }, [user]);

  const handleNextReview = useCallback(() => {
    setCurrentReviewIndex(prev => prev + 1);
  }, []);

  // Loading state
  if (isLoading) {
    return <PausedSectionLoading />;
  }

  const activeItems = pausedItems.filter(item => !itemsForReview.some(reviewItem => reviewItem.id === item.id));

  // Empty state when no items
  if (activeItems.length === 0 && itemsForReview.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
          Paused for now
        </h2>
        <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
          You haven't decided yet—and that's okay
        </p>
        <PausedSectionEmpty isGuest={!user} hasReviewItems={false} />
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
        Paused for now
      </h2>
      <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
        You haven't decided yet—and that's okay
      </p>
      
      <ReviewBanner 
        itemsCount={itemsForReview.length}
        onStartReview={handleStartReview}
      />

      <GuestModeIndicator 
        show={!user && (activeItems.length > 0 || itemsForReview.length > 0)}
      />

      {/* Paused items display */}
      {activeItems.length > 0 ? (
        <PausedItemsCarousel 
          items={activeItems}
          onItemClick={handleItemClick}
        />
      ) : (
        <PausedSectionEmpty isGuest={!user} hasReviewItems={true} />
      )}

      {selectedItem && (
        <PausedItemDetail
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={handleCloseDetail}
          onDelete={handleDeleteItem}
        />
      )}

      {showReviewModal && (
        <ItemReviewModal
          items={itemsForReview}
          currentIndex={currentReviewIndex}
          isOpen={showReviewModal}
          onClose={handleCloseReview}
          onItemDecided={handleItemDecided}
          onNext={handleNextReview}
        />
      )}
    </div>
  );
};

export default PausedSection;
