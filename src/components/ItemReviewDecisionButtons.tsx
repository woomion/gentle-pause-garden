
import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface ItemReviewDecisionButtonsProps {
  onDecision: (decision: 'purchase' | 'let-go', shouldOpenLink?: boolean) => void;
  onTakeToLink?: () => void;
  hasUrl?: boolean;
}

const ItemReviewDecisionButtons = ({ onDecision, onTakeToLink, hasUrl = true }: ItemReviewDecisionButtonsProps) => {
  const [showConfirmation, setShowConfirmation] = useState<'purchase' | 'let-go' | null>(null);
  
  const handleInitialDecision = (decision: 'purchase' | 'let-go') => {
    console.log('🔵 Initial decision:', decision);
    setShowConfirmation(decision);
  };

  const handleConfirmedDecision = (action: 'take-to-link' | 'mark-purchased' | 'let-go') => {
    console.log('🔴 Confirmed decision:', action);
    
    if (action === 'take-to-link') {
      onDecision('purchase', true); // true = should open link
    } else if (action === 'mark-purchased') {
      onDecision('purchase', false); // false = should not open link
    } else if (action === 'let-go') {
      onDecision('let-go');
    }
  };

  const handleBackToDecisions = () => {
    setShowConfirmation(null);
  };

  if (!showConfirmation) {
    return (
      <div className="space-y-3 mt-6">
        {hasUrl ? (
          <>
            <button
              onClick={() => handleInitialDecision('purchase')}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
            >
              I'm going to buy this
            </button>
            <button
              onClick={() => handleInitialDecision('let-go')}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
            >
              I'm ready to let this go
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleInitialDecision('purchase')}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} />
              I'm interested in this
            </button>
            <button
              onClick={() => handleInitialDecision('let-go')}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <X size={18} />
              I'm done thinking about this
            </button>
          </>
        )}
      </div>
    );
  }

  if (showConfirmation === 'purchase') {
    return (
      <div className="space-y-3 mt-6">
        <div className="text-center text-sm text-muted-foreground mb-3">
          You're ready to buy this item:
        </div>
        {hasUrl && (
          <button
            onClick={() => handleConfirmedDecision('take-to-link')}
            className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
          >
            <div className="text-center">
              <div>Take me to the link</div>
              <div className="text-xs opacity-70">(and then mark as purchased)</div>
            </div>
          </button>
        )}
        <button
          onClick={() => handleConfirmedDecision('mark-purchased')}
          className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
        >
          Mark as purchased
        </button>
        <button
          onClick={handleBackToDecisions}
          className="w-full py-2 px-4 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Back to decisions
        </button>
      </div>
    );
  }

  if (showConfirmation === 'let-go') {
    return (
      <div className="space-y-3 mt-6">
        <div className="text-center text-sm text-muted-foreground mb-3">
          Are you sure you're ready to let this go?
        </div>
        <button
          onClick={() => handleConfirmedDecision('let-go')}
          className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
        >
          Yes, let it go
        </button>
        <button
          onClick={handleBackToDecisions}
          className="w-full py-2 px-4 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Back to decisions
        </button>
      </div>
    );
  }

  return null;
};

export default ItemReviewDecisionButtons;
