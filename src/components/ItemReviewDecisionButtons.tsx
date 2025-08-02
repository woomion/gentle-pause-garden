
import ExtendPauseCTA from './ExtendPauseCTA';

interface ItemReviewDecisionButtonsProps {
  onDecision: (decision: 'purchase' | 'let-go') => void;
  onExtendPause?: () => void;
}

const ItemReviewDecisionButtons = ({ onDecision, onExtendPause }: ItemReviewDecisionButtonsProps) => {
  return (
    <div className="space-y-3 mt-6">
      <button
        onClick={() => onDecision('purchase')}
        className="w-full py-3 px-4 bg-decision-buy hover:bg-decision-buy/90 text-decision-buy-foreground font-medium rounded-xl transition-colors"
      >
        I'm going to buy this
      </button>
      <button
        onClick={() => onDecision('let-go')}
        className="w-full py-3 px-4 bg-decision-let-go hover:bg-decision-let-go/90 text-decision-let-go-foreground font-medium rounded-xl transition-colors"
      >
        I'm ready to let this go
      </button>
      
      {onExtendPause && (
        <ExtendPauseCTA onExtend={onExtendPause} />
      )}
    </div>
  );
};

export default ItemReviewDecisionButtons;
