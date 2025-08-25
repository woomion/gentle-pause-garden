import { ExternalLink, ArrowLeft, Edit } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useMemo, useEffect, useState, useRef } from 'react';
import { formatPrice } from '../utils/priceFormatter';
import { useItemActions } from '../hooks/useItemActions';
import ItemImage from './ItemImage';
import ItemEditModal from './ItemEditModal';
import PauseDurationBanner from './PauseDurationBanner';

import { extractActualNotes } from '../utils/notesMetadataUtils';
import { ItemCommentsThread } from './ItemCommentsThread';
import { useItemComments } from '../hooks/useItemComments';

interface PausedItemDetailProps {
  item: PausedItem | LocalPausedItem;
  items?: (PausedItem | LocalPausedItem)[];
  currentIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onNavigateNext?: () => void;
  onNavigatePrevious?: () => void;
  onEdit?: (item: PausedItem | LocalPausedItem, updates: Partial<PausedItem | LocalPausedItem>) => void;
  currentUserId?: string;
}

const PausedItemDetail = ({ item, items = [], currentIndex = 0, isOpen, onClose, onDelete, onNavigateNext, onNavigatePrevious, onEdit, currentUserId }: PausedItemDetailProps) => {
  const { handleViewItem, handleLetGo, handleBought } = useItemActions();
  const { markAsRead } = useItemComments(currentUserId);
  const [showDecisionButtons, setShowDecisionButtons] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState<'purchase' | 'let-go' | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  // Check if item is ready for review
  const isReadyForReview = useMemo(() => {
    const now = new Date();
    return new Date(item.checkInDate) <= now;
  }, [item.checkInDate]);

  // Mark comments as read when opening the detail view and reset decision buttons only when item changes
  useEffect(() => {
    if (isOpen && currentUserId) {
      markAsRead(item.id);
    }
  }, [isOpen, currentUserId, markAsRead]);

  // Reset decision buttons only when item changes, not when modal opens
  useEffect(() => {
    setShowDecisionButtons(false);
    setShowConfirmation(null);
  }, [item.id]);

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

  const handleDelete = () => {
    onDelete(item.id);
    onClose();
  };

  const handleDecisionClick = () => {
    console.log('🚨 DECIDE NOW BUTTON CLICKED in PausedItemDetail!', item.itemName);
    console.log('🚨 Current showDecisionButtons state:', showDecisionButtons);
    setShowDecisionButtons(prev => {
      const newValue = !prev;
      console.log('🚨 Setting showDecisionButtons to:', newValue);
      return newValue;
    });
  };

  const handleInitialDecision = (decision: 'purchase' | 'let-go') => {
    setShowConfirmation(decision);
  };

  const handleConfirmedDecision = async (action: 'take-to-link' | 'mark-purchased' | 'let-go') => {
    try {
      if (action === 'take-to-link') {
        // Open link and mark as purchased
        await handleBought(item, onDelete, onClose);
      } else if (action === 'mark-purchased') {
        // Just mark as purchased without opening link
        await handleBought(item, onDelete, onClose);
      } else if (action === 'let-go') {
        await handleLetGo(item, onDelete, onClose);
      }
    } catch (error) {
      console.error('Error handling decision:', error);
    }
  };

  const handleBackToDecisions = () => {
    setShowConfirmation(null);
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
            {/* Pause Duration Banner - touching bottom of image */}
        <PauseDurationBanner 
          checkInTime={item.checkInTime} 
          pausedAt={typeof item.pausedAt === 'string' ? item.pausedAt : item.pausedAt.toISOString()}
          isReadyForReview={isReadyForReview}
        />
          </div>

          {/* Item details */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold text-foreground leading-tight flex-1 min-w-0 pr-2">{item.itemName}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {formattedPrice && (
                  <span className="text-xl font-bold text-foreground">{formattedPrice}</span>
                )}
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  title="Edit item"
                >
                  <Edit size={18} />
                </button>
              </div>
            </div>
            
            <p className="text-muted-foreground text-base">{item.storeName}</p>
            
            {/* Only show notes if they exist and aren't empty after cleaning */}
            {cleanNotes && cleanNotes.trim() && (
              <div className="pt-2">
                <p className="text-muted-foreground text-sm break-words">
                  <strong>Note:</strong> {cleanNotes}
                </p>
              </div>
            )}

            {/* Comments disabled since partner functionality removed */}
            {false && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <ItemCommentsThread 
                  itemId={item.id}
                  currentUserId={currentUserId!}
                  autoExpand={true}
                />
              </div>
            )}
          </div>

          {/* Decision buttons flow */}
          {!showDecisionButtons && !showConfirmation ? (
            <div className="pt-2">
              <button 
                onClick={() => {
                  console.log('🚨 BUTTON CLICKED! Current state:', showDecisionButtons);
                  setShowDecisionButtons(true);
                  console.log('🚨 State should now be true');
                }}
                className="w-full py-3 px-4 font-medium rounded-xl transition-colors hover:opacity-90 bg-primary text-primary-foreground"
              >
                {(item.link || (item as any).url) ? 'Decide now' : 'Make a decision'}
              </button>
            </div>
          ) : showDecisionButtons && !showConfirmation ? (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => handleInitialDecision('purchase')}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
              >
                {(item.link || (item as any).url) ? "I'm going to buy this" : "I'm interested in this"}
              </button>
              <button
                onClick={() => handleInitialDecision('let-go')}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
              >
                {(item.link || (item as any).url) ? "I'm ready to let this go" : "I'm done thinking about this"}
              </button>
            </div>
          ) : showConfirmation === 'purchase' ? (
            <div className="space-y-3 pt-2">
              <div className="text-center text-sm text-muted-foreground mb-3">
                You're ready to buy this item:
              </div>
              {(item.link || (item as any).url) && (
                <button
                  onClick={() => handleConfirmedDecision('take-to-link')}
                  className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
                >
                  <div className="text-center leading-tight">
                    <div>Take me to the link</div>
                    <div className="text-xs opacity-80 mt-0.5">(and then mark as purchased)</div>
                  </div>
                </button>
              )}
              <button
                onClick={() => handleConfirmedDecision('mark-purchased')}
                className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl transition-colors"
              >
                Mark as purchased
              </button>
              <button
                onClick={handleBackToDecisions}
                className="w-full py-2 px-4 text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                ← Back to decisions
              </button>
            </div>
          ) : showConfirmation === 'let-go' ? (
            <div className="space-y-3 pt-2">
              <div className="text-center text-sm text-muted-foreground mb-3">
                Are you sure you're ready to let this go?
              </div>
              <button
                onClick={() => handleConfirmedDecision('let-go')}
                className="w-full py-3 px-4 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-medium rounded-xl transition-colors"
              >
                Yes, let it go
              </button>
              <button
                onClick={handleBackToDecisions}
                className="w-full py-2 px-4 text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                ← Back to decisions
              </button>
            </div>
          ) : null}

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

          {/* Edit Modal */}
          <ItemEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            item={item}
            onSave={(updates) => {
              if (onEdit) {
                onEdit(item, updates);
              }
              setShowEditModal(false);
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PausedItemDetail;