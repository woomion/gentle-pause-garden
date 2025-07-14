
import { useState, useEffect } from 'react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useItemNavigation } from '../hooks/useItemNavigation';
import { useItemActions } from '../hooks/useItemActions';
import ItemReviewDetails from './ItemReviewDetails';
import ItemReviewDecisionButtons from './ItemReviewDecisionButtons';
import ItemReviewFeedbackForm from './ItemReviewFeedbackForm';
import { ItemCommentsThread } from './ItemCommentsThread';
import { useAuth } from '@/contexts/AuthContext';
import { usePausePartners } from '@/hooks/usePausePartners';

interface ItemReviewContentProps {
  item: PausedItem | LocalPausedItem;
  onItemDecided: (id: string) => void;
  onNavigateNext: () => void;
  onClose: () => void;
  isLastItem: boolean;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;
}

const ItemReviewContent = ({
  item,
  onItemDecided,
  onNavigateNext,
  onClose,
  isLastItem,
  showFeedback,
  setShowFeedback
}: ItemReviewContentProps) => {
  const [selectedDecision, setSelectedDecision] = useState<'purchase' | 'let-go' | null>(null);
  const [notes, setNotes] = useState('');

  const { user } = useAuth();
  const { partners } = usePausePartners();
  const { handleViewItem } = useItemNavigation();
  const { handleBought, handleLetGo } = useItemActions();

  // Check if item is shared
  const isSharedItem = 'sharedWithPartners' in item && item.sharedWithPartners && item.sharedWithPartners.length > 0;
  
  // Check if current user is the owner of the item (not just a partner viewing it)
  const isItemOwner = user?.id && (
    ('originalUserId' in item && item.originalUserId === user.id) ||
    ('userId' in item && item.userId === user.id)
  );

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
          
          {/* Comments Thread for Shared Items */}
          {isSharedItem && user?.id && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
              <ItemCommentsThread 
                itemId={item.id}
                partners={partners}
                currentUserId={user.id}
              />
            </div>
          )}
          
          {/* Add breathing room before decision buttons - only show to item owner */}
          {isItemOwner && (
            <div className="mt-8">
              <ItemReviewDecisionButtons onDecision={handleDecision} />
            </div>
          )}
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
