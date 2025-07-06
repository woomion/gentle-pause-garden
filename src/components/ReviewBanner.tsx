
import { memo } from 'react';
import { Clock } from 'lucide-react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  if (itemsCount === 0) return null;

  return (
    <div className="bg-gradient-to-r from-[#E7D9FA] to-[#F3E8FF] dark:from-[#4A1D6B] dark:to-[#5C2D7A] rounded-2xl p-3 mb-4 border border-lavender/30 dark:border-gray-600 shadow-lg shadow-primary/10 dark:shadow-primary/20 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-black dark:text-[#F9F5EB] opacity-70" />
          <h3 className="text-base font-medium text-black dark:text-[#F9F5EB]">
            {itemsCount} item{itemsCount === 1 ? '' : 's'} ready for review
          </h3>
        </div>
        <button 
          onClick={onStartReview}
          className="bg-black dark:bg-white text-white dark:text-black font-medium py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg whitespace-nowrap border-0 hover:bg-gray-800 dark:hover:bg-gray-100"
        >
          Review Now
        </button>
      </div>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
