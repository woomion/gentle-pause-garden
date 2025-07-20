
import { useMemo } from 'react';
import { ExternalLink, User } from 'lucide-react';
import { formatPrice } from '../utils/priceFormatter';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useItemActions } from '../hooks/useItemActions';
import ItemImage from './ItemImage';
import PauseDurationBanner from './PauseDurationBanner';
import EmotionBadge from './EmotionBadge';
import { extractActualNotes } from '../utils/notesMetadataUtils';
import { useItemComments } from '../hooks/useItemComments';
import { CommentActivityIndicator } from './CommentActivityIndicator';

interface Partner {
  partner_id: string;
  partner_email: string;
  partner_name: string;
}

interface PausedItemCardProps {
  item: PausedItem;
  onClick: () => void;
  partners?: Partner[];
  currentUserId?: string;
}

const PausedItemCard = ({ item, onClick, partners = [], currentUserId }: PausedItemCardProps) => {
  const { handleViewItem } = useItemActions();
  const { getCommentCount, getUnreadCount, hasNewComments } = useItemComments(currentUserId);

  const formattedPrice = useMemo(() => formatPrice(item.price), [item.price]);
  const cleanNotes = useMemo(() => extractActualNotes(item.notes), [item.notes]);

  // Get initials for shared partners
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Get partner info for the badges
  const sharedWithPartners = useMemo(() => {
    if (!item.sharedWithPartners || item.sharedWithPartners.length === 0) return [];
    
    return partners.filter(partner => 
      item.sharedWithPartners.includes(partner.partner_id)
    );
  }, [item.sharedWithPartners, partners]);

  // Get sharing attribution text with direction
  const getAttributionText = useMemo(() => {
    if (!currentUserId || !item.originalUserId) {
      return null;
    }

    const isSharedByCurrentUser = item.originalUserId === currentUserId;
    
    if (isSharedByCurrentUser) {
      if (sharedWithPartners.length > 0) {
        if (sharedWithPartners.length === 1) {
          return `You → ${sharedWithPartners[0].partner_name}`;
        } else {
          return `You → ${sharedWithPartners.length} partners`;
        }
      } else if (item.sharedWithPartners && item.sharedWithPartners.length > 0) {
        return `You → ${item.sharedWithPartners.length} partner${item.sharedWithPartners.length > 1 ? 's' : ''}`;
      }
    } else {
      const sharer = partners.find(p => p.partner_id === item.originalUserId);
      if (sharer) {
        return `${sharer.partner_name} → You`;
      } else {
        return `Partner → You`;
      }
    }
    
    return null;
  }, [currentUserId, item.originalUserId, sharedWithPartners, partners]);

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
  const showComments = (sharedWithPartners.length > 0 || (item.sharedWithPartners && item.sharedWithPartners.length > 0)) && currentUserId;

  return (
    <div 
      className={`relative overflow-hidden bg-card rounded-lg border border-border cursor-pointer hover:bg-muted/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 animate-fade-in ${
        hasActivity ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Attribution pill in top right corner */}
      {getAttributionText && (
        <div className="absolute top-2 right-2 z-10 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs px-2 py-1 rounded-full shadow-sm">
          <span>{getAttributionText}</span>
        </div>
      )}

      {/* Main content container - horizontal layout on mobile, vertical on desktop */}
      <div className="flex md:flex-col pb-12">
        {/* Product image - left side on mobile, full width on desktop */}
        <div className="relative md:w-full w-32 flex-shrink-0 md:p-0 p-3 pr-0">
          <div className="relative">
            <ItemImage item={item} />
          </div>
          
          {/* View item button directly under image */}
          {item.link && (
            <div className="mt-2 flex justify-start">
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

        {/* Content - right side on mobile, below image on desktop */}
        <div className="p-4 md:pt-0 space-y-3 flex-1">
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

          {/* Store name */}
          <div>
            <p className="text-sm text-muted-foreground">{item.storeName}</p>
          </div>

          {/* Emotion badge under store name, aligned left */}
          <div className="flex items-start">
            <EmotionBadge emotion={item.emotion} />
          </div>

          {/* Only show notes if they exist and aren't empty after cleaning */}
          {cleanNotes && cleanNotes.trim() && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              <span className="font-medium">Note:</span> {cleanNotes}
            </div>
          )}

          {/* Comment activity indicator for shared items */}
          {showComments && commentCount > 0 && (
            <div className="pt-2 border-t border-border">
              <CommentActivityIndicator
                commentCount={commentCount}
                unreadCount={unreadCount}
                hasNewActivity={hasActivity}
                className="text-sm"
              />
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
