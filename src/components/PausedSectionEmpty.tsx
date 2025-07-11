
import { memo } from 'react';

interface PausedSectionEmptyProps {
  isGuest: boolean;
  hasReviewItems: boolean;
}

const PausedSectionEmpty = memo(({ isGuest, hasReviewItems }: PausedSectionEmptyProps) => {
  const getMessage = () => {
    if (hasReviewItems) {
      return "All your paused items are ready for review!";
    }
    
    return "Your pause list is clear, how lovely";
  };

  return (
    <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-6 text-center border border-lavender/30 dark:border-gray-600">
      <p className="text-gray-500 dark:text-gray-400">
        {getMessage()}
      </p>
      {isGuest && !hasReviewItems && (
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Guest mode - items stored locally
        </p>
      )}
    </div>
  );
});

PausedSectionEmpty.displayName = 'PausedSectionEmpty';

export default PausedSectionEmpty;
