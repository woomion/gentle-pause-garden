import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Crown, Sparkles } from 'lucide-react';

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignUp: () => void;
  freeItemsUsed: number;
  maxFreeItems: number;
}

const UsageLimitModal = ({ isOpen, onClose, onSignUp, freeItemsUsed, maxFreeItems }: UsageLimitModalProps) => {
  const isAtLimit = freeItemsUsed >= maxFreeItems;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isAtLimit ? 'Upgrade to Continue' : 'Almost at your limit!'}
          </DialogTitle>
          <DialogDescription>
            {isAtLimit 
              ? `You've used all ${maxFreeItems} of your free pauses. Choose a plan to continue:`
              : `You've used ${freeItemsUsed} of ${maxFreeItems} free pauses. Choose a plan to unlock unlimited pausing:`
            }
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
            <p className="text-sm text-muted-foreground mb-3">Perfect for seasonal shopping</p>
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
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="font-semibold">Annual</span>
              </div>
              <Badge variant="secondary">20 pauses/year</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Best value for regular pausers</p>
            <Button className="w-full" variant="default" onClick={onSignUp}>
              Choose Annual
            </Button>
          </div>

          <div className="text-center">
            <button 
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue browsing for now
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UsageLimitModal;