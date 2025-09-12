import { ShoppingBag, Heart, Clock } from 'lucide-react';

interface EmptyStateCardProps {
  mode: 'desktop' | 'pill';
  showImages?: boolean;
}

const EmptyStateCard = ({ mode, showImages = true }: EmptyStateCardProps) => {
  if (mode === 'pill') {
    return (
      <div className="relative w-full rounded-full overflow-hidden border border-dashed border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10 px-4 py-3 text-left">
        {/* Subtle animated background */}
        <div 
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/10 to-transparent opacity-50"
          style={{ width: '30%' }}
          aria-hidden
        />

        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary/60" />
            <span className="truncate font-medium text-muted-foreground">
              Ready to pause your first item? Paste a link above! ✨
            </span>
          </div>
          <span className="shrink-0 text-xs text-primary/60">Start here</span>
        </div>
      </div>
    );
  }

  // Desktop mode - match exact DesktopItemCard structure and dimensions
  return (
    <div className="group relative bg-card/40 backdrop-blur-sm border border-dashed border-border/40 rounded-xl shadow-sm hover:shadow-md hover:bg-card/30 transition-all duration-300 overflow-hidden">
      {/* Progress bar at top when images are hidden - matches DesktopItemCard */}
      {!showImages && (
        <div className="h-2 bg-muted/30 relative">
          <div
            className="h-full transition-all duration-300 bg-gradient-to-r from-primary/20 to-primary/10"
            style={{ width: '0%' }}
          />
        </div>
      )}

      {/* Card content */}
      <div className="cursor-pointer">
        {/* Main image area - only show when showImages is true, matches exact aspect ratio */}
        {showImages && (
          <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-muted/20 to-muted/30 overflow-hidden flex items-center justify-center">
            <div className="text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-primary/60" />
              </div>
              <div className="text-sm text-muted-foreground font-medium">
                Your first pause awaits
              </div>
            </div>
            
            {/* Progress bar at bottom of image area - matches DesktopItemCard */}
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-muted/30">
              <div
                className="h-full transition-all duration-300 bg-gradient-to-r from-primary/20 to-primary/10"
                style={{ width: '0%' }}
              />
            </div>
          </div>
        )}

        {/* Item details - matches exact DesktopItemCard structure and padding */}
        <div className="p-4 relative">
          <div className="mb-2">
            <h3 className="font-semibold text-lg text-foreground mb-1 line-clamp-1 flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary/60 flex-shrink-0" />
              Welcome to Pocket Pause!
            </h3>
            <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
              Take control of impulse purchases
            </p>
          </div>

          <div className="space-y-2 mb-3">
            <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-2">
              Paste any shopping link above to pause your impulse purchases. Give yourself time to think it over before buying.
            </p>

            <div className="flex items-center gap-2 text-xs text-primary/60">
              <Clock className="h-3 w-3" />
              <span>Ready when you are</span>
            </div>
          </div>

          {/* Bottom area - matches DesktopItemCard structure */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground/60">
              Start above ✨
            </div>
            <div className="text-xs text-primary/60 font-medium">
              Get started
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateCard;