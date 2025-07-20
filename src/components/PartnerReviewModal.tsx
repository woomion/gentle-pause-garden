import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PausedItem } from '@/stores/supabasePausedItemsStore';
import { ItemReviewContent } from '@/components/ItemReviewContent';
import { useScrollLock } from '@/hooks/useScrollLock';

interface PartnerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  items: PausedItem[];
  currentUserId: string | null;
}

const PartnerReviewModal = ({ isOpen, onClose, partnerName, items, currentUserId }: PartnerReviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Lock background scroll when modal is open
  useScrollLock(isOpen);

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const currentItem = items[currentIndex];

  if (!isOpen || !currentItem) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-card rounded-2xl w-full max-w-md mx-auto border border-border relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                {partnerName}'s Items
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-muted-foreground text-sm">
                  {currentIndex + 1} of {items.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-accent rounded-full transition-colors"
            >
              <X size={20} className="text-foreground" />
            </button>
          </div>
          
          {/* Navigation Buttons */}
          {items.length > 1 && (
            <div className="flex items-center justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={currentIndex === items.length - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {/* Content */}
        <ItemReviewContent
          item={currentItem}
          onItemDecided={() => {}} // No-op since partners can't decide
          onNavigateNext={handleNext}
          onClose={onClose}
          isLastItem={currentIndex === items.length - 1}
          showFeedback={false}
          setShowFeedback={() => {}} // No-op for partners
          showDecisionButtons={false} // Partners can't make decisions
        />
      </div>
    </div>
  );
};

export default PartnerReviewModal;