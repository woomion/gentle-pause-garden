import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem, pausedItemsStore } from '../stores/pausedItemsStore';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { supabasePauseLogStore } from '../stores/supabasePauseLogStore';
import { pauseLogStore } from '../stores/pauseLogStore';
import { useItemReviewCarousel } from '../hooks/useItemReviewCarousel';
import { ItemReviewContent } from './ItemReviewContent';
import ItemReviewDecisionButtons from './ItemReviewDecisionButtons';

import { useAuth } from '@/contexts/AuthContext';
import { useScrollLock } from '@/hooks/useScrollLock';
import { toast } from '@/hooks/use-toast';

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
  // Remove reflection/feedback state - no longer needed
  
  const { activeIndex, api, setApi, navigateToNext } = useItemReviewCarousel(
    currentIndex,
    isOpen,
    items.length
  );
  const { user } = useAuth();
  
  
  // Lock background scroll when modal is open
  useScrollLock(isOpen);

  const currentItem = items[activeIndex];
  const isLastItem = activeIndex >= items.length - 1;

  // Reset state when modal opens or active item changes (simplified)
  useEffect(() => {
    // No feedback state to reset anymore
  }, [isOpen, activeIndex]);

  if (!isOpen || !currentItem) return null;

  const handleNavigateNext = () => {
    // Simplified navigation without feedback state
    const nextIndex = navigateToNext();
    if (nextIndex === null) {
      onClose();
    }
  };

  const handleTakeToLink = async () => {
    const url = currentItem.link || (currentItem as any).url;
    if (url) {
      const { openExternalUrl } = await import('../utils/browserUtils');
      await openExternalUrl(url);
    }
  };

  const handleDecision = async (decision: 'purchase' | 'let-go') => {
    console.log('🎯 ItemReviewModal: handleDecision called with:', decision);
    
    // Process decision immediately for all items (no reflection/feedback step)
    console.log('🎯 ItemReviewModal: Processing decision immediately');
    try {
      // Add to pause log
      if (user) {
        await supabasePauseLogStore.addItem({
          itemName: currentItem.itemName,
          storeName: currentItem.storeName,
          status: decision === 'purchase' ? 'purchased' : 'let-go',
          notes: '',
          tags: currentItem.tags
        });
      } else {
        pauseLogStore.addItem({
          itemName: currentItem.itemName,
          storeName: currentItem.storeName,
          status: decision === 'purchase' ? 'purchased' : 'let-go',
          notes: '',
          tags: currentItem.tags
        });
      }
      
      console.log('🎯 ItemReviewModal: Calling onItemDecided to remove item');
      onItemDecided(currentItem.id);
      
      if (isLastItem) {
        console.log('🎯 ItemReviewModal: Closing modal (last item)');
        onClose();
      }
      // Don't call handleNavigateNext() - the item removal will automatically show the next item
    } catch (error) {
      console.error('❌ ItemReviewModal: Error processing decision:', error);
    }
  };

  const handleClose = () => {
    // Simplified close handler without feedback mode
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-background border border-border rounded-2xl w-full max-w-md mx-auto relative max-h-[90vh] overflow-y-auto shadow-lg" style={{ backgroundColor: 'hsl(var(--background))' }}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Ready to decide?
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-muted-foreground text-sm">
                  {activeIndex + 1} of {items.length}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <X size={20} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        {items.length > 1 ? (
          <>
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
                      showDecisionButtons={false}
                      userValues={[]}
                    />
                    
                     {/* Decision buttons right after values section for current item */}
                     {index === activeIndex && (
                       <div className="px-6 pb-6">
                         <ItemReviewDecisionButtons 
                           onDecision={handleDecision} 
                           onTakeToLink={handleTakeToLink}
                           hasUrl={!!(currentItem.link || (currentItem as any).url)}
                         />
                       </div>
                     )}
                    
                    {/* Carousel Navigation below item */}
                    {index === activeIndex && (
                      <div className="flex items-center justify-center gap-4 px-6 pb-4">
                        <CarouselPrevious className="relative left-0 top-0 translate-y-0 static" />
                        <span className="text-xs text-muted-foreground px-2">
                          Swipe or use arrows
                        </span>
                        <CarouselNext className="relative right-0 top-0 translate-y-0 static" />
                      </div>
                    )}
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </>
        ) : (
          <ItemReviewContent
            item={currentItem}
            onItemDecided={onItemDecided}
            onNavigateNext={handleNavigateNext}
            onClose={onClose}
            isLastItem={isLastItem}
            userValues={[]}
          />
        )}
      </div>
    </div>
  );
};

export default ItemReviewModal;