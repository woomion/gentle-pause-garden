
import { memo } from 'react';
import { ArrowRight, Search } from 'lucide-react';

interface ReviewBannerProps {
  itemsCount: number;
  onStartReview: () => void;
}

const ReviewBanner = memo(({ itemsCount, onStartReview }: ReviewBannerProps) => {
  // Always show the banner, but disable when no items

  return (
    <div className="mb-4">
      <button 
        onClick={itemsCount > 0 ? onStartReview : undefined}
        disabled={itemsCount === 0}
        className={`rounded-full px-6 py-3 transition-all duration-200 transform shadow-sm ${
          itemsCount > 0 
            ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' 
            : 'cursor-not-allowed opacity-50'
        }`}
        style={{ backgroundColor: '#E7D9FA' }}
      >
        <div className="text-base font-medium flex items-center gap-2" style={{ color: '#5C47A3' }}>
          <Search size={16} style={{ color: '#5C47A3' }} />
          {itemsCount > 0 
            ? `${itemsCount} solo item${itemsCount === 1 ? '' : 's'} ready for review`
            : 'No solo items ready for review'
          }
          <ArrowRight size={16} style={{ color: '#5C47A3' }} />
        </div>
      </button>
    </div>
  );
});

ReviewBanner.displayName = 'ReviewBanner';

export default ReviewBanner;
