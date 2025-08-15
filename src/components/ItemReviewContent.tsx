
import { useState, useEffect } from 'react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem, pausedItemsStore } from '../stores/pausedItemsStore';
import { useItemNavigation } from '../hooks/useItemNavigation';
import { useItemActions } from '../hooks/useItemActions';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import ItemReviewDetails from './ItemReviewDetails';
import ItemReviewDecisionButtons from './ItemReviewDecisionButtons';
import ItemReviewFeedbackForm from './ItemReviewFeedbackForm';

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
  externalSelectedDecision?: 'purchase' | 'let-go' | null;
  userValues?: string[];
}

const ItemReviewContent = ({
  item,
  onItemDecided,
  onNavigateNext,
  onClose,
  isLastItem,
  showFeedback,
  setShowFeedback,
  showDecisionButtons = true,
  externalSelectedDecision,
  userValues = []
}: ItemReviewContentProps) => {
  const [selectedDecision, setSelectedDecision] = useState<'purchase' | 'let-go' | null>(null);
  const [notes, setNotes] = useState('');
  

  const { user } = useAuth();
  
  const { handleViewItem } = useItemNavigation();
  const { handleBought, handleLetGo } = useItemActions();

  
  // Check if current user is the owner of the item (not just a partner viewing it)
  const isItemOwner = user?.id && (
    ('originalUserId' in item && item.originalUserId === user.id) ||
    ('userId' in item && item.userId === user.id)
  );

  const handleDecisionDirect = async (decision: 'purchase' | 'let-go') => {
    console.log('🎯 ItemReviewContent: handleDecisionDirect called with:', decision, 'for item:', item.id);
    try {
      if (decision === 'purchase') {
        console.log('🎯 ItemReviewContent: Calling handleBought');
        await handleBought(item, onItemDecided, () => {});
      } else {
        console.log('🎯 ItemReviewContent: Calling handleLetGo');
        await handleLetGo(item, onItemDecided, () => {});
      }

      console.log('🎯 ItemReviewContent: Decision processing complete, isLastItem:', isLastItem);
      if (isLastItem) {
        console.log('🎯 ItemReviewContent: Closing modal (last item)');
        onClose();
      } else {
        console.log('🎯 ItemReviewContent: Navigating to next item');
        onNavigateNext();
      }
    } catch (error) {
      console.error('❌ ItemReviewContent: Error submitting decision:', error);
    }
  };

  const resetState = () => {
    setSelectedDecision(null);
    setShowFeedback(false);
    setNotes('');
  };


  return (
    <div className="p-6">
      <ItemReviewDetails item={item} onViewItem={handleViewItem} />
      
      {/* Decision buttons - only show when allowed */}
      {showDecisionButtons && (
        <div className="mt-8">
          <ItemReviewDecisionButtons 
            onDecision={handleDecisionDirect} 
            hasUrl={!!(item.link || (item as any).url)}
          />
        </div>
      )}

    </div>
  );
};

export { ItemReviewContent };
export type { ItemReviewContentProps };
