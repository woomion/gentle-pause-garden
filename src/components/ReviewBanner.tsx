
import { memo } from 'react';
import { ArrowRight } from 'lucide-react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  if (itemsCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#E7D9FA] to-[#F3E8FF] dark:from-[#4A1D6B] dark:to-[#5C2D7A] rounded-2xl px-4 py-0.5 mb-4 border border-lavender/30 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-black dark:text-[#F9F5EB]">
            {itemsCount} item{itemsCount === 1 ? '' : 's'} ready for review
          </h3>
        </div>
        <button 
          onClick={onStartReview}
          className="text-purple dark:text-lavender font-medium hover:text-purple/80 dark:hover:text-lavender/80 transition-colors duration-200 whitespace-nowrap flex items-center gap-1"
        >
          Review Now
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
