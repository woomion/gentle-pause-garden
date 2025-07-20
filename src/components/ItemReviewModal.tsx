
import { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useItemReviewCarousel } from '../hooks/useItemReviewCarousel';
import { ItemReviewContent } from './ItemReviewContent';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { usePausePartners } from '@/hooks/usePausePartners';
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
  const { partners } = usePausePartners();
  
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

  // Get sharing attribution text for current item
  const getAttributionText = useMemo(() => {
    if (!user?.id || !currentItem || !('sharedWithPartners' in currentItem) || !currentItem.sharedWithPartners?.length) {
      return null;
    }

    const itemOwnerId = currentItem.originalUserId;
    if (!itemOwnerId) {
      return null;
    }

    const isSharedByCurrentUser = itemOwnerId === user.id;
    
    if (isSharedByCurrentUser) {
      // Current user shared this item - show who they shared it with
      const sharedWithPartners = partners.filter(partner => 
        currentItem.sharedWithPartners?.includes(partner.partner_id)
      );
      
      if (sharedWithPartners.length > 0) {
        if (sharedWithPartners.length === 1) {
          return { from: 'You', to: sharedWithPartners[0].partner_name, direction: 'shared-with' };
        } else {
          return { from: 'You', to: `${sharedWithPartners.length} partners`, direction: 'shared-with' };
        }
      } else if (currentItem.sharedWithPartners.length > 0) {
        // Fallback: if partners data isn't loaded but we know it's shared
        return { from: 'You', to: `${currentItem.sharedWithPartners.length} partner${currentItem.sharedWithPartners.length > 1 ? 's' : ''}`, direction: 'shared-with' };
      }
    } else {
      // Partner shared this with current user
      const sharer = partners.find(p => p.partner_id === itemOwnerId);
      if (sharer) {
        return { from: sharer.partner_name, to: 'You', direction: 'shared-by' };
      } else {
        // Fallback: if partner data isn't loaded but we know it's from a partner
        return { from: 'Partner', to: 'You', direction: 'shared-by' };
      }
    }
    
    return null;
  }, [user?.id, currentItem, partners]);

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
      <div className="bg-card rounded-2xl w-full max-w-md mx-auto border border-border relative max-h-[90vh] overflow-y-auto">
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
                {/* Directional Attribution Badge */}
                {getAttributionText && (
                  <Badge className="bg-green-100 text-green-800 text-xs flex items-center justify-center gap-2">
                    <span className="text-xs leading-none flex items-center">{getAttributionText.from}</span>
                    <span className="text-lg leading-none flex items-center justify-center h-4">→</span>
                    <span className="text-xs leading-none flex items-center">{getAttributionText.to}</span>
                  </Badge>
                )}
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
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            
            {/* Carousel Navigation at Bottom */}
            <div className="flex items-center justify-center pb-4 gap-4">
              <CarouselPrevious className="relative left-0 top-0 translate-y-0 static" />
              <span className="text-sm text-gray-600 px-4">
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
            showFeedback={showFeedback}
            setShowFeedback={setShowFeedback}
          />
        )}
      </div>
    </div>
  );
};

export default ItemReviewModal;
