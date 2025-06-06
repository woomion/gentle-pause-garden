
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
    
    return isGuest 
      ? "No paused items yet. Add something to get started! (Guest mode - items stored locally)"
      : "No paused items yet. Add something to get started!";
  };

  return (
    <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-6 text-center border border-lavender/30 dark:border-gray-600">
      <p className="text-gray-500 dark:text-gray-400">
        {getMessage()}
      </p>
    </div>
  );
});

PausedSectionEmpty.displayName = 'PausedSectionEmpty';

export default PausedSectionEmpty;
