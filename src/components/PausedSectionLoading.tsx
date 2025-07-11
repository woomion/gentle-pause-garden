
import { memo } from 'react';

const PausedSectionLoading = memo(() => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold text-black dark:text-[#F9F5EB] mb-0">
        Paused for now
      </h2>
      <p className="text-black dark:text-[#F9F5EB] text-lg mb-3">
        You haven't decided yet and that's okay
      </p>
      <div className="bg-white/60 dark:bg-white/10 rounded-2xl p-6 text-center border border-lavender/30 dark:border-gray-600">
        <p className="text-gray-500 dark:text-gray-400">
          Loading your paused items...
        </p>
      </div>
    </div>
  );
});

PausedSectionLoading.displayName = 'PausedSectionLoading';

export default PausedSectionLoading;
