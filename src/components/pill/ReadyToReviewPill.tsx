import React from 'react';

interface ReadyToReviewPillProps {
  count: number;
  onClick: () => void;
}

const ReadyToReviewPill: React.FC<ReadyToReviewPillProps> = ({ count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-full overflow-hidden border px-4 py-3 text-left transition-colors"
      style={{
        backgroundColor: 'hsl(var(--shared-review))',
        borderColor: 'hsl(var(--shared-review-muted))',
        color: 'hsl(var(--shared-review-foreground))',
      }}
      aria-label={`Ready to review ${count} item${count === 1 ? '' : 's'}`}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className="truncate font-medium">Ready to review</span>
        <span className="shrink-0 text-xs opacity-80">{count}</span>
      </div>
    </button>
  );
};

export default ReadyToReviewPill;
