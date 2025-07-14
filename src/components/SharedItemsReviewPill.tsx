import { memo } from 'react';
import { ArrowRight, Search } from 'lucide-react';

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
        className="rounded-full px-6 py-3 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm bg-green-100 dark:bg-green-900"
      >
        <div className="text-base font-medium flex items-center gap-2 justify-center text-green-800 dark:text-green-100">
          <Search size={16} className="text-green-800 dark:text-green-100" />
          {sharedItemsCount} partner item{sharedItemsCount === 1 ? '' : 's'} ready for review
          <ArrowRight size={16} className="text-green-800 dark:text-green-100" />
        </div>
      </button>
    </div>
  );
});

SharedItemsReviewPill.displayName = 'SharedItemsReviewPill';

export default SharedItemsReviewPill;