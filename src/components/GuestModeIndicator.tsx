
import { memo } from 'react';

interface GuestModeIndicatorProps {
  show: boolean;
}

const GuestModeIndicator = memo(({ show }: GuestModeIndicatorProps) => {
  if (!show) return null;

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
      <p className="text-amber-800 dark:text-amber-200 text-sm text-center">
        <strong>Guest Mode:</strong> Items stored locally only
      </p>
    </div>
  );
});

GuestModeIndicator.displayName = 'GuestModeIndicator';

export default GuestModeIndicator;
