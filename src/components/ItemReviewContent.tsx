
import { useState } from 'react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useItemNavigation } from '../hooks/useItemNavigation';
import { useItemActions } from '../hooks/useItemActions';
import ItemReviewDetails from './ItemReviewDetails';
import ItemReviewDecisionButtons from './ItemReviewDecisionButtons';
import ItemReviewFeedbackForm from './ItemReviewFeedbackForm';

interface ItemReviewContentProps {
  item: PausedItem | LocalPausedItem;
  onItemDecided: (id: string) => void;
  onNavigateNext: () => void;
  onClose: () => void;
  isLastItem: boolean;
}

const ItemReviewContent = ({
  item,
  onItemDecided,
  onNavigateNext,
  onClose,
  isLastItem
}: ItemReviewContentProps) => {
  const [selectedDecision, setSelectedDecision] = useState<'purchase' | 'let-go' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [notes, setNotes] = useState('');

  const { handleViewItem } = useItemNavigation();
  const { handleBought, handleLetGo } = useItemActions();

  const handleDecision = async (decision: 'purchase' | 'let-go') => {
    setSelectedDecision(decision);
    setShowFeedback(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedDecision) return;

    try {
      if (selectedDecision === 'purchase') {
        await handleBought(item, onItemDecided, () => {});
      } else {
        await handleLetGo(item, onItemDecided, () => {});
      }

      // Don't call onItemDecided again - it's already called by handleBought/handleLetGo
      if (isLastItem) {
        onClose();
      } else {
        setSelectedDecision(null);
        setShowFeedback(false);
        setNotes('');
        onNavigateNext();
      }
    } catch (error) {
      console.error('Error submitting decision:', error);
    }
  };

  const resetState = () => {
    setSelectedDecision(null);
    setShowFeedback(false);
    setNotes('');
  };

  return (
    <div className="p-6">
      {!showFeedback ? (
        <>
          <ItemReviewDetails item={item} onViewItem={handleViewItem} />
          <ItemReviewDecisionButtons onDecision={handleDecision} />
        </>
      ) : (
        <ItemReviewFeedbackForm
          selectedDecision={selectedDecision!}
          notes={notes}
          setNotes={setNotes}
          onSubmit={handleSubmitDecision}
          isLastItem={isLastItem}
        />
      )}
    </div>
  );
};

export { ItemReviewContent };
export type { ItemReviewContentProps };
