
import { memo } from 'react';

interface PausedSectionEmptyProps {
  isGuest: boolean;
  hasReviewItems: boolean;
  isFirstTime?: boolean;
}

const PausedSectionEmpty = memo(({ isGuest, hasReviewItems, isFirstTime }: PausedSectionEmptyProps) => {
  const getMessage = () => {
    if (hasReviewItems) {
      return "All your paused items are ready for review!";
    }
    
    if (isFirstTime) {
      return "Ready to pause your first purchase? Add a link below!";
    }
    
    return "Your pause list is clear, how lovely";
  };

  return (
    <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-6 text-center border border-lavender/30 dark:border-gray-600">
      <p className="text-gray-500 dark:text-gray-400">
        {getMessage()}
      </p>
      {isGuest && !hasReviewItems && !isFirstTime && (
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Guest mode - items stored locally
        </p>
      )}
      {isFirstTime && (
        <p className="text-primary/60 text-sm mt-2">
          Paste any shopping link to get started ✨
        </p>
      )}
    </div>
  );
});

PausedSectionEmpty.displayName = 'PausedSectionEmpty';

export default PausedSectionEmpty;
