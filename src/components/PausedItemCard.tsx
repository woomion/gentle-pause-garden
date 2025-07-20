
import { useState, useMemo } from 'react';
import { ExternalLink, MessageCircle, Calendar, User } from 'lucide-react';
import { formatPrice } from '../utils/priceFormatter';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
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
  const [showAlert, setShowAlert] = useState(false);
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
      setShowAlert(true);
    }
  };

  const handleConfirmLink = () => {
    handleViewItem(item);
    setShowAlert(false);
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

      {/* Product image */}
      <div className="relative">
        <ItemImage item={item} />
        {/* Pause Duration Banner - touching bottom of image */}
        <PauseDurationBanner checkInTime={item.checkInTime} />
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title and Price */}
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-foreground text-base leading-tight pr-2">
            {item.itemName}
          </h3>
          {formattedPrice && (
            <span className="text-sm font-medium text-foreground whitespace-nowrap">
              {formattedPrice}
            </span>
          )}
        </div>

        {/* Store name and emotion */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{item.storeName}</p>
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

        {/* Partners sharing info */}
        {sharedWithPartners.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User size={12} />
              <span>Shared with</span>
            </div>
            <div className="flex items-center gap-1">
              {sharedWithPartners.slice(0, 3).map((partner) => (
                <Avatar key={partner.partner_id} className="h-5 w-5">
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {getInitials(partner.partner_name)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {sharedWithPartners.length > 3 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{sharedWithPartners.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {item.link && (
          <div className="flex justify-end pt-2">
            <button
              onClick={handleLinkClick}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted/50 rounded"
              title={item.isCart ? "View cart" : "View item"}
            >
              <ExternalLink size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Link confirmation dialog */}
      <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
        <AlertDialogContent className="bg-card border-border rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">
              {item.isCart ? "View cart?" : "View item?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will open the {item.isCart ? "cart" : "item"} in a new tab. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl bg-card border-border text-foreground hover:bg-muted">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmLink}
              className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {item.isCart ? "View cart" : "View item"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PausedItemCard;
