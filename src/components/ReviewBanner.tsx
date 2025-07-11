
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
        className="rounded-full px-4 py-2 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        style={{ backgroundColor: '#7280FF' }}
      >
        <div className="text-base font-medium text-black dark:text-black">
          {itemsCount} item{itemsCount === 1 ? '' : 's'} ready for review
        </div>
      </button>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
