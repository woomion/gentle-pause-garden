
import { memo } from 'react';
import { ArrowRight } from 'lucide-react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  if (itemsCount === 0) return null;

  return (
    <div 
      onClick={onStartReview}
      className="review-banner-gradient rounded-2xl px-4 py-0.5 mb-4 border border-lavender/30 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-opacity duration-200"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-black dark:text-[#F9F5EB]">
            {itemsCount} item{itemsCount === 1 ? '' : 's'} ready for review
          </h3>
        </div>
        <div className="text-purple dark:text-lavender font-medium whitespace-nowrap flex items-center gap-1">
          Review Now
          <ArrowRight size={16} />
        </div>
      </div>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
