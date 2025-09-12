import { Plus, Package } from 'lucide-react';

interface EmptyPausedItemCardProps {
  onClick?: () => void;
  showImages?: boolean;
}

const EmptyPausedItemCard = ({ onClick, showImages = true }: EmptyPausedItemCardProps) => {
  return (
    <div 
      className="group relative bg-card/20 backdrop-blur-sm border border-dashed border-border/50 rounded-xl shadow-sm hover:shadow-lg hover:bg-card/30 transition-all duration-300 overflow-hidden cursor-pointer"
      onClick={onClick}
    >
      {/* Progress bar at top when images are hidden - empty for consistency */}
      {!showImages && (
        <div className="h-2 bg-muted/20 relative">
          <div className="h-full bg-muted/40 rounded-full" style={{ width: '0%' }} />
        </div>
      )}

      {/* Image area */}
      {showImages && (
        <div className="relative aspect-[4/3] bg-muted/20 border-b border-border/30 flex items-center justify-center">
          <div className="text-center">
            <Package className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
            <div className="text-xs text-muted-foreground/70">Add your first item</div>
          </div>
        </div>
      )}

      {/* Content area */}
      <div className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-muted-foreground/70 text-sm truncate italic">
              Start by pausing something you're considering
            </h3>
          </div>
          
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground/50 italic">
              Give yourself space to make thoughtful decisions
            </div>
          </div>
        </div>

        {/* Check-in info */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground/50 italic">Ready when you are</span>
          <div className="flex items-center gap-1 text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            <Plus className="w-3 h-3" />
            <span className="italic">Add item</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyPausedItemCard;