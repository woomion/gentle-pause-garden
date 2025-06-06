
import { memo, useState, useEffect } from 'react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';
import PausedItemCard from './PausedItemCard';
import { PausedItem } from '../stores/pausedItemsStore';

interface PausedItemsCarouselProps {
  items: PausedItem[];
  onItemClick: (item: PausedItem) => void;
}

const PausedItemsCarousel = memo(({ items, onItemClick }: PausedItemsCarouselProps) => {
  const [api, setApi] = useState<CarouselApi>();

  useEffect(() => {
    if (!api) return;

    const updateCurrent = () => {
      // Handle carousel state if needed
    };

    api.on('select', updateCurrent);

    return () => {
      api.off('select', updateCurrent);
    };
  }, [api]);

  const totalItems = items.length;
  const isSingleItem = totalItems === 1;
  
  // Group items into pairs for desktop view
  const groupedItems = [];
  for (let i = 0; i < items.length; i += 2) {
    groupedItems.push(items.slice(i, i + 2));
  }

  if (isSingleItem) {
    return (
      <>
        <div className="md:max-w-md md:mx-auto lg:max-w-md lg:mx-auto">
          <PausedItemCard 
            item={items[0]} 
            onClick={() => onItemClick(items[0])} 
          />
        </div>
        <div className="flex justify-center mt-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">1 item</span>
        </div>
      </>
    );
  }

  return (
    <div className="relative">
      {/* Mobile: single column carousel */}
      <div className="block md:hidden">
        <Carousel className="w-full" setApi={setApi}>
          <CarouselContent>
            {items.map((item) => (
              <CarouselItem key={item.id}>
                <PausedItemCard 
                  item={item} 
                  onClick={() => onItemClick(item)} 
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
                      onClick={() => onItemClick(item)} 
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
  );
});

PausedItemsCarousel.displayName = 'PausedItemsCarousel';

export default PausedItemsCarousel;
