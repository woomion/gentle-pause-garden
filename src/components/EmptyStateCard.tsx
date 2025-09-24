import { ShoppingBag, Heart, Clock } from 'lucide-react';

interface EmptyStateCardProps {
  mode: 'desktop' | 'pill';
}

const EmptyStateCard = ({ mode }: EmptyStateCardProps) => {
  if (mode === 'pill') {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p className="text-sm">No paused items yet</p>
        <p className="text-xs mt-1">Add something above to get started</p>
      </div>
    );
  }

  // Desktop mode - simple text version
  return (
    <div className="text-center py-12">
      <p className="text-lg text-muted-foreground mb-2">No paused items yet</p>
      <p className="text-sm text-muted-foreground/80">Add something below to get started</p>
    </div>
  );
};

export default EmptyStateCard;