
import { ExternalLink, ArrowLeft } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMemo, useEffect, useState, useRef } from 'react';
import { formatPrice } from '../utils/priceFormatter';
import { useItemActions } from '../hooks/useItemActions';
import ItemImage from './ItemImage';
import PauseDurationBanner from './PauseDurationBanner';
import EmotionBadge from './EmotionBadge';
import { extractActualNotes } from '../utils/notesMetadataUtils';
import { ItemCommentsThread } from './ItemCommentsThread';
import { useItemComments } from '../hooks/useItemComments';

interface Partner {
  partner_id: string;
  partner_email: string;
  partner_name: string;
}

interface PausedItemDetailProps {
  item: PausedItem;
  items?: PausedItem[];
  currentIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  partners?: Partner[];
  currentUserId?: string;
}

const PausedItemDetail = ({ item, items = [], currentIndex = 0, isOpen, onClose, onDelete, onNavigateNext, onNavigatePrevious, partners = [], currentUserId }: PausedItemDetailProps) => {
  const { handleViewItem, handleLetGo, handleBought } = useItemActions();
  const { markAsRead } = useItemComments(currentUserId);
  const [showDecisionButtons, setShowDecisionButtons] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<'purchase' | 'let-go' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [notes, setNotes] = useState('');
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  // Mark comments as read when opening the detail view
  useEffect(() => {
    if (isOpen && currentUserId) {
      markAsRead(item.id);
    }
  }, [isOpen, item.id, currentUserId, markAsRead]);

  // Add keyboard navigation
  useEffect(() => {
    if (!isOpen || items.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && onNavigatePrevious && currentIndex > 0) {
        e.preventDefault();
        onNavigatePrevious();
      } else if (e.key === 'ArrowRight' && onNavigateNext && currentIndex < items.length - 1) {
        e.preventDefault();
        onNavigateNext();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, items.length, currentIndex, onNavigateNext, onNavigatePrevious]);

  // Add touch/swipe navigation
  useEffect(() => {
    if (!isOpen || items.length <= 1) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      touchEndRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchEndRef.current = { x: touch.clientX, y: touch.clientY };
    };

    const handleTouchEnd = () => {
      if (!touchStartRef.current || !touchEndRef.current) return;

      const deltaX = touchEndRef.current.x - touchStartRef.current.x;
      const deltaY = touchEndRef.current.y - touchStartRef.current.y;
      const minSwipeDistance = 50;
      const maxVerticalMovement = 100;

      // Only trigger swipe if horizontal movement is greater than vertical movement
      if (Math.abs(deltaY) > maxVerticalMovement) return;

      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0 && onNavigatePrevious && currentIndex > 0) {
          // Swipe right - go to previous
          onNavigatePrevious();
        } else if (deltaX < 0 && onNavigateNext && currentIndex < items.length - 1) {
          // Swipe left - go to next
          onNavigateNext();
        }
      }

      touchStartRef.current = null;
      touchEndRef.current = null;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, items.length, currentIndex, onNavigateNext, onNavigatePrevious]);

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
    // Use currentUserId if available
    if (!currentUserId || !item.originalUserId) {
      return null;
    }

    const isSharedByCurrentUser = item.originalUserId === currentUserId;
    
    if (isSharedByCurrentUser) {
      // Current user shared this item - show who they shared it with
      if (sharedWithPartners.length > 0) {
        if (sharedWithPartners.length === 1) {
          return `You → ${sharedWithPartners[0].partner_name}`;
        } else {
          return `You → ${sharedWithPartners.length} partners`;
        }
      } else if (item.sharedWithPartners && item.sharedWithPartners.length > 0) {
        // Fallback: if partners data isn't loaded but we know it's shared
        return `You → ${item.sharedWithPartners.length} partner${item.sharedWithPartners.length > 1 ? 's' : ''}`;
      }
    } else {
      // Partner shared this with current user
      const sharer = partners.find(p => p.partner_id === item.originalUserId);
      if (sharer) {
        return `${sharer.partner_name} → You`;
      } else {
        // Fallback: if partner data isn't loaded but we know it's from a partner
        return `Partner → You`;
      }
    }
    
    return null;
  }, [currentUserId, item.originalUserId, sharedWithPartners, partners]);

  // Debug logging
  useEffect(() => {
    console.log('🔍 PausedItemDetail Debug:', {
      sharedWithPartnersLength: sharedWithPartners.length,
      currentUserId: currentUserId,
      itemSharedWith: item.sharedWithPartners,
      shouldShowComments: (sharedWithPartners.length > 0 || (item.sharedWithPartners && item.sharedWithPartners.length > 0)) && currentUserId,
      partners: partners.length,
      itemName: item.itemName,
      isSharedItem: item.sharedWithPartners && item.sharedWithPartners.length > 0,
      attributionText: getAttributionText
    });
  }, [sharedWithPartners, currentUserId, item.sharedWithPartners, partners, item.itemName, getAttributionText]);

  console.log('🔍 PausedItemDetail rendered:', {
    isOpen,
    itemName: item.itemName,
    hasNotes: !!item.notes,
    cleanNotes: cleanNotes,
    notesLength: item.notes?.length || 0,
    link: item.link,
    hasLink: !!item.link,
    windowWidth: typeof window !== 'undefined' ? window.innerWidth : 'undefined',
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 'undefined'
  });

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  const handleKeepPaused = () => {
    onClose();
  };

  const handleDecisionClick = () => {
    setShowDecisionButtons(true);
  };

  const handleDecision = async (decision: 'purchase' | 'let-go') => {
    setSelectedDecision(decision);
    setShowFeedback(true);
  };

  const handleSubmitDecision = async () => {
    if (!selectedDecision) return;

    try {
      if (selectedDecision === 'purchase') {
        await handleBought(item, onDelete, onClose);
      } else {
        await handleLetGo(item, onDelete, onClose);
      }
    } catch (error) {
      console.error('Error handling decision:', error);
    }
  };

  const handleBackToDecision = () => {
    setShowFeedback(false);
    setSelectedDecision(null);
    setNotes('');
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm w-[calc(100vw-2rem)] mx-auto p-6 rounded-3xl bg-card border-border max-h-[85vh] overflow-y-auto fixed"
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Item Details</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Product image */}
          <div className="relative">
            <ItemImage item={item} />
            {/* Attribution pill in top right corner */}
            {getAttributionText && (
              <div className="absolute top-2 right-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs px-3 py-1 rounded-full shadow-sm animate-fade-in">
                <span>{getAttributionText}</span>
              </div>
            )}
            {/* Pause Duration Banner - touching bottom of image */}
            <PauseDurationBanner checkInTime={item.checkInTime} />
          </div>

          {/* Item details */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-foreground leading-tight">{item.itemName}</h3>
              {formattedPrice && (
                <span className="text-xl font-bold text-foreground ml-2">{formattedPrice}</span>
              )}
            </div>
            
            <p className="text-muted-foreground text-base">{item.storeName}</p>
            
            <EmotionBadge emotion={item.emotion} />

            {/* Only show notes if they exist and aren't empty after cleaning */}
            {cleanNotes && cleanNotes.trim() && (
              <div className="pt-2">
                <p className="text-muted-foreground text-sm break-words">
                  <strong>Note:</strong> {cleanNotes}
                </p>
              </div>
            )}

            {/* Comments Thread for Shared Items */}
            {((sharedWithPartners.length > 0) || (item.sharedWithPartners && item.sharedWithPartners.length > 0)) && currentUserId && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <ItemCommentsThread 
                  itemId={item.id}
                  partners={partners}
                  currentUserId={currentUserId}
                />
              </div>
            )}
          </div>

          {/* Decision buttons - only show to item owner, not partners */}
          {currentUserId === item.originalUserId && (
            <>
              {!showDecisionButtons && !showFeedback ? (
                <div className="pt-2">
                  <button 
                    onClick={handleDecisionClick}
                    className="w-full py-3 px-4 bg-decide-now hover:bg-decide-now/90 text-decide-now-foreground font-medium rounded-xl transition-colors"
                  >
                    Decide now
                  </button>
                </div>
              ) : showDecisionButtons && !showFeedback ? (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleDecision('purchase')}
                    className="w-full py-3 px-4 bg-decision-buy hover:bg-decision-buy/90 text-decision-buy-foreground font-medium rounded-xl transition-colors"
                  >
                    I'm going to buy this
                  </button>
                  <button
                    onClick={() => handleDecision('let-go')}
                    className="w-full py-3 px-4 bg-decision-let-go hover:bg-decision-let-go/90 text-decision-let-go-foreground font-medium rounded-xl transition-colors"
                  >
                    I'm ready to let this go
                  </button>
                </div>
              ) : showFeedback && selectedDecision ? (
                <div className="pt-2">
                  {/* Back arrow */}
                  <button
                    onClick={handleBackToDecision}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
                  >
                    <ArrowLeft size={16} />
                    <span className="text-sm">Back to options</span>
                  </button>
                  
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {(() => {
                      const supportivePhrases = [
                        "You've made a conscious choice.",
                        "You've paused with presence.",
                        "Decision made. Onward.",
                        "Clarity is powerful."
                      ];
                      return supportivePhrases[Math.floor(Math.random() * supportivePhrases.length)];
                    })()}
                  </h3>
                  <p className="text-foreground text-sm mb-4">
                    {selectedDecision === 'purchase' 
                      ? 'Any thoughts about this purchase?'
                      : 'What helped you decide to let this go?'
                    }
                  </p>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional reflection..."
                    className="w-full p-3 border border-lavender/30 dark:border-gray-600 rounded-xl bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={2}
                  />
                  <button
                    onClick={handleSubmitDecision}
                    className="w-full mt-4 py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
                  >
                    Finish
                  </button>
                </div>
              ) : null}
            </>
          )}


          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-between">
            {item.link && item.link.trim() ? (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleViewItem(item);
                }}
                className="text-muted-foreground text-sm hover:text-foreground transition-colors duration-200 flex items-center gap-1 bg-transparent border-none cursor-pointer"
                type="button"
              >
                <ExternalLink size={14} />
                {item.isCart ? 'View cart' : 'View item'}
              </button>
            ) : (
              <div></div>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 text-sm">
                  Delete item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border-border rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    This will permanently delete "{item.itemName}" from your paused items. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl bg-card border-border text-foreground hover:bg-muted">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="rounded-2xl bg-red-500 hover:bg-red-600 text-white">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PausedItemDetail;
