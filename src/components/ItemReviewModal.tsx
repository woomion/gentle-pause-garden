
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useItemReviewCarousel } from '../hooks/useItemReviewCarousel';
import { ItemReviewContent } from './ItemReviewContent';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface ItemReviewModalProps {
  items: (PausedItem | LocalPausedItem)[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onItemDecided: (id: string) => void;
  onNext: () => void;
}

const ItemReviewModal = ({
  items,
  currentIndex,
  isOpen,
  onClose,
  onItemDecided,
  onNext
}: ItemReviewModalProps) => {
  const { activeIndex, api, setApi, navigateToNext } = useItemReviewCarousel(
    currentIndex,
    isOpen,
    items.length
  );

  const currentItem = items[activeIndex];
  const isLastItem = activeIndex >= items.length - 1;

  if (!isOpen || !currentItem) return null;

  const handleNavigateNext = () => {
    const nextIndex = navigateToNext();
    if (nextIndex === null) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-cream dark:bg-[#200E3B] rounded-2xl w-full max-w-md mx-auto border border-lavender/30 dark:border-gray-600 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-lavender/30 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB]">
                Ready to decide?
              </h2>
              <p className="text-black dark:text-[#F9F5EB] text-sm mt-1">
                {activeIndex + 1} of {items.length}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-lavender/20 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} className="text-black dark:text-[#F9F5EB]" />
            </button>
          </div>
        </div>

        {/* Content */}
        {items.length > 1 ? (
          <Carousel className="w-full" setApi={setApi} opts={{ startIndex: activeIndex }}>
            <CarouselContent>
              {items.map((item, index) => (
                <CarouselItem key={item.id}>
                  <ItemReviewContent
                    item={item}
                    onItemDecided={onItemDecided}
                    onNavigateNext={handleNavigateNext}
                    onClose={onClose}
                    isLastItem={index >= items.length - 1}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Carousel Navigation at Bottom */}
            <div className="flex items-center justify-center pb-4 gap-4">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 static" />
              <span className="text-sm text-gray-600 dark:text-gray-400 px-4">
                Swipe or use arrows to navigate
              </span>
              <CarouselNext className="relative right-0 top-0 translate-y-0 static" />
            </div>
          </Carousel>
        ) : (
          <ItemReviewContent
            item={currentItem}
            onItemDecided={onItemDecided}
            onNavigateNext={handleNavigateNext}
            onClose={onClose}
            isLastItem={isLastItem}
          />
        )}
      </div>
    </div>
  );
};

export default ItemReviewModal;
