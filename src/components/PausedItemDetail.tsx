
import { ExternalLink } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMemo, useEffect, useState } from 'react';
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
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  partners?: Partner[];
  currentUserId?: string;
}

const PausedItemDetail = ({ item, isOpen, onClose, onDelete, partners = [], currentUserId }: PausedItemDetailProps) => {
  const { handleViewItem, handleLetGo, handleBought } = useItemActions();
  const { markAsRead } = useItemComments(currentUserId);
  const [showDecisionButtons, setShowDecisionButtons] = useState(false);

  // Mark comments as read when opening the detail view
  useEffect(() => {
    if (isOpen && currentUserId) {
      markAsRead(item.id);
    }
  }, [isOpen, item.id, currentUserId, markAsRead]);

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
    try {
      if (decision === 'purchase') {
        await handleBought(item, onDelete, onClose);
      } else {
        await handleLetGo(item, onDelete, onClose);
      }
    } catch (error) {
      console.error('Error handling decision:', error);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm w-[calc(100vw-2rem)] mx-auto p-6 rounded-3xl bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 max-h-[85vh] overflow-y-auto fixed"
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
              <h3 className="text-xl font-bold text-black dark:text-[#F9F5EB] leading-tight">{item.itemName}</h3>
              {formattedPrice && (
                <span className="text-xl font-bold text-black dark:text-[#F9F5EB] ml-2">{formattedPrice}</span>
              )}
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 text-base">{item.storeName}</p>
            
            <EmotionBadge emotion={item.emotion} />

            {/* Only show notes if they exist and aren't empty after cleaning */}
            {cleanNotes && cleanNotes.trim() && (
              <div className="pt-2">
                <p className="text-gray-600 dark:text-gray-300 text-sm break-words">
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

          {/* Decision buttons - only show if current user is the item owner */}
          {currentUserId === item.originalUserId && (
            <>
              {!showDecisionButtons ? (
                <div className="pt-2">
                  <button 
                    onClick={handleDecisionClick}
                    className="w-full py-3 px-4 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-black dark:text-[#F9F5EB] font-medium rounded-xl border border-lavender/30 dark:border-gray-600 transition-colors"
                  >
                    Decide now
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  <button
                    onClick={() => handleDecision('purchase')}
                    className="w-full py-3 px-4 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-black dark:text-[#F9F5EB] font-medium rounded-xl border border-lavender/30 dark:border-gray-600 transition-colors"
                  >
                    I'm going to buy this
                  </button>
                  <button
                    onClick={() => handleDecision('let-go')}
                    className="w-full py-3 px-4 bg-white/60 dark:bg-white/10 hover:bg-white/80 dark:hover:bg-white/20 text-black dark:text-[#F9F5EB] font-medium rounded-xl border border-lavender/30 dark:border-gray-600 transition-colors"
                  >
                    I'm ready to let this go
                  </button>
                </div>
              )}
            </>
          )}

          {/* Legacy decision buttons - keep for backward compatibility but hide when new buttons are shown */}
          {currentUserId === item.originalUserId && !showDecisionButtons && (
            <>
              {/* Let it go button */}
              <div className="pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full bg-transparent border-4 border-lavender hover:bg-lavender/10 dark:hover:bg-lavender/20 text-black dark:text-[#F9F5EB] font-medium py-2 px-4 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]">
                      {item.isCart ? 'Let This Cart Go' : 'Let This Item Go'}
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">
                        {item.isCart ? 'Let go of this cart?' : 'Let go of this item?'}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                        This will move "{item.itemName}" to your pause log. You can always see what you've let go of in your pause log section.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20" onClick={handleKeepPaused}>Keep paused</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleLetGo(item, onDelete, onClose)} className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black">
                        Let it go
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              {/* I bought this button */}
              <div className="text-center">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-[#F9F5EB] transition-colors duration-200 underline">
                      I Purchased This
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Mark as purchased?</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                        This will move "{item.itemName}" to your Pause Log as a thoughtful purchase decision.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20" onClick={handleKeepPaused}>Keep paused</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleBought(item, onDelete, onClose)} className="rounded-2xl bg-lavender hover:bg-lavender/90 text-black">
                        Yes, I bought it
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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
                className="text-gray-600 dark:text-gray-300 text-sm hover:text-black dark:hover:text-[#F9F5EB] transition-colors duration-200 flex items-center gap-1 bg-transparent border-none cursor-pointer"
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
                <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 text-sm">
                  Delete item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#FAF6F1] dark:bg-[#200E3B] border-gray-200 dark:border-gray-600 rounded-3xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-black dark:text-[#F9F5EB]">Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-600 dark:text-gray-300">
                    This will permanently delete "{item.itemName}" from your paused items. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-2xl bg-white dark:bg-white/10 border-gray-200 dark:border-gray-600 text-black dark:text-[#F9F5EB] hover:bg-gray-50 dark:hover:bg-white/20">Cancel</AlertDialogCancel>
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
