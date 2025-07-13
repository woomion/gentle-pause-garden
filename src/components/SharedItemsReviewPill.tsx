import { memo } from 'react';
import { ArrowRight, Users } from 'lucide-react';

interface SharedItemsReviewPillProps {
  sharedItemsCount: number;
  partnerNames: string[];
  onStartReview: () => void;
}

const SharedItemsReviewPill = memo(({ sharedItemsCount, partnerNames, onStartReview }: SharedItemsReviewPillProps) => {
  if (sharedItemsCount === 0) return null;

  // Create subtitle showing partner distribution
  const createPartnerSubtitle = () => {
    if (partnerNames.length === 0) return '';
    if (partnerNames.length === 1) {
      return `${sharedItemsCount} with ${partnerNames[0]}`;
    }
    if (partnerNames.length === 2) {
      return `1 with ${partnerNames[0]}, 1 with ${partnerNames[1]}`;
    }
    // For more than 2 partners, show first two and indicate more
    return `with ${partnerNames[0]}, ${partnerNames[1]} & more`;
  };

  return (
    <div className="mb-4">
      <button 
        onClick={onStartReview}
        className="rounded-full px-6 py-3 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm w-full bg-shared-review"
      >
        <div className="text-base font-medium flex items-center gap-2 justify-center text-shared-review-foreground">
          <Users size={16} className="text-shared-review-foreground" />
          👥 {sharedItemsCount} shared item{sharedItemsCount === 1 ? '' : 's'} ready for review
          <ArrowRight size={16} className="text-shared-review-foreground" />
        </div>
        {partnerNames.length > 0 && (
          <div className="text-xs text-center mt-1 text-shared-review-muted">
            {createPartnerSubtitle()}
          </div>
        )}
      </button>
    </div>
  );
});

SharedItemsReviewPill.displayName = 'SharedItemsReviewPill';

export default SharedItemsReviewPill;