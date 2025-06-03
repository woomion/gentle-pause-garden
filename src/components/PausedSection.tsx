
import { useState, useEffect } from 'react';
import { pausedItemsStore, PausedItem } from '../stores/pausedItemsStore';
import PausedItemCard from './PausedItemCard';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const PausedSection = () => {
  const [pausedItems, setPausedItems] = useState<PausedItem[]>([]);

  useEffect(() => {
    // Initial load
    setPausedItems(pausedItemsStore.getItems());

    // Subscribe to changes
    const unsubscribe = pausedItemsStore.subscribe(() => {
      setPausedItems(pausedItemsStore.getItems());
    });

    return unsubscribe;
  }, []);

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
        <PausedItemCard item={pausedItems[0]} />
      ) : (
        <div className="relative">
          <Carousel className="w-full">
            <CarouselContent>
              {pausedItems.map((item) => (
                <CarouselItem key={item.id}>
                  <PausedItemCard item={item} />
                </CarouselItem>
              ))}
            </CarouselContent>
            {pausedItems.length > 1 && (
              <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
              </>
            )}
          </Carousel>
          {pausedItems.length > 1 && (
            <div className="flex justify-center mt-2 gap-1">
              {pausedItems.map((_, index) => (
                <div
                  key={index}
                  className="w-2 h-2 rounded-full bg-gray-300"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PausedSection;
