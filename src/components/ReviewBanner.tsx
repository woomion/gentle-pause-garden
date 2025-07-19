
import { memo } from 'react';
import { ArrowRight, Search } from 'lucide-react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  if (itemsCount === 0) return null;

  return (
    <div className="w-full">
      <button 
        onClick={onStartReview}
        className="w-full md:px-6 py-4 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] rounded-none"
        style={{ backgroundColor: '#A3C4E0' }}
      >
        <div className="text-base font-medium text-center text-black">
          {itemsCount} item{itemsCount === 1 ? '' : 's'} ready for review
        </div>
      </button>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
