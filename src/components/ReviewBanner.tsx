
import { memo } from 'react';
import { ArrowRight, Check } from 'lucide-react';

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
        className="rounded-full px-6 py-3 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm"
        style={{ backgroundColor: '#34D399' }}
      >
        <div className="text-base font-medium text-black flex items-center gap-2">
          <Check size={16} className="text-black" />
          {itemsCount} item{itemsCount === 1 ? '' : 's'} ready for review
        </div>
      </button>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
