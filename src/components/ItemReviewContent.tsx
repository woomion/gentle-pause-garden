
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useItemNavigation } from '../hooks/useItemNavigation';
import { useItemActions } from '../hooks/useItemActions';
import ItemReviewDetails from './ItemReviewDetails';
import ItemReviewDecisionButtons from './ItemReviewDecisionButtons';

import { useAuth } from '@/contexts/AuthContext';
import { extractActualNotes } from '../utils/notesMetadataUtils';

interface ItemReviewContentProps {
  item: PausedItem | LocalPausedItem;
  onItemDecided: (id: string) => void;
  onNavigateNext: () => void;
  onClose: () => void;
  isLastItem: boolean;
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
  showDecisionButtons = true,
  externalSelectedDecision,
  userValues = []
}: ItemReviewContentProps) => {
  // Remove feedback-related state since reflection space is removed
  

  const { user } = useAuth();
  
  const { handleViewItem } = useItemNavigation();
  const { handleBought, handleLetGo } = useItemActions();

  
  // Check if current user is the owner of the item (not just a partner viewing it)
  const isItemOwner = user?.id && (
    ('originalUserId' in item && item.originalUserId === user.id) ||
    ('userId' in item && item.userId === user.id)
  );

  const handleDecisionDirect = async (decision: 'purchase' | 'let-go', shouldOpenLink: boolean = false) => {
    console.log('🎯 ItemReviewContent: handleDecisionDirect called with:', decision, 'for item:', item.id);
    try {
      if (decision === 'purchase') {
        console.log('🎯 ItemReviewContent: Calling handleBought, shouldOpenLink:', shouldOpenLink);
        await handleBought(item, onItemDecided, () => {}, undefined, shouldOpenLink);
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

  // Remove resetState function since no feedback state to reset


  const userNotes = extractActualNotes(item.notes);

  return (
    <div className="p-6">
      <ItemReviewDetails item={item} onViewItem={handleViewItem} />
      
      {/* Temporarily commented out user notes in review */}
      {/* {userNotes?.trim() && (
        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-sm font-medium text-foreground">Your thoughts:</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {userNotes}
          </p>
        </div>
      )} */}
      
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
