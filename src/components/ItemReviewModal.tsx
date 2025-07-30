import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useItemReviewCarousel } from '../hooks/useItemReviewCarousel';
import { ItemReviewContent } from './ItemReviewContent';
import ItemReviewDecisionButtons from './ItemReviewDecisionButtons';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollLock } from '@/hooks/useScrollLock';
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
  const [showFeedback, setShowFeedback] = useState(false);
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

  // Reset feedback state when modal opens or active item changes
  useEffect(() => {
    if (isOpen) {
      setShowFeedback(false);
    }
  }, [isOpen, activeIndex]);

  if (!isOpen || !currentItem) return null;

  const handleNavigateNext = () => {
    // Reset feedback state when navigating
    setShowFeedback(false);
    const nextIndex = navigateToNext();
    if (nextIndex === null) {
      onClose();
    }
  };

  const handleClose = () => {
    if (showFeedback) {
      // If in feedback mode, go back to decision buttons
      setShowFeedback(false);
    } else {
      // If not in feedback mode, close the modal
      onClose();
    }
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
                      showFeedback={showFeedback}
                      setShowFeedback={setShowFeedback}
                      showDecisionButtons={false}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
              
              {/* Carousel Navigation */}
              <div className="flex items-center justify-center pb-4 gap-4 border-b border-border">
                <CarouselPrevious className="relative left-0 top-0 translate-y-0 static" />
                <span className="text-sm text-gray-600 px-4">
                  Swipe or use arrows to navigate
                </span>
                <CarouselNext className="relative right-0 top-0 translate-y-0 static" />
              </div>
            </Carousel>
            
            {/* Static Decision Buttons for Current Item */}
            {!showFeedback && (
              <div className="p-6 pt-0">
                <ItemReviewDecisionButtons 
                  onDecision={(decision) => setShowFeedback(true)} 
                  onExtendPause={() => {}}
                />
              </div>
            )}
          </>
        ) : (
          <ItemReviewContent
            item={currentItem}
            onItemDecided={onItemDecided}
            onNavigateNext={handleNavigateNext}
            onClose={onClose}
            isLastItem={isLastItem}
            showFeedback={showFeedback}
            setShowFeedback={setShowFeedback}
          />
        )}
      </div>
    </div>
  );
};

export default ItemReviewModal;