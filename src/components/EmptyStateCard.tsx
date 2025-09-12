import { ShoppingBag, Heart, Clock } from 'lucide-react';

interface EmptyStateCardProps {
  mode: 'desktop' | 'pill';
}

const EmptyStateCard = ({ mode }: EmptyStateCardProps) => {
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

  // Desktop mode
  return (
    <div className="group relative bg-card/20 backdrop-blur-sm border border-dashed border-border/40 rounded-xl shadow-sm hover:shadow-md hover:bg-card/30 transition-all duration-300 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      
      {/* Card content */}
      <div className="relative">
        {/* Empty state image area */}
        <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-muted/20 to-muted/30 overflow-hidden flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-8 w-8 text-primary/60" />
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              Your first pause awaits
            </div>
          </div>
        </div>

        {/* Content area matching real cards */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-primary/60 flex-shrink-0" />
                <h3 className="font-medium text-lg text-muted-foreground truncate">
                  Welcome to Pocket Pause!
                </h3>
              </div>
              
              <p className="text-sm text-muted-foreground/80 leading-relaxed">
                Paste any shopping link above to pause your impulse purchases. Give yourself time to think it over before buying.
              </p>

              <div className="flex items-center gap-2 text-xs text-primary/60">
                <Clock className="h-3 w-3" />
                <span>Take control of your spending habits</span>
              </div>
            </div>
          </div>

          {/* Bottom area matching real cards */}
          <div className="pt-2 border-t border-border/20">
            <div className="flex items-center justify-between text-xs text-muted-foreground/60">
              <span>Ready when you are</span>
              <span className="text-primary/60">✨ Start above</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyStateCard;