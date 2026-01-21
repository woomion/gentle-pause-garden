import { ShoppingBag, Heart, Clock } from 'lucide-react';

interface EmptyStateCardProps {
  mode: 'desktop' | 'pill';
}

const EmptyStateCard = ({ mode }: EmptyStateCardProps) => {
  const message = "Add the link of something you're thinking about buying below to get started";
  
  if (mode === 'pill') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 px-4 w-full flex-1">
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      </div>
    );
  }

  // Desktop mode - truly centered vertically and horizontally
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 w-full flex-1 min-h-[40vh]">
      <p className="text-base text-muted-foreground max-w-md">{message}</p>
    </div>
  );
};

export default EmptyStateCard;