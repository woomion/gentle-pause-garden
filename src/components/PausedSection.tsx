
import { useState, useEffect, useCallback } from 'react';
import { pausedItemsStore, PausedItem } from '../stores/pausedItemsStore';
import PausedItemCard from './PausedItemCard';
import PausedItemDetail from './PausedItemDetail';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';

const PausedSection = () => {
  const [pausedItems, setPausedItems] = useState<PausedItem[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [selectedItem, setSelectedItem] = useState<PausedItem | null>(null);

  const sortItemsByDate = useCallback((items: PausedItem[]) => {
    return items.sort((a, b) => new Date(b.pausedAt).getTime() - new Date(a.pausedAt).getTime());
  }, []);

  useEffect(() => {
    const items = sortItemsByDate(pausedItemsStore.getItems());
    setPausedItems(items);

    const unsubscribe = pausedItemsStore.subscribe(() => {
      const updatedItems = sortItemsByDate(pausedItemsStore.getItems());
      setPausedItems(updatedItems);
    });

    return unsubscribe;
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

  if (pausedItems.length === 0) {
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

  const totalItems = pausedItems.length;
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
            item={pausedItems[0]} 
            onClick={() => handleItemClick(pausedItems[0])} 
          />
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">1 item</span>
          </div>
        </>
      ) : (
        <div className="relative">
          <Carousel className="w-full" setApi={setApi}>
            <CarouselContent>
              {pausedItems.map((item) => (
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
