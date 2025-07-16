
import { useState } from 'react';

interface ItemReviewFeedbackFormProps {
  selectedDecision: 'purchase' | 'let-go';
  notes: string;
  setNotes: (notes: string) => void;
  onSubmit: () => void;
  isLastItem: boolean;
}

const supportivePhrases = [
  "You've made a conscious choice.",
  "You've paused with presence.",
  "Decision made. Onward.",
  "Clarity is powerful."
];

const ItemReviewFeedbackForm = ({
  selectedDecision,
  notes,
  setNotes,
  onSubmit,
  isLastItem
}: ItemReviewFeedbackFormProps) => {
  const [randomPhrase] = useState(() => 
    supportivePhrases[Math.floor(Math.random() * supportivePhrases.length)]
  );

  return (
    <>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-black dark:text-foreground mb-2">
          {randomPhrase}
        </h3>
        <p className="text-black dark:text-foreground text-sm mb-3">
          {selectedDecision === 'purchase' 
            ? 'Any thoughts about this purchase?'
            : 'What helped you decide to let this go?'
          }
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional reflection..."
          className="w-full p-3 border border-lavender/30 dark:border-gray-600 rounded-xl bg-white/60 dark:bg-muted text-black dark:text-foreground placeholder:text-muted-foreground dark:placeholder:text-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-primary"
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
