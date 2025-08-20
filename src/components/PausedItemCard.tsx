import { useMemo, useState, useCallback } from 'react';
import { ExternalLink } from 'lucide-react';
import { formatPrice } from '../utils/priceFormatter';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useItemActions } from '../hooks/useItemActions';
import ItemImage from './ItemImage';
import ItemReviewDecisionButtons from './ItemReviewDecisionButtons';

import { extractActualNotes } from '../utils/notesMetadataUtils';
import { useItemComments } from '../hooks/useItemComments';
import { CommentActivityIndicator } from './CommentActivityIndicator';

interface PausedItemCardProps {
  item: PausedItem | LocalPausedItem;
  onClick: (item: PausedItem | LocalPausedItem) => void;
  onDelete?: (id: string) => void;
  onDecideNow?: (item: PausedItem | LocalPausedItem) => void;
  currentUserId?: string;
}

const PausedItemCard = ({ item, onClick, onDelete, onDecideNow, currentUserId }: PausedItemCardProps) => {
  const { handleViewItem, handleBought, handleLetGo } = useItemActions();
  const { getCommentCount, getUnreadCount, hasNewComments } = useItemComments(currentUserId);
  const [showDecisionButtons, setShowDecisionButtons] = useState(false);

  const formattedPrice = useMemo(() => formatPrice(item.price), [item.price]);
  const cleanNotes = useMemo(() => extractActualNotes(item.notes), [item.notes]);

  // Check if item is ready for review
  const isReadyForReview = useMemo(() => {
    const now = new Date();
    return new Date(item.checkInDate) <= now;
  }, [item.checkInDate]);

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.link) {
      handleViewItem(item);
    }
  };

  const handleDecideClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('🔵 Decide now button clicked for item:', item.itemName);
    
    if (onDecideNow) {
      console.log('🔵 Calling onDecideNow handler');
      onDecideNow(item);
    } else {
      console.log('🔵 No onDecideNow handler, using fallback to show decision buttons');
      setShowDecisionButtons(prev => !prev);
    }
  }, [item, onDecideNow]);

  // Reset decision buttons when item changes
  const [previousItemId, setPreviousItemId] = useState(item.id);
  if (previousItemId !== item.id) {
    setShowDecisionButtons(false);
    setPreviousItemId(item.id);
  }

  const handleDecision = useCallback(async (e: React.MouseEvent, decision: 'purchase' | 'let-go') => {
    e.stopPropagation();
    console.log('🔵 DEBUG: handleDecision called with:', decision, 'for item:', item.itemName);
    try {
      if (decision === 'purchase') {
        console.log('🔵 DEBUG: Calling handleBought for item:', item.itemName, 'link:', item.link);
        await handleBought(item, onDelete || (() => {}), () => {});
      } else {
        console.log('🔵 DEBUG: Calling handleLetGo for item:', item.itemName);
        await handleLetGo(item, onDelete || (() => {}), () => {});
      }
      setShowDecisionButtons(false);
      console.log('🔵 DEBUG: Decision completed successfully');
    } catch (error) {
      console.error('❌ Error handling decision:', error);
    }
  }, [item, handleBought, handleLetGo]);

  // Get comment info for this item
  const commentCount = currentUserId ? getCommentCount(item.id) : 0;
  const unreadCount = currentUserId ? getUnreadCount(item.id) : 0;
  const hasActivity = currentUserId ? hasNewComments(item.id) : false;

  // Show comments section for shared items
  const showComments = false;

  return (
    <div 
      className={`relative overflow-hidden bg-card rounded-lg border border-border cursor-pointer hover:bg-muted/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 animate-fade-in ${
        hasActivity ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
      }`}
      onClick={() => onClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(item);
        }
      }}
    >
      {/* Main content container - horizontal layout on mobile, vertical on desktop */}
      <div className="flex md:flex-col pb-12">
        {/* Product image - left side on mobile, full width on desktop */}
        <div className="relative md:w-full w-32 flex-shrink-0 md:p-0 p-3 pr-0">
          <div className="relative">
            <ItemImage item={item} />
          </div>
        </div>

        {/* Content - right side on mobile, below image on desktop */}
        <div className="p-4 md:pt-0 flex-1 flex flex-col">
          <div className="space-y-3 flex-1">
            {/* Title and Price */}
            <div className="flex justify-between items-start gap-2">
              <h3 className="font-medium text-foreground text-base leading-tight flex-1 min-w-0">
                {item.itemName}
              </h3>
              {formattedPrice && (
                <span className="text-sm font-medium text-foreground whitespace-nowrap flex-shrink-0">
                  {formattedPrice}
                </span>
              )}
            </div>

            {/* Store name (optional) */}
            {item.storeName && item.storeName.trim() && item.storeName !== 'Unknown Store' && (
              <div>
                <p className="text-sm text-muted-foreground">{item.storeName}</p>
              </div>
            )}
          </div>

          {/* View item button aligned to bottom of image */}
          {item.link && (
            <div className="flex justify-start mt-auto">
              <button
                onClick={handleLinkClick}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-lg"
                title={item.isCart ? "View cart" : "View item"}
              >
                <ExternalLink size={14} />
                <span className="text-sm">View item</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Decision area at bottom of card */}
      <div className="absolute bottom-0 left-0 right-0">
        {isReadyForReview ? (
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border-t border-indigo-200 dark:border-indigo-800">
            {!showDecisionButtons ? (
              <button
                onClick={(e) => {
                  console.log('🚨 BUTTON CLICKED!', item.itemName);
                  handleDecideClick(e);
                }}
                className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                {item.link ? 'Decide now' : 'Make a decision'}
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={(e) => handleDecision(e, 'purchase')}
                  className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  {item.link ? "I'm going to buy this" : "I'm interested in this"}
                </button>
                <button
                  onClick={(e) => handleDecision(e, 'let-go')}
                  className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  {item.link ? "I'm ready to let this go" : "I'm done thinking about this"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-purple-50 dark:bg-purple-950/50 border-t border-purple-200 dark:border-purple-800">
            <p className="text-sm text-purple-700 dark:text-purple-300 text-center">
              {item.checkInTime}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PausedItemCard;