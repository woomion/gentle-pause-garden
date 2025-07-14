
interface ItemReviewFeedbackFormProps {
  selectedDecision: 'purchase' | 'let-go';
  notes: string;
  setNotes: (notes: string) => void;
  onSubmit: () => void;
  isLastItem: boolean;
}

const ItemReviewFeedbackForm = ({
  selectedDecision,
  notes,
  setNotes,
  onSubmit,
  isLastItem
}: ItemReviewFeedbackFormProps) => {
  return (
    <>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-black dark:text-[#F9F5EB] mb-4">
          {selectedDecision === 'purchase' ? 'Great choice!' : 'Good for you!'}
        </h3>
        <p className="text-black dark:text-[#F9F5EB] text-sm mb-4">
          {selectedDecision === 'purchase' 
            ? 'Any thoughts about this purchase?'
            : 'What helped you decide to let this go?'
          }
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional reflection..."
          className="w-full p-3 border border-lavender/30 dark:border-gray-600 rounded-xl bg-white/60 dark:bg-white/10 text-black dark:text-[#F9F5EB] placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#CAB6F7]"
          rows={2}
        />
      </div>

      <button
        onClick={onSubmit}
        className="w-full py-3 px-4 bg-[#CAB6F7] hover:bg-[#B5A0F2] text-black font-medium rounded-xl transition-colors"
      >
        {isLastItem ? 'Finish' : 'Continue'}
      </button>
    </>
  );
};

export default ItemReviewFeedbackForm;
