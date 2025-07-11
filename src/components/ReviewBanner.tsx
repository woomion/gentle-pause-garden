
import { memo } from 'react';
import { ArrowRight } from 'lucide-react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  if (itemsCount === 0) return null;

  return (
    <div className="mb-4">
      <button 
        onClick={onStartReview}
        className="animate-gradient rounded-full px-4 py-2 border border-lavender/30 dark:border-gray-600 cursor-pointer hover:opacity-90 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="text-sm font-medium text-black dark:text-[#F9F5EB]">
          {itemsCount} item{itemsCount === 1 ? '' : 's'} ready to review
        </div>
      </button>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
