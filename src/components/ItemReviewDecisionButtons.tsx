
interface ItemReviewDecisionButtonsProps {
  onDecision: (decision: 'purchase' | 'let-go') => void;
}

const ItemReviewDecisionButtons = ({ onDecision }: ItemReviewDecisionButtonsProps) => {
  return (
    <div className="space-y-3">
      <button
        onClick={() => onDecision('purchase')}
        className="w-full py-3 px-4 bg-[#CAB6F7] hover:bg-[#B5A0F2] text-black font-medium rounded-xl transition-colors"
      >
        I want to buy this
      </button>
      <button
        onClick={() => onDecision('let-go')}
        className="w-full py-3 px-4 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-black dark:text-[#F9F5EB] font-medium rounded-xl border border-lavender/30 dark:border-gray-600 transition-colors"
      >
        I'm ready to let this go
      </button>
    </div>
  );
};

export default ItemReviewDecisionButtons;
