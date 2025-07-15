import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PausedItem } from '@/stores/supabasePausedItemsStore';
import { ItemReviewContent } from '@/components/ItemReviewContent';

interface PartnerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  items: PausedItem[];
  currentUserId: string | null;
}

const PartnerReviewModal = ({ isOpen, onClose, partnerName, items, currentUserId }: PartnerReviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);

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

  if (!currentItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {partnerName}'s Items Ready for Review
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {items.length > 1 && (
            <div className="flex items-center justify-between mt-3">
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
              
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1} of {items.length}
              </span>
              
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
        </DialogHeader>
        
        <div className="overflow-y-auto px-6 py-4">
          <ItemReviewContent
            item={currentItem}
            onItemDecided={() => {}} // No-op since partners can't decide
            onNavigateNext={handleNext}
            onClose={onClose}
            isLastItem={currentIndex === items.length - 1}
            showFeedback={false}
            setShowFeedback={() => {}} // No-op for partners
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PartnerReviewModal;