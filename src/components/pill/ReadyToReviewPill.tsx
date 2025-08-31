import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ReadyToReviewPillProps {
  count: number;
  onClick: () => void;
}

const ReadyToReviewPill: React.FC<ReadyToReviewPillProps> = ({ count, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="relative rounded-full overflow-hidden border border-border bg-background px-4 py-3 text-left transition-colors hover:bg-muted/50 text-foreground"
      aria-label={`Ready to review ${count} item${count === 1 ? '' : 's'}`}
    >
      <div className="relative z-10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">Ready to review</span>
          <ArrowRight size={16} />
        </div>
        <span className="shrink-0 text-xs opacity-80">{count}</span>
      </div>
    </button>
  );
};

export default ReadyToReviewPill;
