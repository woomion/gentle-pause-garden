
import { memo } from 'react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  if (itemsCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#E7D9FA] to-[#F3E8FF] dark:from-[#4A1D6B] dark:to-[#5C2D7A] rounded-2xl px-4 py-1 mb-4 border border-lavender/30 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-black dark:text-[#F9F5EB]">
            {itemsCount} item{itemsCount === 1 ? '' : 's'} ready for review
          </h3>
        </div>
        <button 
          onClick={onStartReview}
          className="bg-white hover:bg-gray-50 dark:bg-white/10 dark:hover:bg-white/20 text-black dark:text-[#F9F5EB] font-medium py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap border border-gray-200 dark:border-gray-600"
        >
          Review Now
        </button>
      </div>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
