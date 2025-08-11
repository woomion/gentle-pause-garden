import { useMemo } from 'react';
import { ExternalLink } from 'lucide-react';
import { formatPrice } from '../utils/priceFormatter';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { useItemActions } from '../hooks/useItemActions';
import ItemImage from './ItemImage';
import PauseDurationBanner from './PauseDurationBanner';
import EmotionBadge from './EmotionBadge';
import { extractActualNotes } from '../utils/notesMetadataUtils';
import { useItemComments } from '../hooks/useItemComments';
import { CommentActivityIndicator } from './CommentActivityIndicator';

interface PausedItemCardProps {
  item: PausedItem | LocalPausedItem;
  onClick: (item: PausedItem | LocalPausedItem) => void;
  currentUserId?: string;
}

const PausedItemCard = ({ item, onClick, currentUserId }: PausedItemCardProps) => {
  const { handleViewItem } = useItemActions();
  const { getCommentCount, getUnreadCount, hasNewComments } = useItemComments(currentUserId);

  const formattedPrice = useMemo(() => formatPrice(item.price), [item.price]);
  const cleanNotes = useMemo(() => extractActualNotes(item.notes), [item.notes]);

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.link) {
      handleViewItem(item);
    }
  };

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
            {item.storeName && item.storeName.trim() && (
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
      
      {/* Pause Duration Banner - stretches across bottom of card */}
      <div className="absolute bottom-0 left-0 right-0">
        <PauseDurationBanner checkInTime={item.checkInTime} />
      </div>
    </div>
  );
};

export default PausedItemCard;