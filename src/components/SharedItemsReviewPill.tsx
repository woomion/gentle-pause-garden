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
    <div className="mb-4">
      <button 
        onClick={onStartReview}
        className="rounded-full px-6 py-4 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        style={{ backgroundColor: '#E7D9FA' }}
      >
        <div className="text-base font-medium flex items-center gap-2 justify-center" style={{ color: '#5C47A3' }}>
          <Users size={16} style={{ color: '#5C47A3' }} />
          {sharedItemsCount} partner item{sharedItemsCount === 1 ? '' : 's'} ready for review
          <ArrowRight size={16} style={{ color: '#5C47A3' }} />
        </div>
      </button>
    </div>
  );
});

SharedItemsReviewPill.displayName = 'SharedItemsReviewPill';

export default SharedItemsReviewPill;