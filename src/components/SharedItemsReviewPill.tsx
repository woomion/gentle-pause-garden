import { memo } from 'react';
import { ArrowRight, Search } from 'lucide-react';

interface SharedItemsReviewPillProps {
  sharedItemsCount: number;
  partnerNames: string[];
  onStartReview: () => void;
}

const SharedItemsReviewPill = memo(({ sharedItemsCount, partnerNames, onStartReview }: SharedItemsReviewPillProps) => {
  // Always show the pill, but disable when no items

  return (
    <div className="mb-4">
      <button 
        onClick={sharedItemsCount > 0 ? onStartReview : undefined}
        disabled={sharedItemsCount === 0}
        className={`rounded-full px-6 py-3 transition-all duration-200 transform shadow-sm ${
          sharedItemsCount > 0 
            ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' 
            : 'cursor-not-allowed opacity-50'
        } bg-green-100 dark:bg-green-900`}
      >
        <div className="text-base font-medium flex items-center gap-2 justify-center text-green-800 dark:text-green-100">
          <Search size={16} className="text-green-800 dark:text-green-100" />
          {sharedItemsCount > 0 
            ? `${sharedItemsCount} partner item${sharedItemsCount === 1 ? '' : 's'} ready for review`
            : 'No partner items ready for review'
          }
          <ArrowRight size={16} className="text-green-800 dark:text-green-100" />
        </div>
      </button>
    </div>
  );
});

SharedItemsReviewPill.displayName = 'SharedItemsReviewPill';

export default SharedItemsReviewPill;