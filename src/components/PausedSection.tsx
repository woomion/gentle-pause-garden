import { useState, useEffect, useCallback } from 'react';
import { pausedItemsStore, PausedItem } from '../stores/pausedItemsStore';
import PausedItemCard from './PausedItemCard';
import PausedItemDetail from './PausedItemDetail';
import ItemReviewModal from './ItemReviewModal';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';

const PausedSection = () => {
  const [pausedItems, setPausedItems] = useState<PausedItem[]>([]);
  const [itemsForReview, setItemsForReview] = useState<PausedItem[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [selectedItem, setSelectedItem] = useState<PausedItem | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);

  const sortItemsByDate = useCallback((items: PausedItem[]) => {
    return items.sort((a, b) => new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime());
  }, []);

  useEffect(() => {
    const updateItems = () => {
      const allItems = pausedItemsStore.getItems();
      const reviewItems = pausedItemsStore.getItemsForReview();
      
      setPausedItems(sortItemsByDate(allItems));
      setItemsForReview(reviewItems);
    };

    updateItems();

    const unsubscribe = pausedItemsStore.subscribe(updateItems);
    
    // Update every minute to keep countdown accurate
    const interval = setInterval(updateItems, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [sortItemsByDate]);

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

  const handleItemClick = useCallback((item: PausedItem) => {
    setSelectedItem(item);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedItem(null);
  }, []);

  const handleDeleteItem = useCallback((id: string) => {
    pausedItemsStore.removeItem(id);
    setSelectedItem(null);
  }, []);

  const handleStartReview = useCallback(() => {
    setCurrentReviewIndex(0);
    setShowReviewModal(true);
  }, []);

  const handleCloseReview = useCallback(() => {
    setShowReviewModal(false);
    setCurrentReviewIndex(0);
  }, []);

  const handleItemDecided = useCallback((id: string) => {
    pausedItemsStore.removeItem(id);
    // Update the review items list
    setItemsForReview(prev => prev.filter(item => item.id !== id));
  }, []);

  const handleNextReview = useCallback(() => {
    setCurrentReviewIndex(prev => prev + 1);
  }, []);

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
            No paused items yet. Add something to get started!
          </p>
        </div>
      </div>
    );
  }

  const totalItems = activeItems.length;
  const isSingleItem = totalItems === 1;

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
        Paused for now
      </h2>
      <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
        You haven't decided yet—and that's okay
      </p>
      
      {isSingleItem ? (
        <>
          <PausedItemCard 
            item={activeItems[0]} 
            onClick={() => handleItemClick(activeItems[0])} 
          />
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">1 item</span>
          </div>
        </>
      ) : (
        <div className="relative">
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
            
            <div className="hidden md:flex items-center justify-center mt-4 gap-4">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 static" />
              <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                {current}/{totalItems} items
              </span>
              <CarouselNext className="relative right-0 top-0 translate-y-0 static" />
            </div>
          </Carousel>
          
          <div className="flex md:hidden justify-center mt-2">
            <div className="bg-white dark:bg-white/10 rounded-full px-3 py-1 flex items-center gap-2 border border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-1" aria-hidden="true">
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {current}/{totalItems}
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
