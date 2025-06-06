
import { memo } from 'react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  if (itemsCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#E7D9FA] to-[#F3E8FF] rounded-2xl p-4 mb-4 border border-lavender/30">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-black mb-1">
            {itemsCount} item{itemsCount === 1 ? '' : 's'} ready for review
          </h3>
          <p className="text-gray-700 text-sm">
            {itemsCount === 1 
              ? "Your pause period is complete. Time to decide!" 
              : "Your pause periods are complete. Let's review them."}
          </p>
        </div>
        <button 
          onClick={onStartReview}
          className="bg-white hover:bg-gray-50 text-black font-medium py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm whitespace-nowrap"
        >
          Review Now
        </button>
      </div>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
