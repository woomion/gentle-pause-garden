
import { Check, X } from 'lucide-react';
import ExtendPauseCTA from './ExtendPauseCTA';

interface ItemReviewDecisionButtonsProps {
  onDecision: (decision: 'purchase' | 'let-go') => void;
  onExtendPause?: () => void;
  hasUrl?: boolean;
}

const ItemReviewDecisionButtons = ({ onDecision, onExtendPause, hasUrl = true }: ItemReviewDecisionButtonsProps) => {
  
  const handlePurchaseClick = () => {
    console.log('🔵 Purchase button clicked');
    onDecision('purchase');
  };

  const handleLetGoClick = () => {
    console.log('🔴 Let go button clicked');
    onDecision('let-go');
  };

  return (
    <div className="space-y-3 mt-6">
      {hasUrl ? (
        <>
          <button
            onClick={handlePurchaseClick}
            className="w-full py-3 px-4 bg-decision-buy hover:bg-decision-buy/90 text-decision-buy-foreground font-medium rounded-xl transition-colors"
          >
            I'm going to buy this
          </button>
          <button
            onClick={handleLetGoClick}
            className="w-full py-3 px-4 bg-decision-let-go hover:bg-decision-let-go/90 text-decision-let-go-foreground font-medium rounded-xl transition-colors"
          >
            I'm ready to let this go
          </button>
        </>
      ) : (
        <>
          <button
            onClick={handlePurchaseClick}
            className="w-full py-3 px-4 bg-decision-buy hover:bg-decision-buy/90 text-decision-buy-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Check size={18} />
            I'm interested in this
          </button>
          <button
            onClick={handleLetGoClick}
            className="w-full py-3 px-4 bg-decision-let-go hover:bg-decision-let-go/90 text-decision-let-go-foreground font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <X size={18} />
            I'm done thinking about this
          </button>
        </>
      )}
      
      {onExtendPause && (
        <ExtendPauseCTA onExtend={onExtendPause} />
      )}
    </div>
  );
};

export default ItemReviewDecisionButtons;
