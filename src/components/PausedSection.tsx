import { useState, useEffect, useCallback } from 'react';
import { supabasePausedItemsStore, PausedItem } from '../stores/supabasePausedItemsStore';
import { pausedItemsStore, PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useAuth } from '../contexts/AuthContext';
import PausedItemCard from './PausedItemCard';
import PausedItemDetail from './PausedItemDetail';
import ItemReviewModal from './ItemReviewModal';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';

const PausedSection = () => {
  const [pausedItems, setPausedItems] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [itemsForReview, setItemsForReview] = useState<(PausedItem | LocalPausedItem)[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
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

  useEffect(() => {
    if (!api) return;

    const updateCurrent = () => {
      setCurrent(api.selectedScrollSnap() + 1);
    };

    setCurrent(api.selectedScrollSnap() + 1);
    api.on('select', updateCurrent);

    return () => {
      api.off('select', updateCurrent);
    };
  }, [api]);

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

  // If user is not logged in, show guest mode with local items
  if (!user) {
    // Loading state for guests
    if (isLoading) {
      return (
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
            Paused for now
          </h2>
          <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
            You haven't decided yet—and that's okay
          </p>
          <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-6 text-center border border-lavender/30 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-400">
              Loading your paused items...
            </p>
          </div>
        </div>
      );
    }
  }

  // Loading state for authenticated users
  if (user && isLoading) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
          Paused for now
        </h2>
        <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
          You haven't decided yet—and that's okay
        </p>
        <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-6 text-center border border-lavender/30 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            Loading your paused items...
          </p>
        </div>
      </div>
    );
  }

  const activeItems = pausedItems.filter(item => !itemsForReview.some(reviewItem => reviewItem.id === item.id));

  // Review banner
  if (itemsForReview.length > 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
          Ready for review
        </h2>
        <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
          Time to make some decisions
        </p>
        
        <div className="bg-gradient-to-r from-[#E7D9FA] to-[#F3E8FF] rounded-2xl p-6 text-center border border-lavender/30">
          <h3 className="text-xl font-semibold text-black mb-2">
            You have {itemsForReview.length} item{itemsForReview.length === 1 ? '' : 's'} to review
          </h3>
          <p className="text-gray-700 mb-4 text-sm">
            {itemsForReview.length === 1 
              ? "Your pause period is complete. Time to decide!" 
              : "Your pause periods are complete. Let's review them one by one."}
          </p>
          <button 
            onClick={handleStartReview}
            className="bg-white hover:bg-gray-50 text-black font-medium py-3 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
          >
            Start Review
          </button>
        </div>

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
  }

  // Regular paused items display
  if (activeItems.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
          Paused for now
        </h2>
        <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
          You haven't decided yet—and that's okay
        </p>
        <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-6 text-center border border-lavender/30 dark:border-gray-600">
          <p className="text-gray-500 dark:text-gray-400">
            {!user 
              ? "No paused items yet. Add something to get started! (Guest mode - items stored locally)"
              : "No paused items yet. Add something to get started!"
            }
          </p>
        </div>
      </div>
    );
  }

  const totalItems = activeItems.length;
  const isSingleItem = totalItems === 1;
  
  // Group items into pairs for desktop view
  const groupedItems = [];
  for (let i = 0; i < activeItems.length; i += 2) {
    groupedItems.push(activeItems.slice(i, i + 2));
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
        Paused for now
      </h2>
      <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
        You haven't decided yet—and that's okay
      </p>
      
      {/* Guest mode indicator */}
      {!user && activeItems.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
          <p className="text-amber-800 dark:text-amber-200 text-sm text-center">
            <strong>Guest Mode:</strong> Items stored locally only
          </p>
        </div>
      )}
      
      {isSingleItem ? (
        <>
          <div className="md:max-w-md md:mx-auto lg:max-w-md lg:mx-auto">
            <PausedItemCard 
              item={activeItems[0]} 
              onClick={() => handleItemClick(activeItems[0])} 
            />
          </div>
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">1 item</span>
          </div>
        </>
      ) : (
        <div className="relative">
          {/* Mobile: single column carousel */}
          <div className="block md:hidden">
            <Carousel className="w-full" setApi={setApi}>
              <CarouselContent>
                {activeItems.map((item) => (
                  <CarouselItem key={item.id}>
                    <PausedItemCard 
                      item={item} 
                      onClick={() => handleItemClick(item)} 
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Desktop: two column carousel */}
          <div className="hidden md:block">
            <Carousel className="w-full" setApi={setApi}>
              <CarouselContent>
                {groupedItems.map((group, groupIndex) => (
                  <CarouselItem key={groupIndex}>
                    <div className="grid grid-cols-2 gap-4">
                      {group.map((item) => (
                        <PausedItemCard 
                          key={item.id}
                          item={item} 
                          onClick={() => handleItemClick(item)} 
                        />
                      ))}
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              <div className="flex items-center justify-center mt-4 gap-4">
                <CarouselPrevious className="relative left-0 top-0 translate-y-0 static" />
                <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                  {totalItems} {totalItems === 1 ? 'item' : 'items'}
                </span>
                <CarouselNext className="relative right-0 top-0 translate-y-0 static" />
              </div>
            </Carousel>
          </div>
          
          <div className="flex md:hidden justify-center mt-2">
            <div className="bg-white dark:bg-white/10 rounded-full px-3 py-1 flex items-center gap-2 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-1" aria-hidden="true">
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedItem && (
        <PausedItemDetail
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={handleCloseDetail}
          onDelete={handleDeleteItem}
        />
      )}
    </div>
  );
};

export default PausedSection;
