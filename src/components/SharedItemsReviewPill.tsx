import { memo } from 'react';
import { ArrowRight, Users } from 'lucide-react';

interface SharedItemsReviewPillProps {
  sharedItemsCount: number;
  partnerNames: string[];
  onStartReview: () => void;
}

const SharedItemsReviewPill = memo(({ sharedItemsCount, partnerNames, onStartReview }: SharedItemsReviewPillProps) => {
  if (sharedItemsCount === 0) return null;

  return (
    <div className="w-full">
      <button 
        onClick={onStartReview}
        className="w-full md:px-6 py-4 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] rounded-none"
        style={{ backgroundColor: '#BCEAFF' }}
      >
        <div className="text-base font-medium text-center text-black">
          {sharedItemsCount} partner item{sharedItemsCount === 1 ? '' : 's'} ready for review
        </div>
      </button>
    </div>
  );
});

SharedItemsReviewPill.displayName = 'SharedItemsReviewPill';

export default SharedItemsReviewPill;