
import { useState, useEffect } from 'react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem, pausedItemsStore } from '../stores/pausedItemsStore';
import { useItemNavigation } from '../hooks/useItemNavigation';
import { useItemActions } from '../hooks/useItemActions';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import ItemReviewDetails from './ItemReviewDetails';
import ItemReviewDecisionButtons from './ItemReviewDecisionButtons';
import ItemReviewFeedbackForm from './ItemReviewFeedbackForm';
import ExtendPauseModal from './ExtendPauseModal';
import { ItemCommentsThread } from './ItemCommentsThread';
import { useAuth } from '@/contexts/AuthContext';

import { toast } from '@/hooks/use-toast';

interface ItemReviewContentProps {
  item: PausedItem | LocalPausedItem;
  onItemDecided: (id: string) => void;
  onNavigateNext: () => void;
  onClose: () => void;
  isLastItem: boolean;
  showFeedback: boolean;
  setShowFeedback: (show: boolean) => void;
  showDecisionButtons?: boolean;
}

const ItemReviewContent = ({
  item,
  onItemDecided,
  onNavigateNext,
  onClose,
  isLastItem,
  showFeedback,
  setShowFeedback,
  showDecisionButtons = true
}: ItemReviewContentProps) => {
  const [selectedDecision, setSelectedDecision] = useState<'purchase' | 'let-go' | null>(null);
  const [notes, setNotes] = useState('');
  const [showExtendModal, setShowExtendModal] = useState(false);

  const { user } = useAuth();
  
  const { handleViewItem } = useItemNavigation();
  const { handleBought, handleLetGo } = useItemActions();

  
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

    console.log('🔍 ItemReviewContent: Submitting decision with reflection notes:', {
      selectedDecision,
      reflectionNotes: notes,
      itemName: item.itemName
    });

    try {
      if (selectedDecision === 'purchase') {
        await handleBought(item, onItemDecided, () => {}, notes);
      } else {
        await handleLetGo(item, onItemDecided, () => {}, notes);
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

  const handleExtendPause = async (duration: string) => {
    try {
      if (user) {
        await supabasePausedItemsStore.extendPause(item.id, duration);
      } else {
        // For guest users, use local store
        pausedItemsStore.extendPause(item.id, duration);
      }
      
      toast({
        title: "Pause extended",
        description: "Your item will be ready for review later.",
      });
      
      // Don't call onItemDecided for extended items - they should remain in the store
      // and appear in "my pauses". The extendPause method updates the review date,
      // so the item will naturally not appear in the review queue anymore.
      
      if (isLastItem) {
        onClose();
      } else {
        onNavigateNext();
      }
    } catch (error) {
      console.error('Error extending pause:', error);
      toast({
        title: "Error",
        description: "Failed to extend pause. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      {!showFeedback ? (
        <>
          <ItemReviewDetails item={item} onViewItem={handleViewItem} />
          
          
          {/* Decision buttons - only show when allowed */}
          {showDecisionButtons && (
            <div className="mt-8">
              <ItemReviewDecisionButtons 
                onDecision={handleDecision} 
                onExtendPause={() => setShowExtendModal(true)}
              />
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

      <ExtendPauseModal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        onExtend={handleExtendPause}
        itemName={'itemName' in item ? item.itemName : (item as any).title || 'item'}
      />
    </div>
  );
};

export { ItemReviewContent };
export type { ItemReviewContentProps };
