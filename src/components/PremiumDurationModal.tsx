import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Crown, Sparkles } from 'lucide-react';

interface PremiumDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
  selectedDuration: string;
}

const PremiumDurationModal = ({ isOpen, onClose, onSignUp, selectedDuration }: PremiumDurationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Extended Pause Times
          </DialogTitle>
          <DialogDescription>
            Upgrade to unlock longer pause durations like "{selectedDuration}" for better decision timing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Seasonal Plan */}
          <div className="border rounded-lg p-4 relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-amber-500" />
                <span className="font-semibold">Seasonal</span>
              </div>
              <Badge variant="secondary">6 pauses</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Perfect for seasonal shopping</p>
            <ul className="text-xs text-muted-foreground mb-3 space-y-1">
              <li>• Extended pause durations</li>
              <li>• Better decision timing</li>
            </ul>
            <Button className="w-full" onClick={onSignUp}>
              Choose Seasonal
            </Button>
          </div>

          {/* Annual Plan */}
          <div className="border rounded-lg p-4 relative bg-primary/5">
            <div className="absolute -top-2 left-4">
              <Badge className="bg-primary text-primary-foreground">Most Popular</Badge>
            </div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-semibold">Annual</span>
              </div>
              <Badge variant="secondary">20 pauses/year</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">Best value for regular pausers</p>
            <ul className="text-xs text-muted-foreground mb-3 space-y-1">
              <li>• All extended pause durations</li>
              <li>• More pauses per year</li>
              <li>• Priority support</li>
            </ul>
            <Button className="w-full" variant="default" onClick={onSignUp}>
              Choose Annual
            </Button>
          </div>

          <div className="text-center">
            <button 
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue with 1 day for now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PremiumDurationModal;