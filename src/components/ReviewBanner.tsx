
import { memo } from 'react';
import { ArrowRight } from 'lucide-react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  if (itemsCount === 0) return null;

  return (
    <div className="flex justify-center mb-4">
      <button 
        onClick={onStartReview}
        className="animate-gradient rounded-full px-6 py-3 border border-lavender/30 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="text-center">
          <div className="text-sm font-medium text-black dark:text-[#F9F5EB] mb-1">
            {itemsCount} item{itemsCount === 1 ? '' : 's'} ready to review
          </div>
          <div className="text-purple dark:text-lavender font-medium flex items-center justify-center gap-1 text-sm">
            Review Now
            <ArrowRight size={14} />
          </div>
        </div>
      </button>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
