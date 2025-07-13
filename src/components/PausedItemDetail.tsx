
import { ExternalLink } from 'lucide-react';
import { PausedItem } from '../stores/supabasePausedItemsStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useMemo, useEffect } from 'react';
import { formatPrice } from '../utils/priceFormatter';
import { useItemActions } from '../hooks/useItemActions';
import ItemImage from './ItemImage';
import PauseDurationBanner from './PauseDurationBanner';
import EmotionBadge from './EmotionBadge';
import { extractActualNotes } from '../utils/notesMetadataUtils';
import { ItemCommentsThread } from './ItemCommentsThread';

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

  // Debug logging
  useEffect(() => {
    console.log('🔍 PausedItemDetail Debug:', {
      sharedWithPartnersLength: sharedWithPartners.length,
      currentUserId: currentUserId,
      itemSharedWith: item.sharedWithPartners,
      shouldShowComments: (sharedWithPartners.length > 0 || (item.sharedWithPartners && item.sharedWithPartners.length > 0)) && currentUserId,
      partners: partners.length,
      itemName: item.itemName,
      isSharedItem: item.sharedWithPartners && item.sharedWithPartners.length > 0
    });
  }, [sharedWithPartners, currentUserId, item.sharedWithPartners, partners, item.itemName]);

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

            {/* Partner badges */}
            {sharedWithPartners.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-sm text-gray-600 dark:text-gray-300">Shared with:</span>
                {sharedWithPartners.map((partner) => (
                  <Avatar key={partner.partner_id} className="h-7 w-7 bg-green-100 border-2 border-green-400 dark:bg-green-900 dark:border-green-500">
                    <AvatarFallback className="text-xs text-green-800 dark:text-green-200">
                      {getInitials(partner.partner_name)}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}

            {/* Tags section */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {item.tags.map((tag, index) => (
                  <span 
                    key={index}
                    className="inline-block px-2 py-1 bg-lavender/20 text-dark-gray dark:text-[#F9F5EB] rounded text-xs border border-lavender/30"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

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
