
import { useState, useEffect } from 'react';
import { pausedItemsStore, PausedItem } from '../stores/pausedItemsStore';
import PausedItemCard from './PausedItemCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';

const PausedSection = () => {
  const [pausedItems, setPausedItems] = useState<PausedItem[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // Initial load
    setPausedItems(pausedItemsStore.getItems());

    // Subscribe to changes
    const unsubscribe = pausedItemsStore.subscribe(() => {
      setPausedItems(pausedItemsStore.getItems());
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  if (pausedItems.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-black mb-0">Paused for now</h2>
        <p className="text-black text-lg mb-3">You haven't decided yet—and that's okay</p>
        <div className="bg-white/60 rounded-2xl p-6 text-center border border-lavender/30">
          <p className="text-gray-500">No paused items yet. Add something to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-semibold text-black mb-0">Paused for now</h2>
      <p className="text-black text-lg mb-3">You haven't decided yet—and that's okay</p>
      
      {pausedItems.length === 1 ? (
        <>
          <PausedItemCard item={pausedItems[0]} />
          <div className="flex justify-center mt-2">
            <span className="text-sm text-gray-600">1 item</span>
          </div>
        </>
      ) : (
        <div className="relative">
          <Carousel className="w-full" setApi={setApi}>
            <CarouselContent>
              {pausedItems.map((item) => (
                <CarouselItem key={item.id}>
                  <PausedItemCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Web only: Arrows positioned underneath with counter */}
            <div className="hidden md:flex items-center justify-center mt-4 gap-4 relative">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 static" />
              <span className="text-sm text-gray-600 px-4">
                {current}/{pausedItems.length} items
              </span>
              <CarouselNext className="relative right-0 top-0 translate-y-0 static" />
            </div>
          </Carousel>
          
          {/* Mobile only: Swipe indicator with count, closer to cards */}
          <div className="flex md:hidden justify-center mt-2">
            <div className="bg-white rounded-full px-3 py-1 flex items-center gap-2 border border-gray-200">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              </div>
              <span className="text-xs text-gray-600">
                {current}/{pausedItems.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PausedSection;
