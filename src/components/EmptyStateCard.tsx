import { ShoppingBag, Heart, Clock } from 'lucide-react';

interface EmptyStateCardProps {
  mode: 'desktop' | 'pill';
}

const EmptyStateCard = ({ mode }: EmptyStateCardProps) => {
  const message = "Add the link of something you're thinking about buying below to get started";
  
  if (mode === 'pill') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-8 px-4 w-full">
        <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      </div>
    );
  }

  // Desktop mode - centered on all screen sizes
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4 w-full min-h-[200px]">
      <p className="text-base text-muted-foreground max-w-md">{message}</p>
    </div>
  );
};

export default EmptyStateCard;